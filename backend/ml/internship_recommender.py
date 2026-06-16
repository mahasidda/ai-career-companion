# ============================================================
# ml/internship_recommender.py - Skill-based Matching Algorithm
# ============================================================

import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def calculate_match_score(user_skills: list, required_skills: list) -> float:
    """
    Calculate match percentage between user skills and internship requirements.
    Uses both exact matching + TF-IDF similarity for better results.
    """
    if not required_skills or not user_skills:
        return 0.0

    user_skills_lower    = [s.lower() for s in user_skills]
    required_skills_lower = [s.lower() for s in required_skills]

    # Method 1: Exact keyword overlap
    matched = set(user_skills_lower) & set(required_skills_lower)
    exact_score = len(matched) / len(required_skills_lower)

    # Method 2: TF-IDF cosine similarity
    try:
        user_text     = ' '.join(user_skills_lower)
        required_text = ' '.join(required_skills_lower)
        vectorizer    = TfidfVectorizer()
        tfidf_matrix  = vectorizer.fit_transform([user_text, required_text])
        tfidf_score   = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except:
        tfidf_score = exact_score

    # Weighted combination: 70% exact, 30% similarity
    final_score = (0.7 * exact_score + 0.3 * float(tfidf_score)) * 100
    return round(min(100, final_score), 1)


def recommend_internships(user_skills: list, internships: list, top_n: int = 5) -> list:
    """
    Recommend internships based on user skills.
    Returns sorted list with match scores.
    """
    recommendations = []

    for internship in internships:
        # Parse required_skills (stored as JSON string in DB)
        if isinstance(internship['required_skills'], str):
            required = json.loads(internship['required_skills'])
        else:
            required = internship['required_skills'] or []

        score = calculate_match_score(user_skills, required)

        matched_skills  = [s for s in required if s.lower() in [u.lower() for u in user_skills]]
        missing_skills  = [s for s in required if s.lower() not in [u.lower() for u in user_skills]]

        recommendations.append({
            **internship,
            "match_score":    score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "apply_ease":     "Easy" if score >= 70 else ("Moderate" if score >= 40 else "Stretch")
        })

    # Sort by match score descending
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations[:top_n]


def skill_gap_analysis(user_skills: list, target_role: str) -> dict:
    """
    Compare user skills against industry-standard skills for a role.
    Returns gap analysis with improvement plan.
    """
    # Industry standard skills per role
    INDUSTRY_SKILLS = {
        "full stack developer": {
            "essential": ["react", "nodejs", "javascript", "html", "css", "mongodb", "express", "rest api", "git", "sql"],
            "good_to_have": ["typescript", "docker", "redis", "graphql", "aws", "testing"]
        },
        "data scientist": {
            "essential": ["python", "pandas", "numpy", "scikit-learn", "sql", "statistics", "data visualization"],
            "good_to_have": ["tensorflow", "pytorch", "spark", "tableau", "r", "cloud platforms"]
        },
        "backend developer": {
            "essential": ["python", "sql", "rest api", "git", "linux", "docker"],
            "good_to_have": ["kubernetes", "redis", "message queues", "microservices", "aws"]
        },
        "frontend developer": {
            "essential": ["react", "javascript", "html", "css", "git", "responsive design"],
            "good_to_have": ["typescript", "testing", "webpack", "performance optimization", "accessibility"]
        },
        "devops engineer": {
            "essential": ["linux", "docker", "git", "ci/cd", "aws"],
            "good_to_have": ["kubernetes", "terraform", "ansible", "monitoring", "security"]
        },
        "ml engineer": {
            "essential": ["python", "machine learning", "deep learning", "tensorflow", "git", "sql"],
            "good_to_have": ["docker", "kubernetes", "mlops", "cloud platforms", "distributed computing"]
        }
    }

    role_key = target_role.lower()
    role_data = INDUSTRY_SKILLS.get(role_key, INDUSTRY_SKILLS["full stack developer"])

    user_lower  = [s.lower() for s in user_skills]
    essential   = role_data['essential']
    good_to_have = role_data['good_to_have']

    have_essential   = [s for s in essential if s.lower() in user_lower]
    missing_essential = [s for s in essential if s.lower() not in user_lower]
    have_gth         = [s for s in good_to_have if s.lower() in user_lower]
    missing_gth      = [s for s in good_to_have if s.lower() not in user_lower]

    gap_pct = round((len(missing_essential) / len(essential)) * 100, 1) if essential else 0
    readiness = max(0, 100 - gap_pct)

    return {
        "target_role":        target_role,
        "readiness_score":    readiness,
        "gap_percentage":     gap_pct,
        "have_essential":     have_essential,
        "missing_essential":  missing_essential,
        "have_good_to_have":  have_gth,
        "missing_good_to_have": missing_gth,
        "priority_learning":  missing_essential[:5],
        "total_required":     len(essential) + len(good_to_have),
        "total_have":         len(have_essential) + len(have_gth)
    }
