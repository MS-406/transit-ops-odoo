import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.config import settings
import app.db.base  # Import all models to register them
from app.models.base import Base
from app.models.user import Role, User
from app.core.security import get_password_hash

async def seed_data():
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Seed Roles
        roles_to_seed = [
            "fleet_manager",
            "driver",
            "safety_officer",
            "financial_analyst"
        ]
        
        roles_db = {}
        for role_name in roles_to_seed:
            result = await session.execute(select(Role).where(Role.name == role_name))
            role = result.scalars().first()
            if not role:
                role = Role(name=role_name)
                session.add(role)
                print(f"Created role: {role_name}")
            else:
                print(f"Role '{role_name}' already exists.")
            roles_db[role_name] = role
            
        await session.commit()
        # Refresh to load IDs
        for role_name in roles_to_seed:
            await session.refresh(roles_db[role_name])
            
        # 2. Seed Users
        users_to_seed = [
            {
                "email": "manager@transitops.com",
                "full_name": "Fleet Manager",
                "role_name": "fleet_manager",
                "password": "password123"
            },
            {
                "email": "driver@transitops.com",
                "full_name": "Transit Driver",
                "role_name": "driver",
                "password": "password123"
            },
            {
                "email": "safety@transitops.com",
                "full_name": "Safety Officer",
                "role_name": "safety_officer",
                "password": "password123"
            },
            {
                "email": "analyst@transitops.com",
                "full_name": "Financial Analyst",
                "role_name": "financial_analyst",
                "password": "password123"
            }
        ]
        
        for u in users_to_seed:
            result = await session.execute(select(User).where(User.email == u["email"]))
            user = result.scalars().first()
            if not user:
                role = roles_db[u["role_name"]]
                user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    password_hash=get_password_hash(u["password"]),
                    role_id=role.id,
                    is_active=True
                )
                session.add(user)
                print(f"Created user: {u['email']} ({u['role_name']})")
            else:
                print(f"User '{u['email']}' already exists.")
                
        await session.commit()
        print("Seeding completed successfully!")
        
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(seed_data())
