# Import all models here so Alembic can detect them for autogenerating migrations
from app.models.base import Base  # noqa
from app.models.user import User, Role  # noqa
from app.models.vehicle import Vehicle  # noqa
from app.models.driver import Driver  # noqa
from app.models.trip import Trip  # noqa
from app.models.maintenance import MaintenanceLog  # noqa
from app.models.fuel import FuelLog  # noqa
from app.models.expense import Expense  # noqa
from app.models.bonus import Notification, AuditLog  # noqa
