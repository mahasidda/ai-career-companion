# ============================================================
# services/ats_scorer.py - ATS Score Generation
# ============================================================

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.resume_parser import ALL_SKILLS, TECH_SKILLS

# ─── ROLE-BASED REQUIRED SKILLS ──────────────────────────────
ROLE_SKILLS = {
    "full stack developer": [
        "react", "nodejs", "javascript", "html", "css", "mongodb", "express",
        "rest api", "git", "sql", "python"
    ],
    "data scientist": [
        "python", "machine learning", "pandas", "numpy", "scikit-learn",
        "sql", "tensorflow", "statistics", "data visualization", "r"
    ],
    "backend developer": [
        "python", "flask", "django", "fastapi", "rest api", "mysql",
        "postgresql", "docker", "git", "linux", "sql"
    ],
    "frontend developer": [
        "react", "javascript", "html", "css", "tailwind", "git",
        "webpack", "responsive design", "typescript", "redux"
    ],
    "devops engineer": [
        "docker", "kubernetes", "aws", "linux", "ci/cd", "git", "terraform",
        "ansible", "jenkins", "python", "bash"
    ],
    "mobile developer": [
        "android", "kotlin", "java", "react native", "flutter",
        "rest api", "git", "firebase", "json"
    ],
    "ml engineer": [
        "python", "tensorflow", "pytorch", "machine learning", "deep learning",
        "pandas", "numpy", "docker", "git", "sql", "nlp"
    ]
}

# ─── ATS SCORING ALGORITHM ───────────────────────────────────
def calculate_ats_score(resume_text: str, job_description: str = None, target_role: str = None) -> dict:
    """
    Calculate ATS (Applicant Tracking System) score for a resume.

    Scoring breakdown:
    - Keyword match (40 pts): How many required keywords are present
    - Section completeness (20 pts): Education, Experience, Projects, Skills, etc.
    - Skill relevance (20 pts): TF-IDF cosine similarity with job description
    - Formatting signals (10 pts): Length, contact info
    - Soft factors (10 pts): Action verbs, quantified achievements
    """

    score_breakdown = {}
    resume_lower = resume_text.lower()

    # ── 1. Keyword Match (40 points) ──
    if job_description:
        required_keywords = extract_keywords_from_jd(job_description)
    elif target_role:
        role_key = target_role.lower()
        required_keywords = ROLE_SKILLS.get(role_key, [])
    else:
        # Use general tech skills
        required_keywords = ALL_SKILLS[:50]

    matched_keywords = []
    missing_keywords = []

    for kw in required_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', resume_lower):
            matched_keywords.append(kw)
        else:
            missing_keywords.append(kw)

    keyword_score = min(40, int((len(matched_keywords) / max(len(required_keywords), 1)) * 40))
    score_breakdown['keyword_match'] = {
        "score": keyword_score, "max": 40,
        "matched": matched_keywords[:10], "missing": missing_keywords[:10]
    }

    # ── 2. Section Completeness (20 points) ──
    sections = {
        "education":      any(kw in resume_lower for kw in ['education', 'degree', 'university', 'college', 'b.tech', 'btech']),
        "experience":     any(kw in resume_lower for kw in ['experience', 'internship', 'work', 'employed']),
        "projects":       any(kw in resume_lower for kw in ['project', 'built', 'developed', 'created']),
        "skills":         any(kw in resume_lower for kw in ['skills', 'technologies', 'tools', 'languages']),
        "contact":        bool(re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text)),
        "github/linkedin": any(kw in resume_lower for kw in ['github', 'linkedin', 'portfolio'])
    }

    section_points = sum(5 if k in ['education', 'skills'] else 3 for k, v in sections.items() if v)
    section_score = min(20, section_points)
    score_breakdown['sections'] = {"score": section_score, "max": 20, "details": sections}

    # ── 3. Skill Relevance via TF-IDF (20 points) ──
    tfidf_score = 0
    if job_description:
        try:
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            tfidf_score = int(similarity * 20)
        except:
            tfidf_score = 10  # Default if something fails
    else:
        # Use extracted skill density as proxy
        skill_count = len([s for s in ALL_SKILLS if re.search(r'\b' + re.escape(s) + r'\b', resume_lower)])
        tfidf_score = min(20, skill_count // 3)

    score_breakdown['skill_relevance'] = {"score": tfidf_score, "max": 20}

    # ── 4. Format Quality (10 points) ──
    word_count   = len(resume_text.split())
    has_phone    = bool(re.search(r'[0-9]{10}', resume_text))
    has_email    = bool(re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text))
    good_length  = 300 <= word_count <= 1500

    format_score = 0
    if has_phone:    format_score += 2
    if has_email:    format_score += 3
    if good_length:  format_score += 3
    if word_count > 500: format_score += 2

    score_breakdown['format'] = {
        "score": min(format_score, 10), "max": 10,
        "word_count": word_count, "has_contact": has_email and has_phone
    }

    # ── 5. Action Verbs & Achievements (10 points) ──
    action_verbs = [
        'built', 'developed', 'implemented', 'designed', 'created', 'led',
        'improved', 'reduced', 'increased', 'achieved', 'deployed', 'optimized',
        'automated', 'managed', 'collaborated', 'integrated', 'analyzed'
    ]
    has_numbers  = bool(re.search(r'\d+%|\d+ users|\d+x|\$\d+|₹\d+', resume_lower))
    verb_count   = sum(1 for v in action_verbs if v in resume_lower)

    achievement_score = min(10, verb_count + (3 if has_numbers else 0))
    score_breakdown['achievements'] = {
        "score": achievement_score, "max": 10,
        "action_verbs_found": verb_count, "has_metrics": has_numbers
    }

    # ── TOTAL SCORE ──
    total = (
        keyword_score +
        section_score +
        tfidf_score +
        score_breakdown['format']['score'] +
        achievement_score
    )

    # Grade
    if   total >= 85: grade, color = "Excellent", "green"
    elif total >= 70: grade, color = "Good",      "blue"
    elif total >= 55: grade, color = "Average",   "yellow"
    else:             grade, color = "Needs Work", "red"

    return {
        "total_score":  total,
        "grade":        grade,
        "color":        color,
        "breakdown":    score_breakdown,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords[:15],
        "suggestions":  generate_suggestions(score_breakdown, missing_keywords)
    }


def extract_keywords_from_jd(job_description: str) -> list:
    """Extract important keywords from a job description."""
    jd_lower = job_description.lower()
    found = []
    for skill in ALL_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', jd_lower):
            found.append(skill)
    return found


def generate_suggestions(breakdown: dict, missing_keywords: list) -> list:
    """Generate actionable improvement suggestions."""
    suggestions = []

    if breakdown['keyword_match']['score'] < 25:
        suggestions.append(f"Add more relevant technical skills: {', '.join(missing_keywords[:5])}")

    if not breakdown['sections']['details'].get('projects'):
        suggestions.append("Add a 'Projects' section with 2-3 technical projects")

    if not breakdown['sections']['details'].get('github/linkedin'):
        suggestions.append("Include your GitHub profile URL to showcase your code")

    if breakdown['achievements']['action_verbs_found'] < 3:
        suggestions.append("Use strong action verbs (Built, Developed, Implemented, Led)")

    if not breakdown['achievements']['has_metrics']:
        suggestions.append("Quantify your achievements (e.g., 'Improved load time by 40%')")

    if breakdown['format']['word_count'] < 300:
        suggestions.append("Resume is too short. Expand project descriptions and experience")

    return suggestions
