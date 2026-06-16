# ============================================================
# services/resume_parser.py - PDF Resume Text Extraction
# ============================================================

import re
import json

# Try to import PDF libraries (install: pip install pdfplumber PyMuPDF)
try:
    import pdfplumber
    PDF_BACKEND = 'pdfplumber'
except ImportError:
    PDF_BACKEND = None

try:
    import fitz  # PyMuPDF
    PDF_BACKEND = 'pymupdf'
except ImportError:
    pass

# ─── TECH SKILLS DATABASE ────────────────────────────────────
TECH_SKILLS = {
    "programming_languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "c", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "dart", "perl", "shell", "bash", "powershell"
    ],
    "web_frontend": [
        "react", "angular", "vue", "nextjs", "gatsby", "svelte", "html", "css",
        "tailwind", "bootstrap", "sass", "less", "jquery", "webpack", "vite",
        "redux", "mobx", "graphql", "apollo"
    ],
    "web_backend": [
        "nodejs", "express", "flask", "django", "fastapi", "spring", "laravel",
        "rails", "asp.net", "nestjs", "hapi", "koa", "restapi", "soap", "grpc"
    ],
    "databases": [
        "mysql", "postgresql", "mongodb", "redis", "sqlite", "oracle", "mssql",
        "cassandra", "elasticsearch", "dynamodb", "firebase", "supabase"
    ],
    "cloud_devops": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "github actions", "circleci", "nginx", "apache", "linux",
        "ci/cd", "devops"
    ],
    "ai_ml": [
        "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
        "pytorch", "scikit-learn", "keras", "pandas", "numpy", "matplotlib",
        "opencv", "transformers", "huggingface"
    ],
    "mobile": [
        "android", "ios", "react native", "flutter", "xamarin", "ionic",
        "swift", "kotlin", "objective-c"
    ],
    "tools": [
        "git", "github", "gitlab", "jira", "confluence", "postman", "figma",
        "vscode", "linux", "agile", "scrum", "rest", "api"
    ]
}

ALL_SKILLS = []
for category, skills in TECH_SKILLS.items():
    ALL_SKILLS.extend(skills)

# ─── PDF TEXT EXTRACTION ─────────────────────────────────────
def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file."""
    text = ""

    if PDF_BACKEND == 'pdfplumber':
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        except Exception as e:
            raise Exception(f"pdfplumber error: {str(e)}")

    elif PDF_BACKEND == 'pymupdf':
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()
        except Exception as e:
            raise Exception(f"PyMuPDF error: {str(e)}")

    else:
        raise Exception("No PDF library installed. Run: pip install pdfplumber")

    return text.strip()


# ─── SKILLS EXTRACTION ───────────────────────────────────────
def extract_skills_from_text(text: str) -> list:
    """Extract technical skills mentioned in resume text."""
    text_lower = text.lower()
    found_skills = []

    for skill in ALL_SKILLS:
        # Word-boundary matching
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            # Return properly capitalized version
            found_skills.append(skill.title() if len(skill) > 2 else skill.upper())

    # Remove duplicates and sort
    return sorted(list(set(found_skills)))


# ─── CONTACT INFO EXTRACTION ─────────────────────────────────
def extract_contact_info(text: str) -> dict:
    """Extract email, phone, LinkedIn from resume text."""
    info = {}

    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        info['email'] = email_match.group()

    phone_match = re.search(r'(\+91[\-\s]?)?[0-9]{10}', text)
    if phone_match:
        info['phone'] = phone_match.group()

    linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
    if linkedin_match:
        info['linkedin'] = linkedin_match.group()

    github_match = re.search(r'github\.com/[\w-]+', text, re.IGNORECASE)
    if github_match:
        info['github'] = github_match.group()

    return info


# ─── SECTION DETECTION ───────────────────────────────────────
def detect_resume_sections(text: str) -> dict:
    """Detect standard resume sections."""
    sections = {
        'education': False,
        'experience': False,
        'projects': False,
        'skills': False,
        'certifications': False,
        'achievements': False
    }

    text_lower = text.lower()
    section_keywords = {
        'education':      ['education', 'academic', 'qualification', 'degree'],
        'experience':     ['experience', 'work history', 'employment', 'internship'],
        'projects':       ['projects', 'personal projects', 'academic projects'],
        'skills':         ['skills', 'technical skills', 'core competencies'],
        'certifications': ['certifications', 'certificates', 'courses'],
        'achievements':   ['achievements', 'awards', 'honors', 'accomplishments']
    }

    for section, keywords in section_keywords.items():
        if any(kw in text_lower for kw in keywords):
            sections[section] = True

    return sections


# ─── FULL RESUME ANALYSIS ────────────────────────────────────
def analyze_resume(file_path: str) -> dict:
    """
    Full resume analysis pipeline.
    Returns: dict with raw_text, skills, sections, contact_info
    """
    raw_text = extract_text_from_pdf(file_path)
    skills   = extract_skills_from_text(raw_text)
    sections = detect_resume_sections(raw_text)
    contact  = extract_contact_info(raw_text)

    return {
        "raw_text":     raw_text,
        "skills":       skills,
        "sections":     sections,
        "contact_info": contact
    }
