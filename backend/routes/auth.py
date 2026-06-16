# ============================================================
# routes/auth.py - Authentication Routes
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from utils.db import execute_query
from utils.jwt_utils import generate_tokens
from services.email_service import send_password_reset_email
import secrets, hashlib
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# ─── SIGNUP ──────────────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required = ['full_name', 'email', 'password']

    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    email = data['email'].lower().strip()

    # Check if email already exists
    existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetch='one')
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')

    user_id = execute_query(
        """INSERT INTO users (full_name, email, password_hash, branch, college, graduation_year)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (data['full_name'], email, hashed_pw,
         data.get('branch'), data.get('college'), data.get('graduation_year')),
        fetch='none'
    )

    # Initialize user progress tracker
    execute_query(
        "INSERT INTO user_progress (user_id) VALUES (%s)", (user_id,), fetch='none'
    )

    tokens = generate_tokens(user_id, role='student')
    user   = execute_query("SELECT id, full_name, email, role, branch, college FROM users WHERE id = %s",
                           (user_id,), fetch='one')

    return jsonify({
        "message": "Account created successfully",
        "user": user,
        **tokens
    }), 201


# ─── LOGIN ───────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data  = request.get_json()
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = execute_query(
        "SELECT * FROM users WHERE email = %s AND is_active = TRUE", (email,), fetch='one'
    )

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    tokens = generate_tokens(user['id'], user['role'])

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['id'],
            "full_name": user['full_name'],
            "email": user['email'],
            "role": user['role'],
            "branch": user['branch'],
            "college": user['college'],
            "graduation_year": user['graduation_year'],
            "profile_photo": user['profile_photo']
        },
        **tokens
    }), 200


# ─── GET PROFILE ─────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = execute_query(
        """SELECT id, full_name, email, role, branch, college, graduation_year,
                  profile_photo, bio, linkedin_url, github_url, created_at
           FROM users WHERE id = %s""",
        (user_id,), fetch='one'
    )
    if not user:
        return jsonify({"error": "User not found"}), 404

    skills = execute_query(
        "SELECT skill_name, level, category FROM skills WHERE user_id = %s", (user_id,)
    )

    progress = execute_query(
        "SELECT * FROM user_progress WHERE user_id = %s", (user_id,), fetch='one'
    )

    return jsonify({"user": user, "skills": skills, "progress": progress})


# ─── UPDATE PROFILE ──────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    execute_query(
        """UPDATE users SET full_name=%s, branch=%s, college=%s,
                  graduation_year=%s, bio=%s, linkedin_url=%s, github_url=%s
           WHERE id=%s""",
        (data.get('full_name'), data.get('branch'), data.get('college'),
         data.get('graduation_year'), data.get('bio'),
         data.get('linkedin_url'), data.get('github_url'), user_id),
        fetch='none'
    )
    return jsonify({"message": "Profile updated successfully"})


# ─── FORGOT PASSWORD ─────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.get_json().get('email', '').lower().strip()
    user = execute_query("SELECT id, full_name FROM users WHERE email = %s", (email,), fetch='one')

    # Always return success (don't leak if email exists)
    if not user:
        return jsonify({"message": "If this email exists, a reset link has been sent."})

    token = secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(token.encode()).hexdigest()
    expiry = datetime.now() + timedelta(hours=1)

    execute_query(
        "UPDATE users SET reset_token=%s, reset_expiry=%s WHERE id=%s",
        (hashed_token, expiry, user['id']), fetch='none'
    )

    send_password_reset_email(email, user['full_name'], token)
    return jsonify({"message": "If this email exists, a reset link has been sent."})


# ─── RESET PASSWORD ──────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data     = request.get_json()
    token    = data.get('token', '')
    new_pass = data.get('password', '')

    if not token or not new_pass or len(new_pass) < 6:
        return jsonify({"error": "Invalid request"}), 400

    hashed_token = hashlib.sha256(token.encode()).hexdigest()
    user = execute_query(
        "SELECT id FROM users WHERE reset_token = %s AND reset_expiry > NOW()",
        (hashed_token,), fetch='one'
    )

    if not user:
        return jsonify({"error": "Invalid or expired reset link"}), 400

    new_hash = generate_password_hash(new_pass, method='pbkdf2:sha256')
    execute_query(
        "UPDATE users SET password_hash=%s, reset_token=NULL, reset_expiry=NULL WHERE id=%s",
        (new_hash, user['id']), fetch='none'
    )

    return jsonify({"message": "Password reset successfully"})


# ─── REFRESH TOKEN ───────────────────────────────────────────
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = int(get_jwt_identity())
    user = execute_query("SELECT role FROM users WHERE id = %s", (user_id,), fetch='one')
    tokens = generate_tokens(user_id, user['role'])
    return jsonify(tokens)
