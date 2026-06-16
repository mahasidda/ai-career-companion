# ============================================================
# routes/resume.py - Resume Upload & Analysis Routes
# ============================================================

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from utils.db import execute_query
from services.resume_parser import analyze_resume
from services.ats_scorer import calculate_ats_score
from services.ai_service import suggest_resume_improvements
import os, json

resume_bp = Blueprint('resume', __name__)
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── UPLOAD & ANALYZE RESUME ─────────────────────────────────
@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    user_id = int(get_jwt_identity())

    if 'resume' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['resume']
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    filename  = secure_filename(file.filename)
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{user_id}_{filename}")
    file.save(file_path)

    try:
        # Step 1: Extract text + skills from PDF
        analysis = analyze_resume(file_path)

        # Step 2: Get optional job description
        job_description = request.form.get('job_description', '')
        target_role     = request.form.get('target_role', 'full stack developer')

        # Step 3: ATS scoring
        ats_result = calculate_ats_score(
            analysis['raw_text'],
            job_description=job_description if job_description else None,
            target_role=target_role
        )

        # Step 4: Save to database
        resume_id = execute_query(
            """INSERT INTO resumes (user_id, file_name, file_path, raw_text,
               extracted_skills, ats_score, missing_skills, analysis_summary)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (user_id, filename, file_path,
             analysis['raw_text'][:5000],
             json.dumps(analysis['skills']),
             ats_result['total_score'],
             json.dumps(ats_result['missing_keywords']),
             f"ATS Score: {ats_result['total_score']}/100 - {ats_result['grade']}"),
            fetch='none'
        )

        # Step 5: Update user skills from resume
        for skill in analysis['skills'][:20]:
            existing = execute_query(
                "SELECT id FROM skills WHERE user_id=%s AND skill_name=%s",
                (user_id, skill), fetch='one'
            )
            if not existing:
                execute_query(
                    "INSERT INTO skills (user_id, skill_name) VALUES (%s, %s)",
                    (user_id, skill), fetch='none'
                )

        # Update progress
        execute_query(
            "UPDATE user_progress SET resumes_uploaded = resumes_uploaded + 1 WHERE user_id = %s",
            (user_id,), fetch='none'
        )

        return jsonify({
            "resume_id":       resume_id,
            "filename":        filename,
            "extracted_skills": analysis['skills'],
            "sections":        analysis['sections'],
            "contact_info":    analysis['contact_info'],
            "ats_score":       ats_result
        }), 201

    except Exception as e:
        return jsonify({"error": f"Resume processing failed: {str(e)}"}), 500


# ─── GET RESUME HISTORY ──────────────────────────────────────
@resume_bp.route('/history', methods=['GET'])
@jwt_required()
def get_resume_history():
    user_id = int(get_jwt_identity())
    resumes = execute_query(
        """SELECT id, file_name, ats_score, analysis_summary, extracted_skills,
                  missing_skills, uploaded_at
           FROM resumes WHERE user_id = %s ORDER BY uploaded_at DESC""",
        (user_id,)
    )
    for r in resumes:
        if isinstance(r['extracted_skills'], str):
            r['extracted_skills'] = json.loads(r['extracted_skills'])
        if isinstance(r['missing_skills'], str):
            r['missing_skills'] = json.loads(r['missing_skills'])
    return jsonify({"resumes": resumes})


# ─── GET SINGLE RESUME ───────────────────────────────────────
@resume_bp.route('/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    user_id = int(get_jwt_identity())
    resume = execute_query(
        "SELECT * FROM resumes WHERE id = %s AND user_id = %s",
        (resume_id, user_id), fetch='one'
    )
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    if isinstance(resume['extracted_skills'], str):
        resume['extracted_skills'] = json.loads(resume['extracted_skills'])
    if isinstance(resume['missing_skills'], str):
        resume['missing_skills'] = json.loads(resume['missing_skills'])

    return jsonify({"resume": resume})


# ─── AI IMPROVEMENT SUGGESTIONS ──────────────────────────────
@resume_bp.route('/<int:resume_id>/improve', methods=['POST'])
@jwt_required()
def get_improvements(resume_id):
    user_id = int(get_jwt_identity())
    resume  = execute_query(
        "SELECT raw_text, missing_skills FROM resumes WHERE id=%s AND user_id=%s",
        (resume_id, user_id), fetch='one'
    )
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    target_role   = request.get_json().get('target_role', 'Software Developer')
    missing       = json.loads(resume['missing_skills']) if isinstance(resume['missing_skills'], str) else []
    suggestions   = suggest_resume_improvements(resume['raw_text'] or '', target_role, missing)

    return jsonify({"suggestions": suggestions})
