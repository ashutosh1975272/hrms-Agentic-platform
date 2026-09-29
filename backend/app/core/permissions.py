"""Server-side permission layer for PROJECT.md section 13.

Every protected route depends on a :class:`RoleChecker`, so authorization is
enforced by the API itself and never left to the frontend. The matrix below is
the single source of truth: adding an operation means adding a row here, not a
hand-written role check inside a route.

The matrix is expressed with a *scope* per role instead of a boolean, because
PROJECT.md section 13 grants employees "Limited / Own Data" access for some
operations. ``Scope.OWN`` means the call is allowed only when the record being
touched belongs to the caller; ``Scope.ANY`` means any record; ``None`` denies.
"""

from __future__ import annotations

import enum
from collections.abc import Sequence
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, oauth2_scheme
from app.db import get_db
from app.models.user import Role, User


class Permission(str, enum.Enum):
    """An operation the permission layer can authorize."""

    VIEW_OWN_PROFILE = "view_own_profile"
    VIEW_ALL_EMPLOYEES = "view_all_employees"
    CREATE_EMPLOYEE = "create_employee"
    UPDATE_EMPLOYEE = "update_employee"
    DELETE_EMPLOYEE = "delete_employee"
    APPLY_LEAVE = "apply_leave"
    APPROVE_LEAVE = "approve_leave"
    VIEW_POLICIES = "view_policies"
    MANAGE_ROLES = "manage_roles"
    MANAGE_USERS = "manage_users"


class Scope(str, enum.Enum):
    """How far a granted permission reaches."""

    ANY = "any"
    OWN = "own"


_ANY = Scope.ANY
_OWN = Scope.OWN
_DENIED: Scope | None = None

# PROJECT.md section 13, verbatim, plus MANAGE_USERS: the user-administration
# surface PROJECT.md section 4.1 grants to Admin ("Manage HR users and employee
# accounts") and to nobody else.
SECTION_13_MATRIX: dict[Permission, dict[Role, Scope | None]] = {
    Permission.VIEW_OWN_PROFILE: {
        Role.ADMIN: _OWN,
        Role.HR: _OWN,
        Role.EMPLOYEE: _OWN,
    },
    Permission.VIEW_ALL_EMPLOYEES: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _DENIED,
    },
    Permission.CREATE_EMPLOYEE: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _DENIED,
    },
    Permission.UPDATE_EMPLOYEE: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _OWN,
    },
    Permission.DELETE_EMPLOYEE: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _DENIED,
    },
    Permission.APPLY_LEAVE: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _ANY,
    },
    Permission.APPROVE_LEAVE: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _DENIED,
    },
    Permission.VIEW_POLICIES: {
        Role.ADMIN: _ANY,
        Role.HR: _ANY,
        Role.EMPLOYEE: _ANY,
    },
    Permission.MANAGE_ROLES: {
        Role.ADMIN: _ANY,
        Role.HR: _DENIED,
        Role.EMPLOYEE: _DENIED,
    },
    Permission.MANAGE_USERS: {
        Role.ADMIN: _ANY,
        Role.HR: _DENIED,
        Role.EMPLOYEE: _DENIED,
    },
}


class PermissionDeniedError(Exception):
    """Raised when the matrix refuses an operation for a role and target."""

    def __init__(self, permission: Permission, role: Role) -> None:
        super().__init__(
            f"Role '{role.value}' is not allowed to perform '{permission.value}'"
        )
        self.permission = permission
        self.role = role


def scope_for(permission: Permission, role: Role) -> Scope | None:
    """Return the scope ``role`` holds for ``permission``, or ``None`` if denied."""
    return SECTION_13_MATRIX[permission].get(role)


def has_permission(role: Role, permission: Permission) -> bool:
    """Return whether ``role`` holds ``permission`` at any scope."""
    return scope_for(permission, role) is not None


def check_permission(
    permission: Permission,
    *,
    role: Role,
    actor_id: int | None = None,
    target_owner_id: int | None = None,
) -> Scope:
    """Authorize one operation and return the scope it was granted at.

    A ``Scope.OWN`` grant is refused unless the caller has been matched against
    the owner of the record it is touching, so an unresolved or mismatched
    target denies by default rather than allowing by default.
    """
    granted = scope_for(permission, role)
    if granted is None:
        raise PermissionDeniedError(permission, role)
    if granted is Scope.OWN and (
        actor_id is None or target_owner_id is None or target_owner_id != actor_id
    ):
        raise PermissionDeniedError(permission, role)
    return granted


def _owner_id_from_path(request: Request, path_param: str) -> int | None:
    raw = request.path_params.get(path_param)
    try:
        return int(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


class RoleChecker:
    """Dependency factory enforcing a single permission from the matrix.

    ``alternatives`` lets a route accept either a privileged permission (for
    example ``MANAGE_USERS`` for an Admin reading anyone's record) or a
    self-service one (for example ``VIEW_OWN_PROFILE`` for a user reading their
    own). Each alternative is evaluated with its own scope, so an own-data
    alternative still only matches the caller's own record.

    ``owner_path_param`` names the path parameter holding the record id, which
    is what own-data permissions are matched against.
    """

    def __init__(
        self,
        permission: Permission,
        *,
        alternatives: Sequence[Permission] = (),
        owner_path_param: str | None = None,
    ) -> None:
        self.permission = permission
        self.alternatives = tuple(alternatives)
        self.owner_path_param = owner_path_param

    def __call__(
        self,
        request: Request,
        token: Annotated[str, Depends(oauth2_scheme)],
        db: Annotated[Session, Depends(get_db)],
    ) -> User:
        current_user = get_current_user(token=token, db=db)
        owner_id = (
            _owner_id_from_path(request, self.owner_path_param)
            if self.owner_path_param is not None
            else None
        )
        for permission in (self.permission, *self.alternatives):
            try:
                check_permission(
                    permission,
                    role=current_user.role,
                    actor_id=current_user.id,
                    target_owner_id=owner_id,
                )
            except PermissionDeniedError:
                continue
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Role '{current_user.role.value}' is not allowed to perform "
                f"'{self.permission.value}'"
            ),
        )
