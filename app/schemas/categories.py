from pydantic import BaseModel, Field, ConfigDict

from decimal import Decimal

from typing import Annotated

from fastapi import Form


class CategoryCreate(BaseModel):
    """
    Модель для создания и обновления категории.
    Используется в POST и PUT запросах.
    """
    name: str = Field(..., min_length=3, max_length=50,
                      description="Название категории (3-50 символов)")
    slug: str = Field(..., max_length=100, description="Уникальный URL категории")
    parent_id: int | None = Field(None, description="ID родительской категории, если есть")

    @classmethod
    def as_form(
            cls,
            name: Annotated[str, Form(min_length=3, max_length=50)],
            slug: Annotated[str, Form(max_length=100)],
            parent_id: Annotated[int | None, Form()] = None,
    ) -> "CategoryCreate":
        return cls(
            name=name,
            slug=slug,
            parent_id=parent_id
        )


class Category(BaseModel):
    """
    Модель для ответа с данными категории.
    Используется в GET-запросах.
    """
    id: int = Field(..., description="Уникальный идентификатор категории")
    name: str = Field(..., description="Название категории")
    image_url: str | None = Field(None, description="URL изображения категории")
    slug: str = Field(..., description="Уникальный URL категории")
    parent_id: int | None
    is_active: bool = Field(..., description="Активность категории")

    model_config = ConfigDict(from_attributes=True)
