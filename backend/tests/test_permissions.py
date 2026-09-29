import pytest

from app.core.permissions import (
    Permission,
    PermissionDeniedError,
    Scope,
    check_permission,
    has_permission,
    scope_for,
)
from app.models.user import Role

ANY = Scope.ANY
OWN = Scope.OWN
DENIED = None

SECTION_13_MATRIX = [
    (Permission.VIEW_OWN_PROFILE, OWN, OWN, OWN),
    (Permission.VIEW_ALL_EMPLOYEES, ANY, ANY, DENIED),
    (Permission.CREATE_EMPLOYEE, ANY, ANY, DENIED),
    (Permission.UPDATE_EMPLOYEE, ANY, ANY, OWN),
    (Permission.DELETE_EMPLOYEE, ANY, ANY, DENIED),
    (Permission.APPLY_LEAVE, ANY, ANY, ANY),
    (Permission.APPROVE_LEAVE, ANY, ANY, DENIED),
    (Permission.VIEW_POLICIES, ANY, ANY, ANY),
    (Permission.MANAGE_ROLES, ANY, DENIED, DENIED),
]


@pytest.mark.parametrize(
    "permission, admin_scope, hr_scope, employee_scope",
    SECTION_13_MATRIX,
    ids=[case[0].value for case in SECTION_13_MATRIX],
)
def test_matrix_matches_project_md_section_13(
    permission, admin_scope, hr_scope, employee_scope
):
    assert scope_for(permission, Role.ADMIN) is admin_scope
    assert scope_for(permission, Role.HR) is hr_scope
    assert scope_for(permission, Role.EMPLOYEE) is employee_scope


@pytest.mark.parametrize(
    "permission", [Permission.MANAGE_USERS, Permission.MANAGE_ROLES]
)
def test_user_management_is_denied_to_every_non_admin_role(permission):
    assert scope_for(permission, Role.ADMIN) is ANY
    assert scope_for(permission, Role.HR) is DENIED
    assert scope_for(permission, Role.EMPLOYEE) is DENIED


def test_has_permission_is_true_only_for_granted_combinations():
    assert has_permission(Role.ADMIN, Permission.MANAGE_ROLES) is True
    assert has_permission(Role.HR, Permission.MANAGE_ROLES) is False
    assert has_permission(Role.EMPLOYEE, Permission.MANAGE_ROLES) is False


def test_check_permission_returns_any_for_an_unscoped_employee_permission():
    scope = check_permission(Permission.APPLY_LEAVE, role=Role.EMPLOYEE, actor_id=7)

    assert scope is ANY


def test_check_permission_raises_for_a_denied_role():
    with pytest.raises(PermissionDeniedError):
        check_permission(Permission.MANAGE_ROLES, role=Role.HR, actor_id=7)


def test_check_permission_reports_the_denied_permission_and_role():
    with pytest.raises(PermissionDeniedError) as excinfo:
        check_permission(Permission.MANAGE_USERS, role=Role.EMPLOYEE, actor_id=7)

    assert excinfo.value.permission is Permission.MANAGE_USERS
    assert excinfo.value.role is Role.EMPLOYEE


def test_check_permission_allows_an_own_scope_act_on_its_own_record():
    scope = check_permission(
        Permission.UPDATE_EMPLOYEE,
        role=Role.EMPLOYEE,
        actor_id=7,
        target_owner_id=7,
    )

    assert scope is OWN


def test_check_permission_denies_an_own_scope_act_on_another_record():
    with pytest.raises(PermissionDeniedError):
        check_permission(
            Permission.UPDATE_EMPLOYEE,
            role=Role.EMPLOYEE,
            actor_id=7,
            target_owner_id=8,
        )


def test_check_permission_denies_an_own_scope_act_without_a_resolved_target():
    with pytest.raises(PermissionDeniedError):
        check_permission(Permission.VIEW_OWN_PROFILE, role=Role.EMPLOYEE, actor_id=7)


def test_check_permission_lets_an_admin_act_on_any_record():
    scope = check_permission(
        Permission.UPDATE_EMPLOYEE,
        role=Role.ADMIN,
        actor_id=7,
        target_owner_id=8,
    )

    assert scope is ANY


def test_check_permission_lets_hr_act_on_any_record():
    scope = check_permission(
        Permission.UPDATE_EMPLOYEE,
        role=Role.HR,
        actor_id=7,
        target_owner_id=8,
    )

    assert scope is ANY
