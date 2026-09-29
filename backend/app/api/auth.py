from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.db import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _invalid_credentials() -> HTTPException:
    """The same 401 for an unknown email, a wrong password and a disabled
    account, so login never reveals which one it was."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    """Exchange email and password for a bearer token."""
    user = db.scalar(select(User).where(User.email == payload.email))
    if (
        user is None
        or not verify_password(payload.password, user.hashed_password)
        or not user.is_active
    ):
        raise _invalid_credentials()

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserOut:
    """Return the profile of the authenticated user."""
    return UserOut.model_validate(current_user)
