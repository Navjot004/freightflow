from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager
from app.scheduler import scheduler
from app.core.config import settings
from app.db.database import engine, Base
from app.domain.identity.router import router as auth_router
from app.domain.organizations.companies.router import router as companies_router
from app.domain.freight.loads.router import router as loads_router
from app.domain.marketplace.bids.router import router as bids_router
from app.domain.marketplace.tenders.router import router as tenders_router
from app.domain.freight.shipments.router import router as shipments_router
from app.domain.notifications.router import router as notifications_router
from app.domain.identity.admin.router import router as admin_router
from app.domain.freight.disputes.router import router as disputes_router
from app.domain.marketplace.ratings.router import router as ratings_router
from app.domain.organizations.partnerships.router import router as partnerships_router
from app.domain.fleet.drivers.router import router as drivers_router
from app.domain.finance.router import router as finance_router
from app.domain.compliance.router import router as compliance_router
from app.domain.integrations.router import router as integrations_router
import app.domain.freight.loads.models # Ensure tables are created
import app.domain.marketplace.bids.models # Ensure tables are created
import app.domain.marketplace.tenders.models # Ensure tables are created
import app.domain.freight.shipments.models # Ensure tables are created
import app.domain.notifications.models # Ensure tables are created
import app.domain.identity.admin.models # Ensure tables are created
import app.domain.freight.disputes.models # Ensure tables are created
import app.domain.marketplace.ratings.models # Ensure tables are created
import app.domain.organizations.partnerships.models # Ensure tables are created
import app.domain.fleet.drivers.models # Ensure tables are created
import app.domain.finance.models # Ensure tables are created
import app.domain.compliance.models # Ensure tables are created
import app.domain.integrations.models # Ensure tables are created
import app.core.models # Ensure tables are created
from app.api.websockets import router as websockets_router

from app.core.exceptions import register_exception_handlers

# Create DB tables
Base.metadata.create_all(bind=engine) # Enabled for POC to ensure tables exist

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins, # For POC only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(companies_router, prefix=f"{settings.API_V1_STR}/companies", tags=["companies"])
app.include_router(loads_router, prefix=f"{settings.API_V1_STR}/loads", tags=["loads"])
app.include_router(bids_router, prefix=f"{settings.API_V1_STR}", tags=["bids"])
app.include_router(tenders_router, prefix=f"{settings.API_V1_STR}", tags=["tenders"])
app.include_router(shipments_router, prefix=f"{settings.API_V1_STR}", tags=["shipments"])
app.include_router(notifications_router, prefix=f"{settings.API_V1_STR}", tags=["notifications"])
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(disputes_router, prefix=f"{settings.API_V1_STR}/disputes", tags=["disputes"])
app.include_router(ratings_router, prefix=f"{settings.API_V1_STR}/ratings", tags=["ratings"])
app.include_router(partnerships_router, prefix=f"{settings.API_V1_STR}", tags=["partnerships"])
app.include_router(drivers_router, prefix=f"{settings.API_V1_STR}/drivers", tags=["drivers"])
app.include_router(finance_router, prefix=f"{settings.API_V1_STR}/finance", tags=["finance"])
app.include_router(compliance_router, prefix=f"{settings.API_V1_STR}/compliance", tags=["compliance"])
app.include_router(integrations_router, prefix=f"{settings.API_V1_STR}/integrations", tags=["integrations"])
app.include_router(websockets_router, prefix="/ws", tags=["websockets"])

# Vercel serverless filesystem is read-only except for /tmp
UPLOAD_DIR = "/tmp/uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    f"{settings.API_V1_STR}/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)

@app.get("/")
def root():
    return {"message": "Welcome to FreightFlow API"}
