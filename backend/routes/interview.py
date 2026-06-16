# ============================================================
# routes/interview.py - Real Virtual AI Interview
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import execute_query
from services.ai_service import (
    generate_interview_question,
    evaluate_interview_answer,
    generate_role_based_question,
    generate_resume_based_question
)
from datetime import datetime
import json

interview_bp = Blueprint('interview', __name__)

ROLE_SKILLS = {
    "Full Stack Developer":  ["React", "Node.js", "JavaScript", "HTML", "CSS", "MongoDB", "REST API", "Git"],
    "Data Scientist":        ["Python", "Machine Learning", "Pandas", "SQL", "Statistics", "TensorFlow"],
    "Backend Developer":     ["Python", "Flask", "Django", "MySQL", "REST API", "Docker", "Linux"],
    "Frontend Developer":    ["React", "JavaScript", "HTML", "CSS", "TypeScript", "Redux", "Git"],
    "DevOps Engineer":       ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "Terraform", "Git"],
    "ML Engineer":           ["Python", "TensorFlow", "PyTorch", "Deep Learning", "NLP", "Docker"],
    "Android Developer":     ["Android", "Kotlin", "Java", "Firebase", "REST API", "Git"],
    "Data Analyst":          ["Python", "SQL", "Excel", "Tableau", "Power BI", "Statistics"],
}

@interview_bp.route('/start', methods=['POST'])
@jwt_required()
def start_interview():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    interview_type  = data.get('interview_type', 'technical')
    domain          = data.get('domain', 'Python')
    target_role     = data.get('target_role', '')
    num_questions   = min(int(data.get('num_questions', 5)), 10)
    resume_text     = data.get('resume_text', '')
    interview_mode  = data.get('interview_mode', 'domain')  # domain | role | resume

    interview_id = execute_query(
        """INSERT INTO mock_interviews (user_id, interview_type, domain, total_questions)
           VALUES (%s, %s, %s, %s)""",
        (user_id, interview_type, target_role or domain, num_questions),
        fetch='none'
    )

    # Generate opening message
    if interview_mode == 'resume':
        opening = f"Hello! I'm your AI interviewer today. I've reviewed your resume and will ask you questions based on your experience and skills. Let's begin with the first question."
        first_q = generate_resume_based_question(resume_text, interview_type, 'easy')
    elif interview_mode == 'role':
        role_skills = ROLE_SKILLS.get(target_role, [])
        opening = f"Hello! I'm your AI interviewer. Today we'll have a {interview_type} interview for the {target_role} position. I'll ask you {num_questions} questions. Let's begin."
        first_q = generate_role_based_question(target_role, role_skills, interview_type, 'easy')
    else:
        opening = f"Hello! I'm your AI interviewer. Today we'll have a {interview_type} interview focused on {domain}. I'll ask you {num_questions} questions. Let's get started."
        first_q = generate_interview_question(domain, difficulty='easy', q_type=interview_type if interview_type != 'mixed' else 'technical')

    question_id = execute_query(
        """INSERT INTO interview_questions (interview_id, question_text, question_type, difficulty)
           VALUES (%s, %s, %s, %s)""",
        (interview_id, first_q['question'], first_q.get('type', interview_type), 'easy'),
        fetch='none'
    )
    first_q['id']           = question_id
    first_q['question_num'] = 1

    return jsonify({
        "interview_id":  interview_id,
        "domain":        target_role or domain,
        "total":         num_questions,
        "opening":       opening,
        "question":      first_q,
        "interview_mode": interview_mode
    }), 201


