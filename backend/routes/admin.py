# ============================================================
# routes/admin.py - Admin Panel Routes
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from utils.db import execute_query
from utils.jwt_utils import admin_required
import json

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    total_users = execute_query("SELECT COUNT(*) as cnt FROM users WHERE role='student'", fetch='one')
    total_resumes = execute_query("SELECT COUNT(*) as cnt FROM resumes", fetch='one')
    total_interviews = execute_query("SELECT COUNT(*) as cnt FROM mock_interviews WHERE completed=TRUE", fetch='one')
    avg_ats = execute_query("SELECT AVG(ats_score) as avg FROM resumes", fetch='one')
    new_today = execute_query(
        "SELECT COUNT(*) as cnt FROM users WHERE DATE(created_at) = CURDATE()", fetch='one'
    )
    top_skills = execute_query(
        """SELECT skill_name, COUNT(*) as count FROM skills
           GROUP BY skill_name ORDER BY count DESC LIMIT 10"""
    )
    monthly_signups = execute_query(
        """SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as count
           FROM users GROUP BY month ORDER BY month DESC LIMIT 6"""
    )
    return jsonify({
        "stats": {
            "total_users":       total_users['cnt'],
            "total_resumes":     total_resumes['cnt'],
            "total_interviews":  total_interviews['cnt'],
            "avg_ats_score":     round(float(avg_ats['avg'] or 0), 1),
            "new_today":         new_today['cnt']
        },
        "top_skills":     top_skills,
        "monthly_signups": monthly_signups
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    page  = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit
    users = execute_query(
        """SELECT id, full_name, email, role, branch, college, is_active, created_at
           FROM users ORDER BY created_at DESC LIMIT %s OFFSET %s""",
        (limit, offset)
    )
    total = execute_query("SELECT COUNT(*) as cnt FROM users", fetch='one')
    return jsonify({"users": users, "total": total['cnt'], "page": page})

@admin_bp.route('/users/<int:user_id>/toggle', methods=['PUT'])
@admin_required
def toggle_user(user_id):
    execute_query(
        "UPDATE users SET is_active = NOT is_active WHERE id = %s", (user_id,), fetch='none'
    )
    return jsonify({"message": "User status toggled"})

@admin_bp.route('/internships', methods=['POST'])
@admin_required
def add_internship():
    data = request.get_json()
    required = ['title', 'company', 'required_skills']
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"{f} required"}), 400

    iid = execute_query(
        """INSERT INTO internships (title, company, location, type, duration, stipend,
           required_skills, description, domain, apply_link)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (data['title'], data['company'], data.get('location'), data.get('type','remote'),
         data.get('duration'), data.get('stipend'),
         json.dumps(data['required_skills']), data.get('description'),
         data.get('domain'), data.get('apply_link')),
        fetch='none'
    )
    return jsonify({"id": iid, "message": "Internship added"}), 201

@admin_bp.route('/internships/<int:iid>', methods=['DELETE'])
@admin_required
def delete_internship(iid):
    execute_query(
        "UPDATE internships SET is_active = FALSE WHERE id = %s", (iid,), fetch='none'
    )
    return jsonify({"message": "Internship removed"})
