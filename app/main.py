from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.db.base  # noqa: F401 — registers all models with SQLAlchemy (must be before router imports)
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.trips import router as trips_router
from app.api.v1.maintenance import router as maintenance_router
from app.core.exceptions import register_exception_handlers

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform API",
    version="1.0.0"
)

# Register custom exception handlers
register_exception_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/api", tags=["System"])
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(vehicles_router, prefix="/api", tags=["Vehicles"])
app.include_router(drivers_router, prefix="/api", tags=["Drivers"])
app.include_router(trips_router, prefix="/api", tags=["Trips"])
app.include_router(maintenance_router, prefix="/api", tags=["Maintenance"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