@interview_bp.route('/<int:interview_id>/answer', methods=['POST'])
@jwt_required()
def submit_answer(interview_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    question_id = data.get('question_id')
    user_answer = data.get('answer', '')
    resume_text = data.get('resume_text', '')
    interview_mode = data.get('interview_mode', 'domain')

    interview = execute_query(
        "SELECT * FROM mock_interviews WHERE id = %s AND user_id = %s",
        (interview_id, user_id), fetch='one'
    )
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    question = execute_query(
        "SELECT question_text FROM interview_questions WHERE id = %s AND interview_id = %s",
        (question_id, interview_id), fetch='one'
    )
    if not question:
        return jsonify({"error": "Question not found"}), 404

    evaluation = evaluate_interview_answer(
        question['question_text'], user_answer, interview['domain']
    )

    execute_query(
        """UPDATE interview_questions
           SET user_answer=%s, ai_feedback=%s, score=%s, answered_at=NOW()
           WHERE id=%s""",
        (user_answer, evaluation['feedback'], evaluation['score'], question_id),
        fetch='none'
    )

    answered = execute_query(
        "SELECT COUNT(*) as cnt FROM interview_questions WHERE interview_id=%s AND user_answer IS NOT NULL",
        (interview_id,), fetch='one'
    )
    answered_count = answered['cnt']
    total          = interview['total_questions']

    # Transition message based on score
    if evaluation['score'] >= 8:
        transition = "Excellent answer! That was very impressive."
    elif evaluation['score'] >= 6:
        transition = "Good answer! You demonstrated solid understanding."
    elif evaluation['score'] >= 4:
        transition = "Thank you for your answer. Let's move on."
    else:
        transition = "I see. Thank you for your response. Let's continue."

    if answered_count < total:
        difficulties = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'medium', 'hard', 'hard', 'hard']
        difficulty   = difficulties[min(answered_count, len(difficulties)-1)]

        if interview_mode == 'resume':
            next_q = generate_resume_based_question(resume_text, interview['interview_type'], difficulty)
        elif interview_mode == 'role':
            role_skills = ROLE_SKILLS.get(interview['domain'], [])
            next_q = generate_role_based_question(interview['domain'], role_skills, interview['interview_type'], difficulty)
        else:
            q_type = 'hr' if (answered_count >= total - 2 and interview['interview_type'] == 'mixed') else 'technical'
            next_q = generate_interview_question(interview['domain'], difficulty, q_type)

        next_id = execute_query(
            """INSERT INTO interview_questions (interview_id, question_text, question_type, difficulty)
               VALUES (%s, %s, %s, %s)""",
            (interview_id, next_q['question'], next_q.get('type','technical'), difficulty),
            fetch='none'
        )
        next_q['id']           = next_id
        next_q['question_num'] = answered_count + 1

        return jsonify({
            "evaluation":    evaluation,
            "transition":    transition,
            "next_question": next_q,
            "progress":      {"answered": answered_count, "total": total},
            "completed":     False
        })

    else:
        all_scores = execute_query(
            "SELECT score FROM interview_questions WHERE interview_id=%s AND score IS NOT NULL",
            (interview_id,)
        )
        scores    = [float(s['score']) for s in all_scores] if all_scores else [0]
        avg_score = sum(scores) / len(scores) if scores else 0
        correct   = sum(1 for s in scores if s >= 6)
        final_pct = round(avg_score * 10, 1)

        if final_pct >= 80:
            overall = "Outstanding performance! You're very well-prepared for this role. You demonstrated strong technical knowledge and excellent communication skills."
        elif final_pct >= 65:
            overall = "Good performance! You have a solid foundation. Focus on deepening your understanding of advanced concepts and practice more real-world scenarios."
        elif final_pct >= 45:
            overall = "Average performance. You understand the basics but need to strengthen your core concepts. Regular practice and project work will help significantly."
        else:
            overall = "Keep practicing! Review the fundamentals thoroughly and solve more problems. Consistency in practice will show great improvement."

        closing = f"That concludes our interview. Overall you performed well. {overall} Thank you for your time and best of luck!"

        execute_query(
            """UPDATE mock_interviews
               SET total_score=%s, correct_count=%s, feedback=%s, completed=TRUE, completed_at=NOW()
               WHERE id=%s""",
            (final_pct, correct, overall, interview_id), fetch='none'
        )
        execute_query(
            "UPDATE user_progress SET interviews_taken = interviews_taken + 1 WHERE user_id = %s",
            (user_id,), fetch='none'
        )

        return jsonify({
            "evaluation":       evaluation,
            "transition":       transition,
            "completed":        True,
            "final_score":      final_pct,
            "correct_count":    correct,
            "total_questions":  total,
            "overall_feedback": overall,
            "closing_message":  closing
        })


@interview_bp.route('/<int:interview_id>/results', methods=['GET'])
@jwt_required()
def get_results(interview_id):
    user_id = int(get_jwt_identity())
    interview = execute_query(
        "SELECT * FROM mock_interviews WHERE id=%s AND user_id=%s",
        (interview_id, user_id), fetch='one'
    )
    if not interview:
        return jsonify({"error": "Not found"}), 404
    questions = execute_query(
        "SELECT * FROM interview_questions WHERE interview_id=%s ORDER BY id ASC",
        (interview_id,)
    )
    return jsonify({"interview": interview, "questions": questions})


@interview_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    interviews = execute_query(
        """SELECT id, interview_type, domain, total_score, total_questions,
                  correct_count, completed, started_at, completed_at
           FROM mock_interviews WHERE user_id=%s ORDER BY started_at DESC LIMIT 20""",
        (user_id,)
    )
    return jsonify({"interviews": interviews})

def generate_role_based_question(role: str, skills: list, q_type: str = 'technical', difficulty: str = 'medium') -> dict:
    prompt = f"""Generate one {difficulty} {q_type} interview question for a {role} position.
The candidate's expected skills are: {', '.join(skills[:8])}

Return ONLY valid JSON:
{{
  "question": "The interview question here",
  "hints": ["Hint 1", "Hint 2"],
  "ideal_answer_points": ["Key point 1", "Key point 2"],
  "difficulty": "{difficulty}",
  "type": "{q_type}"
}}"""
    try:
        response = call_gemini(prompt, temperature=0.8)
        response = response.strip().lstrip('```json').lstrip('```').rstrip('```')
        return json.loads(response.strip())
    except:
        return {
            "question": f"As a {role}, how would you approach building a scalable system?",
            "hints": ["Think about architecture", "Consider performance"],
            "ideal_answer_points": ["Clear architecture", "Scalability considerations"],
            "difficulty": difficulty,
            "type": q_type
        }


def generate_resume_based_question(resume_text: str, q_type: str = 'technical', difficulty: str = 'medium') -> dict:
    prompt = f"""You are an interviewer. Based on this resume, generate one {difficulty} interview question.
Focus on projects, skills, or experiences mentioned in the resume.

Resume (first 800 chars): {resume_text[:800]}

Return ONLY valid JSON:
{{
  "question": "Specific question based on their resume",
  "hints": ["Hint 1"],
  "ideal_answer_points": ["Key point 1", "Key point 2"],
  "difficulty": "{difficulty}",
  "type": "{q_type}"
}}"""
    try:
        response = call_gemini(prompt, temperature=0.8)
        response = response.strip().lstrip('```json').lstrip('```').rstrip('```')
        return json.loads(response.strip())
    except:
        return {
            "question": "Tell me about your most challenging project and how you solved the technical problems.",
            "hints": ["Focus on a specific project", "Mention technologies used"],
            "ideal_answer_points": ["Problem description", "Solution approach", "Technologies used", "Results"],
            "difficulty": difficulty,
            "type": q_type
        }