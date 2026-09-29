import os
import tempfile
from pathlib import Path

_TEST_DATABASE_PATH = Path(tempfile.gettempdir()) / "agentic_hrms_task02_tests.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DATABASE_PATH}"
os.environ["SECRET_KEY"] = "test-only-secret-key"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["BCRYPT_ROUNDS"] = "4"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import hash_password
from app.db import Base, get_db
from app.main import app
from app.models.user import Role, User

API_PREFIX = get_settings().api_v1_prefix
COMPAT_PREFIX = get_settings().api_compat_prefix

ADMIN_EMAIL = "admin@acme.test"
HR_EMAIL = "hr@acme.test"
EMPLOYEE_EMAIL = "employee@acme.test"
TEST_PASSWORD = "Str0ngPass!23"

SEED_USERS = (
    (Role.ADMIN, ADMIN_EMAIL, "Ada Admin"),
    (Role.HR, HR_EMAIL, "Hilda Hr"),
    (Role.EMPLOYEE, EMPLOYEE_EMAIL, "Emery Employee"),
)


@pytest.fixture
def engine() -> Engine:
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture
def session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture
def db_session(session_factory: sessionmaker[Session]) -> Session:
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(engine: Engine, session_factory: sessionmaker[Session]):
    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def users(db_session: Session) -> dict[str, dict[str, object]]:
    seeded: dict[str, dict[str, object]] = {}
    for role, email, full_name in SEED_USERS:
        user = User(
            email=email,
            hashed_password=hash_password(TEST_PASSWORD),
            full_name=full_name,
            role=role,
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()
        seeded[role.value] = {"id": user.id, "email": email, "role": role.value}
    db_session.commit()
    return seeded


@pytest.fixture
def auth_headers(client, users):
    def _auth_headers(role: str, password: str = TEST_PASSWORD) -> dict[str, str]:
        response = client.post(
            f"{API_PREFIX}/auth/login",
            json={"email": users[role]["email"], "password": password},
        )
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _auth_headers
