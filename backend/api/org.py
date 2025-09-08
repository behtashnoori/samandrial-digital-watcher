from __future__ import annotations

from datetime import date

from flask import jsonify, request

from . import api_bp
from ..app import db
from ..models import (
    AuditLog,
    Head,
    HeadTenure,
    Management,
    Service,
    ServiceAssignment,
    Unit,
)


def log_action(entity: str, entity_id: int | str, action: str, diff: dict | None = None) -> None:
    db.session.add(
        AuditLog(
            entity=entity,
            entity_id=str(entity_id),
            action=action,
            actor="system",
            diff_json=diff or {},
        )
    )


# Management CRUD
@api_bp.get("/org/managements")
def list_managements():
    data = [
        {"id": m.id, "name": m.name, "is_active": m.is_active}
        for m in Management.query.all()
    ]
    return jsonify(data)


@api_bp.post("/org/managements")
def create_management():
    payload = request.get_json() or {}
    m = Management(name=payload["name"], is_active=payload.get("is_active", True))
    db.session.add(m)
    db.session.commit()
    log_action("management", m.id, "create")
    db.session.commit()
    return jsonify({"id": m.id, "name": m.name, "is_active": m.is_active}), 201


@api_bp.put("/org/managements/<int:mid>")
def update_management(mid: int):
    m = Management.query.get_or_404(mid)
    payload = request.get_json() or {}
    m.name = payload.get("name", m.name)
    m.is_active = payload.get("is_active", m.is_active)
    db.session.commit()
    log_action("management", m.id, "update")
    db.session.commit()
    return jsonify({"id": m.id, "name": m.name, "is_active": m.is_active})


@api_bp.delete("/org/managements/<int:mid>")
def delete_management(mid: int):
    m = Management.query.get_or_404(mid)
    db.session.delete(m)
    db.session.commit()
    log_action("management", mid, "delete")
    db.session.commit()
    return jsonify({"status": "ok"})


# Unit CRUD
@api_bp.get("/org/units")
def list_units():
    data = [
        {
            "id": u.id,
            "management_id": u.management_id,
            "name": u.name,
            "is_active": u.is_active,
        }
        for u in Unit.query.all()
    ]
    return jsonify(data)


@api_bp.post("/org/units")
def create_unit():
    payload = request.get_json() or {}
    u = Unit(
        management_id=payload["management_id"],
        name=payload["name"],
        is_active=payload.get("is_active", True),
    )
    db.session.add(u)
    db.session.commit()
    log_action("unit", u.id, "create")
    db.session.commit()
    return jsonify({"id": u.id, "management_id": u.management_id, "name": u.name, "is_active": u.is_active}), 201


@api_bp.put("/org/units/<int:uid>")
def update_unit(uid: int):
    u = Unit.query.get_or_404(uid)
    payload = request.get_json() or {}
    u.management_id = payload.get("management_id", u.management_id)
    u.name = payload.get("name", u.name)
    u.is_active = payload.get("is_active", u.is_active)
    db.session.commit()
    log_action("unit", u.id, "update")
    db.session.commit()
    return jsonify({"id": u.id, "management_id": u.management_id, "name": u.name, "is_active": u.is_active})


@api_bp.delete("/org/units/<int:uid>")
def delete_unit(uid: int):
    u = Unit.query.get_or_404(uid)
    db.session.delete(u)
    db.session.commit()
    log_action("unit", uid, "delete")
    db.session.commit()
    return jsonify({"status": "ok"})


# Head CRUD
@api_bp.get("/org/heads")
def list_heads():
    data = [
        {"id": h.id, "full_name": h.full_name, "phone": h.phone, "is_active": h.is_active}
        for h in Head.query.all()
    ]
    return jsonify(data)


@api_bp.post("/org/heads")
def create_head():
    payload = request.get_json() or {}
    h = Head(full_name=payload["full_name"], phone=payload.get("phone"), is_active=payload.get("is_active", True))
    db.session.add(h)
    db.session.commit()
    log_action("head", h.id, "create")
    db.session.commit()
    return jsonify({"id": h.id, "full_name": h.full_name, "phone": h.phone, "is_active": h.is_active}), 201


