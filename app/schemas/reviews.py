from pydantic import BaseModel, ConfigDict, Field

from datetime import datetime


class Review(BaseModel):
    """
    Модель для ответа с данными отзыва.
    Используется в GET-запросах.
    """
    id: int
    user_id: int
    product_id: int
    username: str
    comment: str
    comment_date: datetime
    grade: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ReviewCreate(BaseModel):
    """
    Модель для создания отзыва.
    Используется в POST запросах.
    """
    product_id: int = Field(..., description="Уникальный идентификатор товара на который оставлен отзыв")
    comment: str | None = Field(None, description="Содержимое отзыва")
    grade: int = Field(ge=1, le=5, description="Оценка отзыва на товар")