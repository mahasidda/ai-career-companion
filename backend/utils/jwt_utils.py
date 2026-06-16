# ============================================================
# utils/jwt_utils.py - JWT Helper Utilities
# ============================================================

from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    get_jwt_identity, verify_jwt_in_request,
    get_jwt
)
from functools import wraps
from flask import jsonify

def generate_tokens(user_id, role='student'):
    """Generate access and refresh tokens for a user."""
    identity = str(user_id)
    additional_claims = {"role": role}

    access_token  = create_access_token(identity=identity, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=identity)

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token
    }

def admin_required(fn):
    """Decorator: Only admins can access this route."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper

def get_current_user_id():
    """Get the current user's ID from JWT token."""
    return int(get_jwt_identity())