@api_bp.put("/org/heads/<int:hid>")
def update_head(hid: int):
    h = Head.query.get_or_404(hid)
    payload = request.get_json() or {}
    h.full_name = payload.get("full_name", h.full_name)
    h.phone = payload.get("phone", h.phone)
    h.is_active = payload.get("is_active", h.is_active)
    db.session.commit()
    log_action("head", h.id, "update")
    db.session.commit()
    return jsonify({"id": h.id, "full_name": h.full_name, "phone": h.phone, "is_active": h.is_active})


@api_bp.delete("/org/heads/<int:hid>")
def delete_head(hid: int):
    h = Head.query.get_or_404(hid)
    db.session.delete(h)
    db.session.commit()
    log_action("head", hid, "delete")
    db.session.commit()
    return jsonify({"status": "ok"})


# Head Tenure CRUD with overlap check
@api_bp.get("/org/tenure")
def list_tenure():
    data = [
        {
            "id": t.id,
            "head_id": t.head_id,
            "unit_id": t.unit_id,
            "valid_from": t.valid_from.isoformat(),
            "valid_to": t.valid_to.isoformat() if t.valid_to else None,
            "is_current": t.is_current,
        }
        for t in HeadTenure.query.all()
    ]
    return jsonify(data)


def _overlap(from1: date, to1: date | None, from2: date, to2: date | None) -> bool:
    end1 = to1 or date.max
    end2 = to2 or date.max
    return from1 <= end2 and from2 <= end1


@api_bp.post("/org/tenure")
def create_tenure():
    payload = request.get_json() or {}
    vf = date.fromisoformat(payload["valid_from"])
    vt = date.fromisoformat(payload["valid_to"]) if payload.get("valid_to") else None
    existing = HeadTenure.query.filter_by(unit_id=payload["unit_id"]).all()
    for t in existing:
        if _overlap(vf, vt, t.valid_from, t.valid_to):
            return jsonify({"message": "بازه زمانی با رکورد موجود هم‌پوشانی دارد."}), 400
    t = HeadTenure(
        head_id=payload["head_id"],
        unit_id=payload["unit_id"],
        valid_from=vf,
        valid_to=vt,
        is_current=payload.get("is_current", False),
    )
    db.session.add(t)
    db.session.commit()
    log_action("head_tenure", t.id, "create")
    db.session.commit()
    return jsonify({
        "id": t.id,
        "head_id": t.head_id,
        "unit_id": t.unit_id,
        "valid_from": t.valid_from.isoformat(),
        "valid_to": t.valid_to.isoformat() if t.valid_to else None,
        "is_current": t.is_current,
    }), 201


@api_bp.put("/org/tenure/<int:tid>")
def update_tenure(tid: int):
    t = HeadTenure.query.get_or_404(tid)
    payload = request.get_json() or {}
    vf = date.fromisoformat(payload.get("valid_from", t.valid_from.isoformat()))
    vt = (
        date.fromisoformat(payload["valid_to"]) if payload.get("valid_to") else t.valid_to
    )
    existing = HeadTenure.query.filter(HeadTenure.unit_id == (payload.get("unit_id", t.unit_id)), HeadTenure.id != tid).all()
    for other in existing:
        if _overlap(vf, vt, other.valid_from, other.valid_to):
            return jsonify({"message": "بازه زمانی با رکورد موجود هم‌پوشانی دارد."}), 400
    t.head_id = payload.get("head_id", t.head_id)
    t.unit_id = payload.get("unit_id", t.unit_id)
    t.valid_from = vf
    t.valid_to = vt
    t.is_current = payload.get("is_current", t.is_current)
    db.session.commit()
    log_action("head_tenure", t.id, "update")
    db.session.commit()
    return jsonify({
        "id": t.id,
        "head_id": t.head_id,
        "unit_id": t.unit_id,
        "valid_from": t.valid_from.isoformat(),
        "valid_to": t.valid_to.isoformat() if t.valid_to else None,
        "is_current": t.is_current,
    })


@api_bp.delete("/org/tenure/<int:tid>")
def delete_tenure(tid: int):
    t = HeadTenure.query.get_or_404(tid)
    db.session.delete(t)
    db.session.commit()
    log_action("head_tenure", tid, "delete")
    db.session.commit()
    return jsonify({"status": "ok"})


