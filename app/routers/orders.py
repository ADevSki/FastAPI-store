from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.dependencies import get_async_db
from app.models.cart_items import CartItem as CartItemModel
from app.models.orders import Order as OrderModel, OrderItem as OrderItemModel
from app.models.users import User as UserModel
from app.models.products import Product as ProductModel
from app.schemas.orders import Order as OrderSchema, OrderList, OrderRequest

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)


async def _load_order_with_items(db: AsyncSession, order_id: int) -> OrderModel | None:
    return await db.scalar(
        select(OrderModel)
        .options(
            selectinload(OrderModel.items).selectinload(OrderItemModel.product),
        )
        .where(OrderModel.id == order_id)
    )

@router.post("/checkout", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def checkout_order(
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
):
    """
    Создаёт заказ на основе текущей корзины пользователя.
    Сохраняет позиции заказа, вычитает остатки и очищает корзину.
    """

    #Получаем корзину пользователя
    cart_result = await db.scalars(
        select(CartItemModel)
        .options(selectinload(CartItemModel.product))
        .where(CartItemModel.user_id == current_user.id)
        .order_by(CartItemModel.id)
    )
    cart_items = cart_result.all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty!")

    #Создаем orm-объект заказа
    order = OrderModel(user_id=current_user.id)
    total_amount = Decimal("0")

    for item in cart_items:
        product: ProductModel = item.product

        # Проверяем, существует ли товар
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item.product_id} is unavailable"
            )

        # Проверяем, что товар в достатке
        if item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product {product.name}!"
            )

        unit_price = product.price
        total_price = unit_price * item.quantity
        total_amount += total_price

        #Создаем orm-объект для объекта заказа
        order_item = OrderItemModel(
            product_id=item.product_id,
            # order_id=order.id, явно не присваиваем,
            # так как с помощью relationship(1:N) при order.items.append(order_item) присвоится автоматически
            quantity=item.quantity,
            unit_price=unit_price,
            total_price=total_price,
        )
        order.items.append(order_item)

        product.stock -= item.quantity

    order.total_amount = total_amount
    db.add(order)

    #Очищаем корзину пользователя
    await db.execute(delete(CartItemModel).where(CartItemModel.user_id == current_user.id))
    await db.commit()

    created_order = await _load_order_with_items(db, order.id)
    if not created_order:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load created order",
        )
    return created_order

@router.get("/", response_model=OrderList)
async def list_orders(
    request: Annotated[OrderRequest, Query()],
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает заказы текущего пользователя с простой пагинацией.
    """
    total = await db.scalar(
        select(func.count(OrderModel.id)).where(OrderModel.user_id == current_user.id)
    )
    result = await db.scalars(
        select(OrderModel)
        .options(selectinload(OrderModel.items).selectinload(OrderItemModel.product))
        .where(OrderModel.user_id == current_user.id)
        .order_by(OrderModel.created_at.desc())
        .offset((request.page - 1) * request.page_size)
        .limit(request.page_size)
    )
    orders = result.all()
    return OrderList(items=orders, total=total or 0, page=request.page, page_size=request.page_size)


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Возвращает детальную информацию по заказу, если он принадлежит пользователю.
    """
    order = await _load_order_with_items(db, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.get("/{order_id}/status")
async def get_order_status(
        order_id: int,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user),
) -> dict:
    order : OrderModel = await db.scalar(
        select(OrderModel)
        .where(
            OrderModel.id == order_id,
            OrderModel.user_id == current_user.id
        )
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order is not found!")
    match order.status:
        case "paid": message = f"Спасибо! Заказ #{order_id} оплачен. Ожидайте доставку."
        case "canceled", "failed": message = "Оплата не прошла. Попробуйте еще раз."
        case "pending": message = "Оплата в процессе..."
        case _: message = "Неизвестный статус."

    return {
        "order_id": order_id,
        "status": order.status,
        "paid_at": order.paid_at,
        "message": message
    }
