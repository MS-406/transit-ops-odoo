import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/transitops",
        validation_alias="DATABASE_URL"
    )
    SYNC_DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/transitops",
        validation_alias="SYNC_DATABASE_URL"
    )
    SECRET_KEY: str = Field(
        default="supersecretkey_change_me_in_production",
        validation_alias="SECRET_KEY"
    )
    ALGORITHM: str = Field(
        default="HS256",
        validation_alias="ALGORITHM"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        validation_alias="REFRESH_TOKEN_EXPIRE_DAYS"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
