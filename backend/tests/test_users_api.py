import pytest

from app.models.user import Role, User

from conftest import API_PREFIX, COMPAT_PREFIX, HR_EMAIL, TEST_PASSWORD

USERS_URL = f"{API_PREFIX}/users"


def test_user_management_requires_a_token(client):
    response = client.get(USERS_URL)

    assert response.status_code == 401


def test_the_matrix_is_enforced_on_the_prefix_the_frontend_calls(client, auth_headers):
    admin = client.get(f"{COMPAT_PREFIX}/users", headers=auth_headers("admin"))
    employee = client.get(f"{COMPAT_PREFIX}/users", headers=auth_headers("employee"))

    assert admin.status_code == 200
    assert employee.status_code == 403


def test_admin_can_list_users(client, users, auth_headers):
    response = client.get(USERS_URL, headers=auth_headers("admin"))

    assert response.status_code == 200
    assert {row["email"] for row in response.json()} == {
        users["admin"]["email"],
        users["hr"]["email"],
        users["employee"]["email"],
    }


def test_listing_users_never_exposes_password_hashes(client, users, auth_headers):
    response = client.get(USERS_URL, headers=auth_headers("admin"))

    assert response.status_code == 200
    assert "hashed_password" not in response.text


def test_employee_is_denied_the_admin_user_list(client, users, auth_headers):
    response = client.get(USERS_URL, headers=auth_headers("employee"))

    assert response.status_code == 403


def test_hr_is_denied_the_admin_user_list(client, users, auth_headers):
    response = client.get(USERS_URL, headers=auth_headers("hr"))

    assert response.status_code == 403


def test_employee_is_denied_creating_a_user(client, auth_headers):
    response = client.post(
        USERS_URL,
        headers=auth_headers("employee"),
        json={
            "email": "new@acme.test",
            "password": TEST_PASSWORD,
            "full_name": "New Person",
            "role": "hr",
        },
    )

    assert response.status_code == 403


def test_hr_is_denied_role_management(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}/role",
        headers=auth_headers("hr"),
        json={"role": "admin"},
    )

    assert response.status_code == 403


def test_employee_is_denied_role_management(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}/role",
        headers=auth_headers("employee"),
        json={"role": "admin"},
    )

    assert response.status_code == 403


def test_admin_can_change_a_user_role(client, users, auth_headers, db_session):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}/role",
        headers=auth_headers("admin"),
        json={"role": "hr"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "hr"


def test_role_change_never_changes_the_password(client, users, auth_headers):
    before = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": users["employee"]["email"], "password": TEST_PASSWORD},
    )

    change = client.patch(
        f"{USERS_URL}/{users['employee']['id']}/role",
        headers=auth_headers("admin"),
        json={"role": "hr"},
    )

    after = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": users["employee"]["email"], "password": TEST_PASSWORD},
    )

    assert change.status_code == 200
    assert before.status_code == 200
    assert after.status_code == 200


def test_role_change_rejects_an_unknown_role(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}/role",
        headers=auth_headers("admin"),
        json={"role": "superuser"},
    )

    assert response.status_code == 422


def test_employee_can_read_their_own_user_record(client, users, auth_headers):
    response = client.get(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("employee"),
    )

    assert response.status_code == 200
    assert response.json()["email"] == users["employee"]["email"]


def test_employee_cannot_read_another_user_record(client, users, auth_headers):
    response = client.get(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("employee"),
    )

    assert response.status_code == 403


def test_hr_cannot_read_another_user_record(client, users, auth_headers):
    response = client.get(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("hr"),
    )

    assert response.status_code == 403


def test_admin_can_read_any_user_record(client, users, auth_headers):
    response = client.get(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("admin"),
    )

    assert response.status_code == 200
    assert response.json()["email"] == HR_EMAIL


def test_hr_can_read_their_own_user_record(client, users, auth_headers):
    response = client.get(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("hr"),
    )

    assert response.status_code == 200
    assert response.json()["email"] == HR_EMAIL


def test_hr_cannot_update_another_user(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("hr"),
        json={"full_name": "Hijacked"},
    )

    assert response.status_code == 403


def test_hr_can_update_their_own_full_name(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("hr"),
        json={"full_name": "Hilda Updated"},
    )

    assert response.status_code == 200
    assert response.json()["fullName"] == "Hilda Updated"


def test_reading_an_unknown_user_returns_not_found(client, users, auth_headers):
    known = client.get(
        f"{USERS_URL}/{users['hr']['id']}", headers=auth_headers("admin")
    )
    response = client.get(f"{USERS_URL}/999999", headers=auth_headers("admin"))

    assert known.status_code == 200
    assert response.status_code == 404


def test_employee_can_update_their_own_full_name(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("employee"),
        json={"full_name": "Emery Updated"},
    )

    assert response.status_code == 200
    assert response.json()["fullName"] == "Emery Updated"