# Service Assignment CRUD with overlap check
@api_bp.get("/org/service-assignment")
def list_service_assignment():
    data = [
        {
            "id": s.id,
            "service_code": s.service_code,
            "management_id": s.management_id,
            "unit_id": s.unit_id,
            "head_id": s.head_id,
            "valid_from": s.valid_from.isoformat(),
            "valid_to": s.valid_to.isoformat() if s.valid_to else None,
            "is_current": s.is_current,
        }
        for s in ServiceAssignment.query.all()
    ]
    return jsonify(data)


@api_bp.post("/org/service-assignment")
def create_service_assignment():
    payload = request.get_json() or {}
    vf = date.fromisoformat(payload["valid_from"])
    vt = date.fromisoformat(payload["valid_to"]) if payload.get("valid_to") else None
    existing = ServiceAssignment.query.filter_by(service_code=payload["service_code"], unit_id=payload.get("unit_id")).all()
    for sa in existing:
        if _overlap(vf, vt, sa.valid_from, sa.valid_to):
            return jsonify({"message": "بازه زمانی با رکورد موجود هم‌پوشانی دارد."}), 400
    sa = ServiceAssignment(
        service_code=payload["service_code"],
        management_id=payload.get("management_id"),
        unit_id=payload.get("unit_id"),
        head_id=payload.get("head_id"),
        valid_from=vf,
        valid_to=vt,
        is_current=payload.get("is_current", False),
    )
    db.session.add(sa)
    db.session.commit()
    log_action("service_assignment", sa.id, "create")
    db.session.commit()
    return jsonify({
        "id": sa.id,
        "service_code": sa.service_code,
        "management_id": sa.management_id,
        "unit_id": sa.unit_id,
        "head_id": sa.head_id,
        "valid_from": sa.valid_from.isoformat(),
        "valid_to": sa.valid_to.isoformat() if sa.valid_to else None,
        "is_current": sa.is_current,
    }), 201


@api_bp.put("/org/service-assignment/<int:sid>")
def update_service_assignment(sid: int):
    sa = ServiceAssignment.query.get_or_404(sid)
    payload = request.get_json() or {}
    vf = date.fromisoformat(payload.get("valid_from", sa.valid_from.isoformat()))
    vt = (
        date.fromisoformat(payload["valid_to"]) if payload.get("valid_to") else sa.valid_to
    )
    existing = ServiceAssignment.query.filter(
        ServiceAssignment.service_code == payload.get("service_code", sa.service_code),
        ServiceAssignment.unit_id == payload.get("unit_id", sa.unit_id),
        ServiceAssignment.id != sid,
    ).all()
    for other in existing:
        if _overlap(vf, vt, other.valid_from, other.valid_to):
            return jsonify({"message": "بازه زمانی با رکورد موجود هم‌پوشانی دارد."}), 400
    sa.service_code = payload.get("service_code", sa.service_code)
    sa.management_id = payload.get("management_id", sa.management_id)
    sa.unit_id = payload.get("unit_id", sa.unit_id)
    sa.head_id = payload.get("head_id", sa.head_id)
    sa.valid_from = vf
    sa.valid_to = vt
    sa.is_current = payload.get("is_current", sa.is_current)
    db.session.commit()
    log_action("service_assignment", sa.id, "update")
    db.session.commit()
    return jsonify({
        "id": sa.id,
        "service_code": sa.service_code,
        "management_id": sa.management_id,
        "unit_id": sa.unit_id,
        "head_id": sa.head_id,
        "valid_from": sa.valid_from.isoformat(),
        "valid_to": sa.valid_to.isoformat() if sa.valid_to else None,
        "is_current": sa.is_current,
    })


@api_bp.delete("/org/service-assignment/<int:sid>")
def delete_service_assignment(sid: int):
    sa = ServiceAssignment.query.get_or_404(sid)
    db.session.delete(sa)
    db.session.commit()
    log_action("service_assignment", sid, "delete")
    db.session.commit()
    return jsonify({"status": "ok"})


@api_bp.get("/services")
def list_services():
    data = [
        {"code": s.code, "name": s.name}
        for s in Service.query.filter_by(is_active=True).all()
    ]
    return jsonify(data)
