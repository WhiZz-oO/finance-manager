from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "finance2026"

    DATABASE_URL: str = "sqlite:///./data/finance.db"

    RECEIPTS_DIR: str = "./data/receipts"
    BACKUPS_DIR: str = "./data/backups"

    BACKUP_RETENTION_DAYS: int = 30
    AUTO_BACKUP_HOUR: int = 2
    AUTO_BACKUP_MINUTE: int = 0

    class Config:
        env_file = ".env"


settings = Settings()