def test_employee_cannot_update_another_user(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("employee"),
        json={"full_name": "Hijacked"},
    )

    assert response.status_code == 403


def test_employee_cannot_change_the_active_flag_on_their_own_account(
    client, users, auth_headers, db_session
):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("employee"),
        json={"is_active": False},
    )

    still_active = (
        db_session.query(User)
        .filter(User.id == users["employee"]["id"])
        .one()
        .is_active
    )

    assert response.status_code == 403
    assert still_active is True


def test_admin_can_deactivate_a_user(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("admin"),
        json={"is_active": False},
    )

    assert response.status_code == 200
    assert response.json()["isActive"] is False


def test_sending_a_null_field_leaves_the_stored_value_untouched(
    client, users, auth_headers
):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("admin"),
        json={"full_name": None, "is_active": None},
    )

    assert response.status_code == 200
    assert response.json()["fullName"] == "Emery Employee"
    assert response.json()["isActive"] is True


def test_an_omitted_field_leaves_the_stored_value_untouched(client, users, auth_headers):
    response = client.patch(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("admin"),
        json={},
    )

    assert response.status_code == 200
    assert response.json()["fullName"] == "Emery Employee"


def test_admin_can_create_a_user(client, auth_headers):
    response = client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={
            "email": "newhire@acme.test",
            "password": TEST_PASSWORD,
            "full_name": "New Hire",
            "role": "employee",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "newhire@acme.test"
    assert response.json()["role"] == "employee"


def test_created_user_can_log_in_with_the_given_password(client, auth_headers):
    client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={
            "email": "newhire@acme.test",
            "password": TEST_PASSWORD,
            "full_name": "New Hire",
        },
    )

    login = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "newhire@acme.test", "password": TEST_PASSWORD},
    )

    assert login.status_code == 200


def test_created_user_password_is_stored_as_a_bcrypt_hash(
    client, auth_headers, db_session
):
    client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={
            "email": "newhire@acme.test",
            "password": TEST_PASSWORD,
            "full_name": "New Hire",
        },
    )

    created = db_session.query(User).filter_by(email="newhire@acme.test").one()

    assert created.hashed_password.startswith("$2")
    assert TEST_PASSWORD not in created.hashed_password


def test_creating_a_user_never_returns_the_password_hash(client, auth_headers):
    response = client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={
            "email": "newhire@acme.test",
            "password": TEST_PASSWORD,
            "full_name": "New Hire",
        },
    )

    assert response.status_code == 201
    assert "hashed_password" not in response.text
    assert TEST_PASSWORD not in response.text


def test_creating_a_user_with_a_duplicate_email_conflicts(client, users, auth_headers):
    response = client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={
            "email": HR_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Duplicate",
        },
    )

    assert response.status_code == 409


def test_creating_a_user_rejects_a_short_password(client, auth_headers):
    response = client.post(
        USERS_URL,
        headers=auth_headers("admin"),
        json={"email": "shorty@acme.test", "password": "short", "full_name": "Shorty"},
    )

    assert response.status_code == 422


def test_admin_can_delete_a_user(client, users, auth_headers):
    response = client.delete(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("admin"),
    )

    assert response.status_code == 204


def test_deleted_user_can_no_longer_log_in(client, users, auth_headers):
    client.delete(
        f"{USERS_URL}/{users['employee']['id']}", headers=auth_headers("admin")
    )

    login = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": users["employee"]["email"], "password": TEST_PASSWORD},
    )

    assert login.status_code == 401


def test_employee_is_denied_deleting_a_user(client, users, auth_headers):
    response = client.delete(
        f"{USERS_URL}/{users['hr']['id']}",
        headers=auth_headers("employee"),
    )

    assert response.status_code == 403


def test_hr_is_denied_deleting_a_user(client, users, auth_headers):
    response = client.delete(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("hr"),
    )

    assert response.status_code == 403


def test_deleting_an_unknown_user_returns_not_found(client, users, auth_headers):
    known = client.delete(
        f"{USERS_URL}/{users['employee']['id']}",
        headers=auth_headers("admin"),
    )
    response = client.delete(f"{USERS_URL}/999999", headers=auth_headers("admin"))

    assert known.status_code == 204
    assert response.status_code == 404


def test_admin_cannot_delete_their_own_account(client, users, auth_headers):
    response = client.delete(
        f"{USERS_URL}/{users['admin']['id']}",
        headers=auth_headers("admin"),
    )

    assert response.status_code == 400


def test_role_enum_has_exactly_the_three_project_roles():
    assert {role.value for role in Role} == {"admin", "hr", "employee"}


@pytest.mark.parametrize("role", ["admin", "hr", "employee"])
def test_every_seeded_role_can_reach_its_own_me_endpoint(
    client, users, auth_headers, role
):
    me = client.get(f"{API_PREFIX}/auth/me", headers=auth_headers(role))

    assert me.status_code == 200
    assert me.json()["id"] == users[role]["id"]
