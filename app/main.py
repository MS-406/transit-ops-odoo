from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.db.base  # noqa: F401 — registers all models with SQLAlchemy (must be before router imports)
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.audit import router as audit_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.trips import router as trips_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.fuel_expenses import router as fuel_expenses_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router
from app.api.v1.notifications import router as notifications_router
from app.core.exceptions import register_exception_handlers
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter

app = FastAPI(
    title="TransitOps Backend API",
    description="Backend for Smart Transport Operations Platform",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(health_router, prefix="/api", tags=["System"])
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(vehicles_router, prefix="/api", tags=["Vehicles"])
app.include_router(drivers_router, prefix="/api", tags=["Drivers"])
app.include_router(trips_router, prefix="/api", tags=["Trips"])
app.include_router(maintenance_router, prefix="/api", tags=["Maintenance"])
app.include_router(fuel_expenses_router, prefix="/api", tags=["Fuel & Expenses"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(reports_router, prefix="/api", tags=["Reports"])
app.include_router(audit_router, prefix="/api", tags=["Audit"])
app.include_router(notifications_router, prefix="/api", tags=["Notifications"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
