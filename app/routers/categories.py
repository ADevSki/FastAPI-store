from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User as UserModel
from app.models.categories import Category as CategoryModel
from app.schemas.categories import Category as CategorySchema, CategoryCreate
from app.dependencies import get_async_db

from app.queries.selector import check_active_category
from app.services.images_service import save_product_image, remove_product_image

from app.auth import get_current_role


# Создаём маршрутизатор с префиксом и тегом
router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


@router.get("/", response_model=list[CategorySchema])
async def get_all_categories(db: AsyncSession = Depends(get_async_db)):
    """
    Возвращает список всех категорий товаров.
    """
    result = await db.scalars(select(CategoryModel).where(CategoryModel.is_active == True))
    categories = result.all()
    return categories


@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
        category: CategoryCreate = Depends(CategoryCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_role("admin"))
):
    """
    Создаёт новую категорию. Доступно только администратору.
    """
    # Проверка существования parent_id, если указан
    if category.parent_id is not None:
        await check_active_category(category.parent_id, db)
    image_url = await save_product_image("categories", image) if image else None

    # Проверяем, не занят ли slug
    stmt = select(CategoryModel).where(CategoryModel.slug == category.slug)
    item = await db.scalar(stmt)
    if item is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A category with this slug already exists")

    # Создание новой категории
    db_category = CategoryModel(
        **category.model_dump(),
        image_url=image_url
    )
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category



@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
        category_id: int,
        category: CategoryCreate = Depends(CategoryCreate.as_form),
        image: UploadFile | None = File(None),
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_role("admin"))
):
    """
    Обновляет категорию по её ID. Доступно только администратору.
    """
    updated_category = await check_active_category(category_id, db, status_code=status.HTTP_404_NOT_FOUND)
    if category.parent_id is not None:
        await check_active_category(category.parent_id, db)

    #Проверяем, не занят ли slug
    stmt = select(CategoryModel).where(CategoryModel.slug == category.slug)
    item = await db.scalar(stmt)
    if item is not None and item.id != updated_category.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A category with this slug already exists")

    for key, value in category.model_dump().items():
        setattr(updated_category, key, value)

    if image:
        remove_product_image(updated_category.image_url)
        updated_category.image_url = await save_product_image("categories", image)
    await db.commit()
    await db.refresh(updated_category)
    return updated_category


@router.delete("/{category_id}", response_model=CategorySchema, status_code=status.HTTP_200_OK)
async def delete_category(
        category_id: int,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_role("admin"))
):
    """
        Удаляет категорию по её ID. Доступно только администратору.
    """
    category = await check_active_category(category_id, db, status_code=status.HTTP_404_NOT_FOUND)
    category.is_active = False
    await db.commit()
    return category