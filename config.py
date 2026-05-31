import os
from datetime import timedelta


class Config:
    # ── Core ──────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-CHANGE-in-production-2026")
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)

    # ── Database ──────────────────────────────────────────────────────────
    # Render provee DATABASE_URL con postgres://, SQLAlchemy necesita postgresql://
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///agendapp.db")
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Email (SMTP) ───────────────────────────────────────────────────────
    MAIL_SERVER   = os.environ.get("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT     = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS  = os.environ.get("MAIL_USE_TLS",  "true").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "AgendApp <noreply@agendapp.co>")

    # ── App settings ───────────────────────────────────────────────────────
    REMINDER_HOURS_BEFORE      = int(os.environ.get("REMINDER_HOURS_BEFORE",      24))
    CANCELLATION_HOURS_BEFORE  = int(os.environ.get("CANCELLATION_HOURS_BEFORE",  24))
    APP_NAME = "AgendApp"
    APP_VERSION = "1.0.0"


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "test-secret-key"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config = {
    "development": DevelopmentConfig,
    "testing":     TestingConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
