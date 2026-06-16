# ============================================================
# services/email_service.py - Email Sending Service
# ============================================================

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_SERVER   = 'smtp.gmail.com'
SMTP_PORT     = 587
SMTP_EMAIL    = os.environ.get('SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
FRONTEND_URL  = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

def send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[EMAIL SKIPPED] To: {to_email} | Subject: {subject}")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f"AI Career Companion <{SMTP_EMAIL}>"
        msg['To']      = to_email
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {str(e)}")
        return False

def send_password_reset_email(to_email: str, name: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#6366f1">AI Career Companion</h2>
      <p>Hi <strong>{name}</strong>,</p>
      <p>We received a request to reset your password.</p>
      <a href="{reset_link}" style="background:#6366f1;color:white;padding:12px 24px;
         border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Reset Password
      </a>
      <p style="color:#666;font-size:12px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
    </div>"""
    send_email(to_email, "Reset Your Password - AI Career Companion", html)
