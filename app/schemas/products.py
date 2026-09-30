from typing import Annotated

from pydantic import BaseModel, Field, ConfigDict

from decimal import Decimal

from fastapi import Form


class ProductCreate(BaseModel):
    """
    Модель для создания и обновления товара.
    Используется в POST и PUT запросах.
    """
    name: str = Field(..., min_length=3, max_length=100,
                      description="Название товара (3-100 символов)")
    description: str | None = Field(None, max_length=500,
                                       description="Описание товара (до 500 символов)")
    price: Decimal = Field(..., gt=0, description="Цена товара (больше 0)", decimal_places=2)
    stock: int = Field(..., ge=0, description="Количество товара на складе (0 или больше)")
    category_id: int = Field(..., description="ID категории, к которой относится товар")

    @classmethod
    def as_form(
            cls,
            name: Annotated[str, Form(min_length=3, max_length=100)],
            price: Annotated[Decimal, Form(gt=0)],
            stock: Annotated[int, Form(ge=0)],
            category_id: Annotated[int, Form()],
            description: Annotated[str | None, Form()] = None,
    ) -> "ProductCreate":
        return cls(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
        )


class Product(BaseModel):
    """
    Модель для ответа с данными товара.
    Используется в GET-запросах.
    """
    id: int = Field(..., description="Уникальный идентификатор товара")
    name: str = Field(..., description="Название товара")
    description: str | None = Field(None, description="Описание товара")
    price: Decimal = Field(..., description="Цена товара в рублях", gt=0, decimal_places=2, json_schema_extra={"example": 8500.00})
    image_url: str | None = Field(None, description="URL изображения товара")
    stock: int = Field(..., description="Количество товара на складе")
    category_id: int = Field(..., description="ID категории")
    seller_id: int = Field(..., description="ID продавца")
    is_active: bool = Field(..., description="Активность товара")
    rating: Decimal = Field(..., description="Средняя оценка товара", json_schema_extra={"example": 3.85})

    model_config = ConfigDict(from_attributes=True)


class ProductList(BaseModel):
    """
    Список пагинации для товаров.
    """
    items: list[Product] = Field(description="Товары для текущей страницы")
    total: int = Field(ge=0, description="Общее количество товаров")
    page: int = Field(ge=1, description="Номер текущей страницы")
    page_size: int = Field(ge=1, description="Количество элементов на странице")

    model_config = ConfigDict(from_attributes=True)  # Для чтения из ORM-объектов


class ProductRequests(BaseModel):
    """Запрос для формирования пагинации и фильтрации по товарам"""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    category_id: int | None = Field(None, description="ID категории товара")
    min_price: float | None = Field(None, description="Минимальная цена")
    max_price: float | None = Field(None, description="Максимальная цена")
    in_stock: bool | None = Field(None, description="True - товары только в наличии, false - без остатка")
    seller_id: int | None = Field(None, description="Фильтрация по пользователю")
    sort_by_date: bool | None = Field(None, description="Сортировка по времени")
    search: str | None = Field(None, min_length=1, description="Поиск по названию товара")