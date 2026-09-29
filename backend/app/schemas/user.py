from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.security import BCRYPT_MAX_PASSWORD_BYTES
from app.models.user import Role


class UserOut(BaseModel):
    """Public user representation, serialised with the frontend's field names."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str = Field(serialization_alias="fullName")
    role: Role
    is_active: bool = Field(serialization_alias="isActive")


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=BCRYPT_MAX_PASSWORD_BYTES)
    full_name: str = Field(min_length=1, max_length=120)
    role: Role = Role.EMPLOYEE
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError("password must not exceed 72 bytes")
        return value


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None


class RoleUpdate(BaseModel):
    role: Role
