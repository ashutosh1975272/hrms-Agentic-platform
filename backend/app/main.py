from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.core.config import get_settings
from app.db import create_all_tables

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_all_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)

# The merged frontend (TASK-09) calls "/api/..."; the versioned prefix above is
# the canonical one. Both point at the same routers and the same permission
# checks, so neither prefix can be used to reach something the other cannot.
if settings.api_compat_prefix != settings.api_v1_prefix:
    app.include_router(
        auth_router, prefix=settings.api_compat_prefix, include_in_schema=False
    )
    app.include_router(
        users_router, prefix=settings.api_compat_prefix, include_in_schema=False
    )


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
