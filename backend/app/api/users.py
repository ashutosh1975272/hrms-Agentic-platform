"""Admin-only user administration endpoints.

Every route depends on a ``RoleChecker`` from the permission layer, so the
PROJECT.md section 13 matrix is what grants or refuses access here.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import Permission, RoleChecker, has_permission
from app.core.security import hash_password
from app.db import get_db
from app.models.user import User
from app.schemas.user import RoleUpdate, UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _manage_users() -> RoleChecker:
    return RoleChecker(Permission.MANAGE_USERS)


def _own_or_admin() -> RoleChecker:
    """Admin may act on any record; anyone else only on their own."""
    return RoleChecker(
        Permission.MANAGE_USERS,
        alternatives=(Permission.VIEW_OWN_PROFILE,),
        owner_path_param="user_id",
    )


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.get("", response_model=list[UserOut])
def list_users(
    _: Annotated[User, Depends(_manage_users())],
    db: Annotated[Session, Depends(get_db)],
) -> list[User]:
    """List every account. Admin only."""
    return list(db.scalars(select(User).order_by(User.id)))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    _: Annotated[User, Depends(_manage_users())],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Create an account with a bcrypt-hashed password. Admin only."""
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email is already registered"
        ) from None
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def read_user(
    user_id: int,
    _: Annotated[User, Depends(_own_or_admin())],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Read an account. Admin may read any; other roles only their own."""
    return _get_user_or_404(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: Annotated[User, Depends(_own_or_admin())],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Update an account.

    Admin may update any account. Other roles reach this route only for their
    own record and are limited to their own profile data, so they can neither
    change the ``is_active`` flag nor touch any other account.
    """
    is_admin = has_permission(current_user.role, Permission.MANAGE_USERS)
    if not is_admin and payload.is_active is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an Admin can change the active flag of an account",
        )

    user = _get_user_or_404(db, user_id)
    # exclude_none matters: the columns are NOT NULL, so an explicit null must
    # leave the stored value alone rather than raise a 500.
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/role", response_model=UserOut)
def change_user_role(
    user_id: int,
    payload: RoleUpdate,
    _: Annotated[User, Depends(RoleChecker(Permission.MANAGE_ROLES))],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Change an account's role. Admin only (PROJECT.md section 13)."""
    user = _get_user_or_404(db, user_id)
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(_manage_users())],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Delete an account. Admin only, and never their own."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An Admin cannot delete their own account",
        )
    user = _get_user_or_404(db, user_id)
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
