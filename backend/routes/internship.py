# ============================================================
# routes/internship.py - Complete with Live Jobs + Internships
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import execute_query
from ml.internship_recommender import recommend_internships, skill_gap_analysis
from services.ai_service import generate_learning_roadmap
import json, os, requests as req

internship_bp = Blueprint('internship', __name__)
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')


@internship_bp.route('/recommend', methods=['GET'])
@jwt_required()
def recommend():
    user_id = int(get_jwt_identity())
    user_skills_raw = execute_query("SELECT skill_name FROM skills WHERE user_id = %s", (user_id,))
    user_skills = [s['skill_name'] for s in user_skills_raw]
    internships = execute_query("SELECT * FROM internships WHERE is_active = TRUE")
    recommendations = recommend_internships(user_skills, internships, top_n=8)
    return jsonify({"recommendations": recommendations, "user_skills": user_skills, "total": len(recommendations)})


@internship_bp.route('/', methods=['GET'])
@jwt_required()
def get_all():
    domain = request.args.get('domain')
    itype  = request.args.get('type')
    search = request.args.get('search', '')
    query  = "SELECT * FROM internships WHERE is_active = TRUE"
    params = []
    if domain:
        query += " AND domain = %s"
        params.append(domain)
    if itype:
        query += " AND type = %s"
        params.append(itype)
    if search:
        query += " AND (title LIKE %s OR company LIKE %s OR description LIKE %s)"
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
    query += " ORDER BY posted_at DESC"
    internships = execute_query(query, tuple(params) if params else None)
    for i in internships:
        if isinstance(i['required_skills'], str):
            i['required_skills'] = json.loads(i['required_skills'])
    return jsonify({"internships": internships})


@internship_bp.route('/live', methods=['GET'])
@jwt_required()
def get_live_internships():
    query = request.args.get('query', 'software engineer internship India')
    page  = request.args.get('page', '1')
    if not RAPIDAPI_KEY:
        return jsonify({"error": "RapidAPI key not configured"}), 500
    try:
        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key":  RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        params = {"query": query, "page": page, "num_pages": "1"}
        response = req.get(url, headers=headers, params=params, timeout=30)
        data = response.json()
        internships = []
        for job in data.get('data', []):
            internships.append({
                "id":              job.get('job_id'),
                "title":           job.get('job_title', 'N/A'),
                "company":         job.get('employer_name', 'N/A'),
                "company_logo":    job.get('employer_logo'),
                "location":        f"{job.get('job_city', '')} {job.get('job_country', '')}".strip(),
                "type":            "remote" if job.get('job_is_remote') else "onsite",
                "description":     (job.get('job_description') or '')[:300],
                "apply_link":      job.get('job_apply_link'),
                "posted_at":       job.get('job_posted_at_datetime_utc'),
                "required_skills": job.get('job_required_skills') or [],
                "stipend":         "As per industry",
                "domain":          "Technology",
                "employment_type": job.get('job_employment_type', ''),
                "is_live":         True
            })
        return jsonify({"internships": internships, "total": len(internships), "source": "JSearch"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@internship_bp.route('/live-jobs', methods=['GET'])
@jwt_required()
def get_live_jobs():
    query    = request.args.get('query', 'software engineer India')
    job_type = request.args.get('type', 'all')
    company  = request.args.get('company', '')
    page     = request.args.get('page', '1')

    if not RAPIDAPI_KEY:
        return jsonify({"error": "RapidAPI key not configured"}), 500

    try:
        search_query = f"{query} {company}".strip() if company else query
        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key":  RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        params = {
            "query":     search_query,
            "page":      page,
            "num_pages": "1"
        }
        response = req.get(url, headers=headers, params=params, timeout=30)
        data = response.json()

        jobs = []
        for job in data.get('data', []):
            emp_type = job.get('job_employment_type', '').upper()
            is_intern = any(kw in (job.get('job_title') or '').lower()
                           for kw in ['intern', 'internship', 'trainee'])

            if job_type == 'internship' and not is_intern:
                continue
            if job_type == 'fulltime' and is_intern:
                continue

            jobs.append({
                "id":              job.get('job_id'),
                "title":           job.get('job_title', 'N/A'),
                "company":         job.get('employer_name', 'N/A'),
                "company_logo":    job.get('employer_logo'),
                "location":        f"{job.get('job_city', '')} {job.get('job_country', '')}".strip(),
                "type":            "remote" if job.get('job_is_remote') else "onsite",
                "employment_type": emp_type,
                "description":     (job.get('job_description') or '')[:300],
                "apply_link":      job.get('job_apply_link'),
                "posted_at":       job.get('job_posted_at_datetime_utc'),
                "required_skills": job.get('job_required_skills') or [],
                "salary":          job.get('job_salary') or 'As per industry',
                "is_intern":       is_intern,
                "is_live":         True
            })

        return jsonify({"jobs": jobs, "total": len(jobs), "source": "JSearch API"})

    except req.exceptions.Timeout:
        return jsonify({"error": "Search timed out. Please try again."}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@internship_bp.route('/<int:internship_id>/save', methods=['POST'])
@jwt_required()
def save_internship(internship_id):
    user_id = int(get_jwt_identity())
    status  = request.get_json().get('status', 'saved')
    execute_query(
        "INSERT INTO internship_applications (user_id, internship_id, status) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE status=%s",
        (user_id, internship_id, status, status), fetch='none'
    )
    return jsonify({"message": f"Internship {status}"})


@internship_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def my_applications():
    user_id = int(get_jwt_identity())
    apps = execute_query(
        """SELECT ia.*, i.title, i.company, i.type, i.stipend, i.domain
           FROM internship_applications ia
           JOIN internships i ON ia.internship_id = i.id
           WHERE ia.user_id = %s ORDER BY ia.applied_at DESC""",
        (user_id,)
    )
    return jsonify({"applications": apps})


@internship_bp.route('/skill-gap', methods=['POST'])
@jwt_required()
def get_skill_gap():
    user_id     = int(get_jwt_identity())
    target_role = request.get_json().get('target_role', 'full stack developer')
    user_skills_raw = execute_query("SELECT skill_name FROM skills WHERE user_id = %s", (user_id,))
    user_skills = [s['skill_name'] for s in user_skills_raw]
    gap = skill_gap_analysis(user_skills, target_role)
    roadmap = generate_learning_roadmap(user_skills, target_role, gap['missing_essential'])
    execute_query(
        """INSERT INTO skill_gap_reports
           (user_id, target_role, user_skills, required_skills, missing_skills, gap_percentage, roadmap)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (user_id, target_role, json.dumps(user_skills),
         json.dumps(gap['have_essential'] + gap['have_good_to_have']),
         json.dumps(gap['missing_essential']),
         gap['gap_percentage'], roadmap),
        fetch='none'
    )
    return jsonify({**gap, "roadmap": roadmap})