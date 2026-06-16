# ============================================================
# routes/skills.py - Skills Management Routes
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import execute_query

skills_bp = Blueprint('skills', __name__)

@skills_bp.route('/', methods=['GET'])
@jwt_required()
def get_skills():
    user_id = int(get_jwt_identity())
    skills  = execute_query(
        "SELECT * FROM skills WHERE user_id = %s ORDER BY category, skill_name",
        (user_id,)
    )
    return jsonify({"skills": skills})

@skills_bp.route('/', methods=['POST'])
@jwt_required()
def add_skill():
    user_id    = int(get_jwt_identity())
    data       = request.get_json()
    skill_name = data.get('skill_name', '').strip()
    level      = data.get('level', 'beginner')
    category   = data.get('category', 'general')

    if not skill_name:
        return jsonify({"error": "skill_name required"}), 400

    existing = execute_query(
        "SELECT id FROM skills WHERE user_id=%s AND skill_name=%s",
        (user_id, skill_name), fetch='one'
    )
    if existing:
        return jsonify({"error": "Skill already exists"}), 409

    skill_id = execute_query(
        "INSERT INTO skills (user_id, skill_name, level, category) VALUES (%s,%s,%s,%s)",
        (user_id, skill_name, level, category), fetch='none'
    )
    execute_query(
        "UPDATE user_progress SET skills_count = skills_count + 1 WHERE user_id = %s",
        (user_id,), fetch='none'
    )
    return jsonify({"id": skill_id, "skill_name": skill_name, "level": level}), 201

@skills_bp.route('/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    execute_query(
        "UPDATE skills SET level=%s WHERE id=%s AND user_id=%s",
        (data.get('level'), skill_id, user_id), fetch='none'
    )
    return jsonify({"message": "Updated"})

@skills_bp.route('/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    user_id = int(get_jwt_identity())
    execute_query(
        "DELETE FROM skills WHERE id=%s AND user_id=%s", (skill_id, user_id), fetch='none'
    )
    execute_query(
        "UPDATE user_progress SET skills_count = GREATEST(skills_count - 1, 0) WHERE user_id=%s",
        (user_id,), fetch='none'
    )
    return jsonify({"message": "Deleted"})
