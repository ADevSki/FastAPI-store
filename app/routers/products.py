from pathlib import Path
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, status, HTTPException, Query, UploadFile, File

from app.dependencies import get_async_db

from app.models.users import User as UserModel
from app.models.products import Product as ProductModel
from app.models.reviews import Review as ReviewModel

from app.schemas.products import Product as ProductSchema, ProductCreate, ProductList, ProductRequests
from app.schemas.reviews import Review as ReviewSchema

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.queries.selector import check_active_product, check_active_category
from app.services.images_service import save_product_image, remove_product_image

from app.auth import get_current_user

# Создаём маршрутизатор для товаров
router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.get("/", response_model=ProductList)
async def get_all_products(
        request: Annotated[ProductRequests, Query()],
        db: AsyncSession = Depends(get_async_db)
):
    """
    Возвращает список всех товаров.
    """
    if request.min_price is not None and request.max_price is not None and request.min_price > request.max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Минимальная цена не может быть больше максимальной!"
        )

    filters = [ProductModel.is_active == True]

    if request.category_id is not None:
        filters.append(ProductModel.category_id == request.category_id)
    if request.min_price is not None:
        filters.append(ProductModel.price >= request.min_price)
    if request.max_price is not None:
        filters.append(ProductModel.price <= request.max_price)
    if request.in_stock is not None:
        filters.append(ProductModel.stock > 0 if request.in_stock else ProductModel.stock == 0)
    if request.seller_id is not None:
        filters.append(ProductModel.seller_id == request.seller_id)

    rank_col = None
    if request.search is not None:
        search = request.search.strip()
        if search:
            ts_query = func.websearch_to_tsquery('english', search)
            filters.append(ProductModel.tsv.op('@@')(ts_query))
            rank_col = func.ts_rank_cd(ProductModel.tsv, ts_query).label("rank")

    total_stmt = select(func.count()).select_from(ProductModel).where(
        *filters
    )

    total = await db.scalar(total_stmt) or 0

    if rank_col is not None:
        products_stmt = (
            select(ProductModel, rank_col)
            .where(*filters)
            .order_by(
                desc(rank_col), ProductModel.id
                if not request.sort_by_date else ProductModel.created_at
            )
            .offset((request.page - 1) * request.page_size)
            .limit(request.page_size)
        )
        rows = (await db.execute(products_stmt)).all()
        items = [row[0] for row in rows]
    else:
        products_stmt = (
            select(ProductModel)
            .where(*filters)
            .order_by(ProductModel.id)
            .offset((request.page - 1) * request.page_size)
            .limit(request.page_size)
        )
        items = (await db.scalars(products_stmt)).all()
    return {
        "items": items,
        "total": total,
        "page": request.page,
        "page_size": request.page_size,
        #"seller_id": items.seller_id,
    }


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate = Depends(ProductCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Создаёт новый товар, привязанный к текущему продавцу(Только для ролей 'seller').
    """

    await check_active_category(product.category_id, db)

    image_url = await save_product_image("products", image) if image else None
    new_product = ProductModel(
        **product.model_dump(),
        seller_id=current_user.id,
        image_url=image_url
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product


@router.get("/category/{category_id}", response_model=list[ProductSchema])
async def get_products_by_category(category_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Возвращает список товаров в указанной категории по её ID.
    """
    await check_active_category(category_id, db)
    stmt = select(ProductModel).where(
        ProductModel.category_id == category_id,
        ProductModel.is_active == True
    )
    return (await db.scalars(stmt)).all()


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(product_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Возвращает детальную информацию о товаре по его ID.
    """
    product = await check_active_product(product_id, db)
    await check_active_category(product.category_id, db)
    return product

@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
        product_id: int,
        product: ProductCreate = Depends(ProductCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Обновляет товар по его ID.
    """
    updated_product: ProductModel | None = await check_active_product(product_id, db)
    if updated_product.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You can only update your own products')
    await check_active_category(product.category_id, db)
    for key, value in product.model_dump().items():
        setattr(updated_product, key, value)

    if image:
        remove_product_image(updated_product.image_url)
        updated_product.image_url = await save_product_image("products", image)
    await db.commit()
    await db.refresh(updated_product)
    return updated_product


@router.delete("/{product_id}", response_model=ProductSchema)
async def delete_product(
        product_id: int,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Удаляет товар по его ID.
    """
    product = await check_active_product(product_id, db)
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You can only delete your own products'
        )
    remove_product_image(product.image_url)
    product.is_active = False
    product.image_url = None
    await db.commit()
    await db.refresh(product)
    return product

@router.get("/{product_id}/reviews/", response_model=list[ReviewSchema])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_async_db)):
    """Получить все отзывы по продукту."""
    await check_active_product(product_id, db)
    results = await  db.scalars(
        select(ReviewModel)
        .options(selectinload(ReviewModel.user))
        .where(
            ReviewModel.product_id == product_id,
            ReviewModel.is_active == True
        )
    )
    reviews = results.all()
    return [
        {
            "id": review.id,
            "user_id": review.user_id,
            "product_id": review.product_id,
            "username": review.user.username,
            "comment": review.comment,
            "comment_date": review.comment_date,
            "grade": review.grade,
            "is_active": review.is_active,
        }
        for review in reviews
    ]