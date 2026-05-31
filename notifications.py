"""
AgendApp — Módulo de notificaciones multicanal
Canales: Email (SMTP) + WhatsApp (Twilio)
Número WhatsApp: configurable vía WHATSAPP_FROM (ej: +573190000000)
"""
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# TWILIO / WHATSAPP
# ─────────────────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.environ.get("TWILIO_AUTH_TOKEN")
WHATSAPP_FROM      = os.environ.get("WHATSAPP_FROM", "whatsapp:+15005550006")  # sandbox default
# Número de producción: whatsapp:+573190000000 (configura en .env)


def _get_twilio_client():
    """Retorna cliente Twilio si están configuradas las credenciales."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("[WHATSAPP] TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configurados.")
        return None
    try:
        from twilio.rest import Client
        return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except ImportError:
        logger.warning("[WHATSAPP] twilio no instalado. pip install twilio")
        return None
    except Exception as e:
        logger.error(f"[WHATSAPP] Error iniciando Twilio: {e}")
        return None


def send_whatsapp(to_phone: str, message: str) -> bool:
    """
    Envía mensaje por WhatsApp vía Twilio.

    Args:
        to_phone: Número destino en formato internacional (ej: +573100000000)
        message: Texto del mensaje

    Returns:
        True si se envió correctamente, False si hubo error.
    """
    client = _get_twilio_client()
    if not client:
        logger.info(f"[WHATSAPP MOCK] To: {to_phone} | Msg: {message[:60]}…")
        return False  # En desarrollo retorna False pero loguea
    try:
        msg = client.messages.create(
            body=message,
            from_=WHATSAPP_FROM,
            to=f"whatsapp:{to_phone}"
        )
        logger.info(f"[WHATSAPP] Enviado a {to_phone} | SID: {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"[WHATSAPP] Error enviando a {to_phone}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Templates de mensajes WhatsApp
# ─────────────────────────────────────────────────────────────────────────────
def whatsapp_appointment_confirmed(patient_name: str, doctor_name: str,
                                   appt_date: str, appt_time: str,
                                   specialty: str = "Medicina General") -> str:
    return (
        f"✅ *AgendApp — Cita Confirmada*\n\n"
        f"Hola {patient_name} 👋\n\n"
        f"Tu cita ha sido *confirmada*:\n\n"
        f"👨‍⚕️ *Médico:* Dr. {doctor_name}\n"
        f"🏥 *Especialidad:* {specialty}\n"
        f"📅 *Fecha:* {appt_date}\n"
        f"🕐 *Hora:* {appt_time}\n\n"
        f"_Recuerda cancelar con ≥24 h de anticipación si no puedes asistir._\n\n"
        f"— AgendApp 📱"
    )


def whatsapp_appointment_cancelled(patient_name: str, doctor_name: str,
                                    appt_date: str) -> str:
    return (
        f"❌ *AgendApp — Cita Cancelada*\n\n"
        f"Hola {patient_name},\n\n"
        f"Tu cita con *Dr. {doctor_name}* del {appt_date} ha sido cancelada.\n\n"
        f"Puedes reagendar desde: agendapp.onrender.com\n\n"
        f"— AgendApp 📱"
    )


def whatsapp_reminder(patient_name: str, doctor_name: str,
                       appt_date: str, appt_time: str) -> str:
    return (
        f"⏰ *AgendApp — Recordatorio de Cita*\n\n"
        f"Hola {patient_name}, te recordamos que mañana tienes cita:\n\n"
        f"👨‍⚕️ Dr. {doctor_name}\n"
        f"📅 {appt_date} a las {appt_time}\n\n"
        f"_Si necesitas cancelar, hazlo antes de las próximas horas._\n\n"
        f"— AgendApp 📱"
    )


def whatsapp_new_appointment_to_doctor(doctor_name: str, patient_name: str,
                                        appt_date: str, appt_time: str,
                                        reason: str = "") -> str:
    return (
        f"🆕 *AgendApp — Nueva Cita Agendada*\n\n"
        f"Dr. {doctor_name}, tienes una nueva cita:\n\n"
        f"👤 *Paciente:* {patient_name}\n"
        f"📅 *Fecha:* {appt_date}\n"
        f"🕐 *Hora:* {appt_time}\n"
        + (f"📝 *Motivo:* {reason}\n" if reason else "")
        + f"\nConfirma en tu panel: agendapp.onrender.com\n\n"
        f"— AgendApp 📱"
    )
