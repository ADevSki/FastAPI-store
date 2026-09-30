from pydantic import BaseModel, EmailStr, Field, SecretStr, ConfigDict


class UserCreate(BaseModel):
    email: EmailStr = Field(description="Электронный адрес пользователя")
    username: str = Field(
        min_length=5,
        max_length=32,
        pattern=r"^[A-Za-z0-9]+$",
        description="Логин пользователя"
    )
    password: SecretStr = Field(
        min_length=8,
        description="Пароль (минимум 8 символов)"
    )
    #role: str = Field(default="buyer", pattern="^(buyer|seller|admin)$", description="Роль пользователя")

class User(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool
    role: str
    model_config = ConfigDict(from_attributes=True)

class RefreshTokenRequest(BaseModel):
    refresh_token: str