# 🎓 AI Career Companion

> **Final Year Engineering Major Project** — A full-stack AI-powered platform for career guidance, resume analysis, mock interviews, internship recommendations, and skill gap analysis.

![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Flask%20%2B%20MySQL-blueviolet)
![AI](https://img.shields.io/badge/AI-Gemini%20API%20%2B%20Scikit--learn-orange)
![Auth](https://img.shields.io/badge/Auth-JWT-green)

---

## 📌 Project Overview

AI Career Companion helps engineering students:
- Get personalized **career guidance** via AI chatbot
- **Analyze resumes** with ATS scoring and skill gap detection
- Discover **internship opportunities** matched to their skill set
- Practice with **AI-generated mock interviews**
- Track **skill progress** over time
- Get **learning roadmaps** tailored to their target roles

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React.js)                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Auth   │ │Dashboard │ │  Resume  │ │  Chatbot    │  │
│  │ Module  │ │  Module  │ │ Analyzer │ │  Module     │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Mock    │ │Internship│ │ Skill Gap│ │   Admin     │  │
│  │Interview│ │   Reco   │ │ Analysis │ │   Panel     │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘  │
└─────────────────────────┬────────────────────────────────┘
                          │ REST API (Axios)
┌─────────────────────────▼────────────────────────────────┐
│                   BACKEND (Flask + Python)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │JWT Auth  │ │ Resume   │ │ AI/ML    │ │  Internship │ │
│  │ Service  │ │ Parser   │ │ Service  │ │  Recommender│ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
└───────────┬──────────────────────────┬────────────────────┘
            │                          │
    ┌───────▼──────┐         ┌─────────▼──────────┐
    │  MySQL DB    │         │   Gemini / OpenAI  │
    │  (database)  │         │   API (AI layer)   │
    └──────────────┘         └────────────────────┘
```

---

## 🗂️ Folder Structure

```
ai-career-companion/
├── frontend/                    # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/            # Login, Signup, ForgotPassword
│   │   │   ├── Dashboard/       # StudentDashboard, AdminDashboard
│   │   │   ├── Resume/          # ResumeUploader, ATSScore
│   │   │   ├── Chatbot/         # ChatWindow, MessageBubble
│   │   │   ├── Interview/       # MockInterview, QuestionCard
│   │   │   ├── Internship/      # InternshipList, RecommendCard
│   │   │   ├── Admin/           # UserManagement, Analytics
│   │   │   └── Common/          # Navbar, Sidebar, DarkModeToggle
│   │   ├── pages/               # Route-level page components
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── hooks/               # useAuth, useTheme custom hooks
│   │   ├── utils/               # api.js (axios), helpers.js
│   │   └── assets/css/          # Global styles
│   ├── package.json
│   └── .env
│
├── backend/                     # Python Flask backend
│   ├── app.py                   # Flask entry point
│   ├── config.py                # Configuration
│   ├── routes/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── resume.py            # /api/resume/*
│   │   ├── chatbot.py           # /api/chatbot/*
│   │   ├── interview.py         # /api/interview/*
│   │   ├── internship.py        # /api/internship/*
│   │   ├── skills.py            # /api/skills/*
│   │   └── admin.py             # /api/admin/*
│   ├── models/
│   │   ├── user.py
│   │   ├── resume.py
│   │   └── internship.py
│   ├── services/
│   │   ├── ai_service.py        # Gemini API wrapper
│   │   ├── resume_parser.py     # PDF text extraction + analysis
│   │   ├── ats_scorer.py        # ATS scoring logic
│   │   └── email_service.py     # Password reset emails
│   ├── ml/
│   │   ├── skill_gap.py         # Scikit-learn skill analysis
│   │   └── internship_recommender.py
│   ├── utils/
│   │   └── jwt_utils.py
│   ├── requirements.txt
│   └── .env
│
├── docs/
│   ├── API_DOCS.md
│   ├── DB_SCHEMA.md
│   └── DEPLOYMENT.md
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React.js, HTML5, CSS3, JavaScript   |
| Backend      | Python Flask, REST API              |
| Database     | MySQL                               |
| AI/ML        | Google Gemini API, Scikit-learn     |
| Auth         | JWT (JSON Web Tokens)               |
| Resume Parse | PyMuPDF (fitz), pdfplumber          |
| Deployment   | Vercel (frontend), Render (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+
- MySQL 8.0+
- Gemini API key (free at https://makersuite.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/ai-career-companion.git
cd ai-career-companion
```

### 2. Setup Database
```bash
mysql -u root -p < docs/schema.sql
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your keys
python app.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env       # Set REACT_APP_API_URL
npm start
```

---

## 🔐 Environment Variables

### Backend `.env`
```
FLASK_ENV=development
SECRET_KEY=your_super_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_career_companion
GEMINI_API_KEY=your_gemini_api_key
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📋 Features

| Module               | Features                                               |
|----------------------|--------------------------------------------------------|
| 🔐 Authentication    | Signup, Login, JWT, Forgot Password, Dark Mode         |
| 📊 Dashboard         | Profile, Skills, Analytics Cards, Progress Tracker     |
| 📄 Resume Analyzer   | PDF Upload, ATS Score, Skills Extraction, Gaps         |
| 🤖 AI Chatbot        | Career Guidance, Roadmaps, 24/7 AI Support             |
| 💼 Internships       | Skill-Based Matching, Course Recommendations           |
| 🎤 Mock Interview    | Technical + HR Questions, AI Feedback, Score           |
| 📈 Skill Gap         | Industry Comparison, Improvement Plan                  |
| 👑 Admin Panel       | User Management, Analytics, Platform Monitoring        |

---

## 🏆 Project Highlights (For Interviews)

1. **AI Integration**: Used Google Gemini API for natural language career guidance and dynamic interview question generation
2. **ML Pipeline**: Scikit-learn TF-IDF + cosine similarity for internship recommendations
3. **Resume Intelligence**: Custom ATS scoring algorithm comparing resume keywords against job description keywords
4. **JWT Security**: Stateless authentication with access + refresh token pattern
5. **Responsive UI**: Dark mode + mobile-first design

---

## 🚢 Deployment

| Service  | Platform  | Free Tier |
|----------|-----------|-----------|
| Frontend | Vercel    | ✅ Yes    |
| Backend  | Render    | ✅ Yes    |
| Database | PlanetScale / FreeSQLDatabase | ✅ Yes |

See `docs/DEPLOYMENT.md` for full deployment guide.

---

## 👨‍💻 Developer

Built as a Final Year Engineering Major Project  
**Stack**: MERN-adjacent (React + Flask + MySQL) + AI/ML  
**Purpose**: Help students navigate career decisions with AI assistance

---

## 📄 License

MIT License — Free to use for educational purposes
