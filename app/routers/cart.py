from fastapi import APIRouter, HTTPException, status, Depends, Response

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, delete

from app.models.products import Product as ProductModel
from app.models.cart_items import CartItem as CartItemModel
from app.models.users import User as UserModel

from app.schemas.cart_items import (
    CartItemCreate,
    CartItemSchema,
    Cart as CartSchema,
    CartItemUpdate
)

from app.dependencies import get_async_db

from app.auth import get_current_user


from app.queries.selector import check_active_product

from decimal import Decimal

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
)

async def _get_cart_item(
    db: AsyncSession, user_id: int, product_id: int
) -> CartItemModel | None:
    """Проверка наличия товара в корзине текущего пользователя."""
    result = await db.scalars(
        select(CartItemModel)
        .options(selectinload(CartItemModel.product))
        .where(
            CartItemModel.user_id == user_id,
            CartItemModel.product_id == product_id,
        )
    )
    return result.first()

@router.get("/", response_model=CartSchema)
async def get_cart(
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    result = await db.scalars(
        select(CartItemModel)
        .options(selectinload(CartItemModel.product))
        .where(CartItemModel.user_id == current_user.id)
        .order_by(CartItemModel.id)
    )
    items = result.all()

    total_quantity = sum(item.quantity for item in items)
    price_items = (
        Decimal(item.quantity) *
        (item.product.price if item.product.price is not None else Decimal("0"))
        for item in items
    )
    total_price_decimal = sum(price_items, Decimal("0.00"))

    return CartSchema(
        user_id=current_user.id,
        items=items,
        total_quantity=total_quantity,
        total_price=total_price_decimal
    )

@router.post("/items", response_model=CartItemSchema)
async def add_item_to_cart(
        payload: CartItemCreate,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    product = await check_active_product(payload.product_id, db)
    if product.stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This quantity of the product is not available.")
    cart_item: CartItemModel = await _get_cart_item(db, current_user.id, payload.product_id)
    if cart_item:
        cart_item.quantity += payload.quantity
    else:
        cart_item = CartItemModel(**payload.model_dump(), user_id=current_user.id)
        db.add(cart_item)

    await db.commit()
    updated_item = await _get_cart_item(db, current_user.id, payload.product_id)
    return updated_item

@router.put("/items/{product_id}", response_model=CartItemSchema)
async def update_cart_item(
    product_id: int,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    product = await check_active_product(product_id, db)
    if product.stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This quantity of the product is not available.")

    cart_item = await _get_cart_item(db, current_user.id, product_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    cart_item.quantity = payload.quantity
    await db.commit()
    updated_item = await _get_cart_item(db, current_user.id, product_id)
    return updated_item

@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_cart(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    cart_item = await _get_cart_item(db, current_user.id, product_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db.delete(cart_item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    await db.execute(delete(CartItemModel).where(CartItemModel.user_id == current_user.id))
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



