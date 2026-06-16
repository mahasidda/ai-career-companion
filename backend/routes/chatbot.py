# ============================================================
# routes/chatbot.py - AI Career Chatbot Routes
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import execute_query
from services.ai_service import get_career_advice

chatbot_bp = Blueprint('chatbot', __name__)

# ─── SEND MESSAGE ────────────────────────────────────────────
@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({"error": "Message is required"}), 400

    session_id = data.get('session_id')

    # Create new session if needed
    if not session_id:
        title = message[:50] + ('...' if len(message) > 50 else '')
        session_id = execute_query(
            "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s)",
            (user_id, title), fetch='none'
        )

    # Fetch recent chat history
    history = execute_query(
        """SELECT role, content FROM chat_messages
           WHERE session_id = %s ORDER BY created_at DESC LIMIT 10""",
        (session_id,)
    )
    history = list(reversed(history)) if history else []

    # Fetch user profile for personalization
    user = execute_query(
        "SELECT full_name, branch, graduation_year FROM users WHERE id = %s",
        (user_id,), fetch='one'
    )
    skills = execute_query(
        "SELECT skill_name FROM skills WHERE user_id = %s LIMIT 20", (user_id,)
    )
    user_profile = {
        **(user or {}),
        "skills": [s['skill_name'] for s in skills]
    }

    # Save user message
    execute_query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, 'user', message), fetch='none'
    )

    # Get AI response
    ai_response = get_career_advice(message, history, user_profile)

    # Save assistant response
    execute_query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, 'assistant', ai_response), fetch='none'
    )

    return jsonify({
        "session_id": session_id,
        "response":   ai_response
    })


# ─── GET CHAT SESSIONS ───────────────────────────────────────
@chatbot_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    user_id = int(get_jwt_identity())
    sessions = execute_query(
        "SELECT id, title, created_at FROM chat_sessions WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
        (user_id,)
    )
    return jsonify({"sessions": sessions})


# ─── GET SESSION MESSAGES ────────────────────────────────────
@chatbot_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_messages(session_id):
    user_id = int(get_jwt_identity())
    session = execute_query(
        "SELECT id FROM chat_sessions WHERE id = %s AND user_id = %s",
        (session_id, user_id), fetch='one'
    )
    if not session:
        return jsonify({"error": "Session not found"}), 404

    messages = execute_query(
        "SELECT role, content, created_at FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC",
        (session_id,)
    )
    return jsonify({"messages": messages})


# ─── DELETE SESSION ──────────────────────────────────────────
@chatbot_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    user_id = int(get_jwt_identity())
    execute_query(
        "DELETE FROM chat_sessions WHERE id = %s AND user_id = %s",
        (session_id, user_id), fetch='none'
    )
    return jsonify({"message": "Session deleted"})
