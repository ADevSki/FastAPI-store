from pydantic import BaseModel, Field, ConfigDict

from app.schemas.products import Product

from decimal import Decimal

class CartItemBase(BaseModel):
    """Базовая модель для наследования общих параметров в дочерние модели"""
    product_id: int = Field(description="ID товара")
    quantity: int = Field(ge=1, description="Количество товара")

class CartItemSchema(BaseModel):
    """Модель для вывода информации по товару в корзине"""
    id: int = Field(..., description="ID позиции корзины")
    quantity: int = Field(..., ge=1, description="Количество товара")
    product: Product = Field(..., description="Информация о товаре")

    model_config = ConfigDict(from_attributes=True)

class CartItemCreate(CartItemBase):
    """Модель для добавления нового товара в корзину"""
    pass

class CartItemUpdate(BaseModel):
    """Модель для обновления количества товара в корзине"""
    quantity: int = Field(..., ge=1, description="Новое количество товара")

class Cart(BaseModel):
    """Полная информация о корзине пользователя."""
    user_id: int = Field(..., description="ID пользователя")
    items: list[CartItemSchema] = Field(default_factory=list, description="Содержимое корзины")
    total_quantity: int = Field(..., ge=0, description="Общее количество товаров")
    total_price: Decimal = Field(..., ge=0, description="Общая стоимость товаров", json_schema_extra={"example": 100.50})

    model_config = ConfigDict(from_attributes=True)
