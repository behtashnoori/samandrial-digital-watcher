from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .app import db


class User(db.Model):
    __tablename__ = 'user'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    role: Mapped[str]


class Service(db.Model):
    __tablename__ = 'service'

    code: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    uom: Mapped[str]
    base_qty: Mapped[float | None]
    base_fin: Mapped[float | None]
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class Management(db.Model):
    __tablename__ = 'management'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    units: Mapped[list['Unit']] = relationship(back_populates='management')


class Unit(db.Model):
    __tablename__ = 'unit'

    id: Mapped[int] = mapped_column(primary_key=True)
    management_id: Mapped[int] = mapped_column(ForeignKey('management.id'))
    name: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)

    management: Mapped['Management'] = relationship(back_populates='units')
    tenures: Mapped[list['HeadTenure']] = relationship(back_populates='unit')


class Head(db.Model):
    __tablename__ = 'head'

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str]
    phone: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(default=True)
    tenures: Mapped[list['HeadTenure']] = relationship(back_populates='head')


class HeadTenure(db.Model):
    __tablename__ = 'head_tenure'
    __table_args__ = (
        CheckConstraint('valid_to IS NULL OR valid_to > valid_from', name='ck_head_tenure_dates'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    head_id: Mapped[int] = mapped_column(ForeignKey('head.id'))
    unit_id: Mapped[int] = mapped_column(ForeignKey('unit.id'))
    valid_from: Mapped[date]
    valid_to: Mapped[date | None]
    is_current: Mapped[bool] = mapped_column(default=False)

    head: Mapped['Head'] = relationship(back_populates='tenures')
    unit: Mapped['Unit'] = relationship(back_populates='tenures')


class ServiceAssignment(db.Model):
    __tablename__ = 'service_assignment'
    __table_args__ = (
        CheckConstraint('valid_to IS NULL OR valid_to > valid_from', name='ck_service_assignment_dates'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    management_id: Mapped[int | None] = mapped_column(ForeignKey('management.id'))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey('unit.id'))
    head_id: Mapped[int | None] = mapped_column(ForeignKey('head.id'))
    valid_from: Mapped[date]
    valid_to: Mapped[date | None]
    is_current: Mapped[bool] = mapped_column(default=False)


class BudgetAnnual(db.Model):
    __tablename__ = 'budget_annual'

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int]
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey('unit.id'))
    annual_qty: Mapped[float | None]
    annual_fin: Mapped[float | None]
    currency: Mapped[str]
    scenario: Mapped[str]
    version: Mapped[str]
    snapshot_id: Mapped[int] = mapped_column(ForeignKey('budget_snapshot.id'))
    notes: Mapped[str | None] = mapped_column()


class BudgetSnapshot(db.Model):
    __tablename__ = 'budget_snapshot'

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int]
    scenario: Mapped[str]
    status: Mapped[str] = mapped_column(default='published')
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class BudgetDaily(db.Model):
    __tablename__ = 'budget_daily'

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date]
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey('unit.id'))
    qty: Mapped[float | None]
    fin: Mapped[float | None]


class OpsActualDaily(db.Model):
    __tablename__ = 'ops_actual_daily'

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date]
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    unit_id: Mapped[int] = mapped_column(ForeignKey('unit.id'))
    qty: Mapped[float | None]
    fin: Mapped[float | None]


class DeviationDaily(db.Model):
    __tablename__ = 'deviation_daily'

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date]
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    unit_id: Mapped[int] = mapped_column(ForeignKey('unit.id'))
    budget_value: Mapped[float | None]
    actual_value: Mapped[float | None]
    deviation_pct: Mapped[float | None]


class CalendarDim(db.Model):
    __tablename__ = 'calendar_dim'

    id: Mapped[int] = mapped_column(primary_key=True)
    date_shamsi: Mapped[str]
    jalali_month: Mapped[int]
    weekday_name: Mapped[str]
    is_friday: Mapped[bool] = mapped_column(default=False)
    is_thursday: Mapped[bool] = mapped_column(default=False)
    is_official_holiday: Mapped[bool] = mapped_column(default=False)
    is_summer_break: Mapped[bool] = mapped_column(default=False)
    weight_raw: Mapped[float] = mapped_column(default=1.0)


class SeasonalityMonth(db.Model):
    __tablename__ = 'seasonality_month'

    id: Mapped[int] = mapped_column(primary_key=True)
    month: Mapped[int]
    actual_1403: Mapped[float]
    season_weight: Mapped[float]


class Setting(db.Model):
    __tablename__ = 'setting'

    id: Mapped[int] = mapped_column(primary_key=True)
    threshold: Mapped[float] = mapped_column(default=10.0)
    consecutive_days: Mapped[int] = mapped_column(default=2)
    cooldown_days: Mapped[int] = mapped_column(default=5)
    due_hours: Mapped[int] = mapped_column(default=24)


class TriggerEvent(db.Model):
    __tablename__ = 'trigger_event'

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date]
    service_code: Mapped[str] = mapped_column(ForeignKey('service.code'))
    unit_id: Mapped[int] = mapped_column(ForeignKey('unit.id'))
    deviation_value: Mapped[float]
    severity: Mapped[str]
    threshold_used: Mapped[float]
    status: Mapped[str]
    assigned_head_id: Mapped[int | None] = mapped_column(ForeignKey('head.id'))
    due_at: Mapped[datetime | None]
    updated_by_new_budget: Mapped[bool] = mapped_column(default=False)


class Response(db.Model):
    __tablename__ = 'response'

    id: Mapped[int] = mapped_column(primary_key=True)
    trigger_id: Mapped[int | None] = mapped_column(ForeignKey('trigger_event.id'))
    question_pack_id: Mapped[int | None]
    free_text: Mapped[str | None]
    sample_ref: Mapped[str | None]
    actions_json: Mapped[dict | None] = mapped_column(db.JSON)
    submitted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    submitted_by: Mapped[str | None]

    attachments: Mapped[list['Attachment']] = relationship(back_populates='response')


class Attachment(db.Model):
    __tablename__ = 'attachment'

    id: Mapped[int] = mapped_column(primary_key=True)
    response_id: Mapped[int] = mapped_column(ForeignKey('response.id'))
    uri: Mapped[str]
    file_name: Mapped[str]
    sha256: Mapped[str]
    uploaded_by: Mapped[str | None]
    uploaded_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    response: Mapped['Response'] = relationship(back_populates='attachments')


class AuditLog(db.Model):
    __tablename__ = 'audit_log'

    id: Mapped[int] = mapped_column(primary_key=True)
    entity: Mapped[str]
    entity_id: Mapped[str]
    action: Mapped[str]
    actor: Mapped[str]
    at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    diff_json: Mapped[dict | None] = mapped_column(db.JSON)


class RecomputeJob(db.Model):
    __tablename__ = 'recompute_job'

    id: Mapped[int] = mapped_column(primary_key=True)
    job: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    done: Mapped[bool] = mapped_column(default=False)


class OneTimeToken(db.Model):
    __tablename__ = 'one_time_token'

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(unique=True)
    trigger_id: Mapped[int] = mapped_column(ForeignKey('trigger_event.id'))
    head_id: Mapped[int] = mapped_column(ForeignKey('head.id'))
    expires_at: Mapped[datetime]
    used_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
