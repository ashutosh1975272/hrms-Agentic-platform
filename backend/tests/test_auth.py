from datetime import timedelta

import pytest
from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User

from conftest import API_PREFIX, COMPAT_PREFIX, HR_EMAIL, TEST_PASSWORD


def test_hash_password_returns_a_bcrypt_hash():
    hashed = hash_password(TEST_PASSWORD)

    assert hashed.startswith("$2")


def test_hash_password_never_returns_the_plaintext_password():
    hashed = hash_password(TEST_PASSWORD)

    assert TEST_PASSWORD not in hashed


def test_hash_password_is_salted_so_equal_passwords_differ():
    first = hash_password(TEST_PASSWORD)
    second = hash_password(TEST_PASSWORD)

    assert first != second


def test_verify_password_accepts_the_original_password():
    hashed = hash_password(TEST_PASSWORD)

    assert verify_password(TEST_PASSWORD, hashed) is True


def test_verify_password_rejects_a_wrong_password():
    hashed = hash_password(TEST_PASSWORD)

    assert verify_password("Wr0ngPass!23", hashed) is False


def test_verify_password_rejects_a_malformed_hash_instead_of_raising():
    assert verify_password(TEST_PASSWORD, "not-a-bcrypt-hash") is False


def test_create_access_token_embeds_subject_role_and_expiry():
    token = create_access_token(subject="42", role="hr")

    claims = jwt.decode(
        token,
        get_settings().secret_key,
        algorithms=[get_settings().jwt_algorithm],
    )

    assert claims["sub"] == "42"
    assert claims["role"] == "hr"
    assert claims["exp"] > claims["iat"]


def test_create_access_token_honours_an_explicit_expiry():
    token = create_access_token(
        subject="42",
        role="hr",
        expires_delta=timedelta(minutes=-5),
    )

    claims = jwt.decode(
        token,
        get_settings().secret_key,
        algorithms=[get_settings().jwt_algorithm],
        options={"verify_exp": False},
    )

    assert claims["exp"] < claims["iat"]


def test_login_returns_an_access_token_for_valid_credentials(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_returns_a_bearer_token_type(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    assert response.json()["token_type"] == "bearer"


def test_login_returns_the_authenticated_user_payload(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    user = response.json()["user"]
    assert user["id"] == users["hr"]["id"]
    assert user["email"] == HR_EMAIL
    assert user["fullName"] == "Hilda Hr"
    assert user["role"] == "hr"


def test_login_never_exposes_the_password_hash(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    assert "hashed_password" not in response.text
    assert TEST_PASSWORD not in response.text


def test_login_rejects_an_unknown_email(client):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "nobody@acme.test", "password": TEST_PASSWORD},
    )

    assert response.status_code == 401


def test_login_rejects_a_wrong_password(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": "Wr0ngPass!23"},
    )

    assert response.status_code == 401


def test_login_does_not_reveal_whether_the_account_exists(client, users):
    unknown = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "nobody@acme.test", "password": TEST_PASSWORD},
    )
    wrong_password = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": "Wr0ngPass!23"},
    )

    assert unknown.json() == wrong_password.json()


def test_login_is_case_insensitive_for_the_email(client, users):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL.upper(), "password": TEST_PASSWORD},
    )

    assert response.status_code == 200


def test_login_rejects_a_deactivated_user(client, users, db_session):
    db_session.query(User).filter(User.email == HR_EMAIL).one().is_active = False
    db_session.commit()

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    assert response.status_code == 401


def test_login_rejects_an_empty_password_with_a_validation_error(client):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": ""},
    )

    assert response.status_code == 422


def test_login_rejects_a_missing_email_with_a_validation_error(client):
    response = client.post(f"{API_PREFIX}/auth/login", json={"password": TEST_PASSWORD})

    assert response.status_code == 422


def test_me_returns_the_current_user_for_a_valid_token(client, users):
    token = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    ).json()["access_token"]

    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == HR_EMAIL
    assert response.json()["role"] == "hr"


def test_me_requires_a_token(client):
    response = client.get(f"{API_PREFIX}/auth/me")

    assert response.status_code == 401


def test_me_rejects_a_malformed_token(client):
    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": "Bearer not-a-jwt"},
    )

    assert response.status_code == 401


def test_me_rejects_a_token_with_a_tampered_signature(client, users):
    token = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    ).json()["access_token"]
    header, payload, signature = token.split(".")
    flipped = "A" if signature[0] != "A" else "B"
    tampered = f"{header}.{payload}.{flipped}{signature[1:]}"

    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {tampered}"},
    )

    assert response.status_code == 401


def test_me_rejects_an_expired_token(client, users):
    token = create_access_token(
        subject=str(users["hr"]["id"]),
        role="hr",
        expires_delta=timedelta(minutes=-1),
    )

    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_me_rejects_a_token_for_an_unknown_user(client):
    token = create_access_token(subject="999999", role="admin")

    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_me_rejects_a_token_for_a_deleted_user(client, users, auth_headers, db_session):
    headers = auth_headers("hr")
    user_id = users["hr"]["id"]
    db_session.query(User).filter(User.id == user_id).delete()
    db_session.commit()

    response = client.get(f"{API_PREFIX}/auth/me", headers=headers)

    assert response.status_code == 401


def test_me_rejects_a_user_deactivated_after_the_token_was_issued(
    client, users, auth_headers, db_session
):
    headers = auth_headers("hr")
    db_session.query(User).filter(User.id == users["hr"]["id"]).one().is_active = False
    db_session.commit()

    response = client.get(f"{API_PREFIX}/auth/me", headers=headers)

    assert response.status_code == 403


@pytest.mark.parametrize("role", ["admin", "hr", "employee"])
def test_me_is_available_to_every_authenticated_role(client, users, role):
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": users[role]["email"], "password": TEST_PASSWORD},
    )
    token = response.json()["access_token"]

    me = client.get(
        f"{API_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me.status_code == 200
    assert me.json()["role"] == role


def test_login_is_served_on_the_prefix_the_frontend_calls(client, users):
    response = client.post(
        f"{COMPAT_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_me_is_served_on_the_prefix_the_frontend_calls(client, users):
    token = client.post(
        f"{COMPAT_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    ).json()["access_token"]

    response = client.get(
        f"{COMPAT_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == HR_EMAIL


def test_a_token_issued_on_one_prefix_works_on_the_other(client, users):
    token = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": HR_EMAIL, "password": TEST_PASSWORD},
    ).json()["access_token"]

    response = client.get(
        f"{COMPAT_PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
