# 🗺️ Development Roadmap & Interview Preparation Guide

## Step-by-Step Development Roadmap

### Week 1: Setup & Auth
- [ ] Install Node.js, Python, MySQL
- [ ] Run `docs/schema.sql` to create database
- [ ] Set up Flask backend (`backend/`)
- [ ] Implement JWT signup/login (`routes/auth.py`)
- [ ] Build React frontend skeleton with routing
- [ ] Create Login and Signup pages
- [ ] Test auth flow end-to-end

### Week 2: Resume Analyzer
- [ ] Install `pdfplumber` or `PyMuPDF`
- [ ] Implement PDF text extraction (`services/resume_parser.py`)
- [ ] Build ATS scoring algorithm (`services/ats_scorer.py`)
- [ ] Create `/api/resume/upload` endpoint
- [ ] Build drag-and-drop upload UI
- [ ] Display ATS score with breakdown chart

### Week 3: AI Chatbot
- [ ] Get free Gemini API key
- [ ] Implement `services/ai_service.py`
- [ ] Build `/api/chatbot/message` route
- [ ] Create chat UI with message bubbles
- [ ] Add chat session history
- [ ] Test with career-related queries

### Week 4: Mock Interview
- [ ] Implement question generation via Gemini
- [ ] Build answer evaluation system
- [ ] Create interview session management
- [ ] Build interview UI with timer
- [ ] Show score and feedback at end

### Week 5: Internship + Skill Gap
- [ ] Implement TF-IDF recommendation algorithm
- [ ] Build skill gap analysis logic
- [ ] Create `/api/internship/` routes
- [ ] Build internship cards UI
- [ ] Add skill gap radar chart

### Week 6: Dashboard + Admin + Polish
- [ ] Build analytics dashboard
- [ ] Create admin panel
- [ ] Add dark mode
- [ ] Make mobile responsive
- [ ] Write README
- [ ] Deploy to Vercel + Render

---

## 🎤 Interview Explanation

### "Tell me about your project"

> **AI Career Companion** is a full-stack web application I built as my major project to help engineering students navigate their career journey using Artificial Intelligence.

> The platform has 8 main modules:
> 1. **Resume Analyzer** — Students upload their PDF resume. Our backend uses PyMuPDF to extract text, then a custom ATS scoring algorithm using TF-IDF and keyword matching gives a score out of 100 with specific improvement tips.
> 2. **AI Career Chatbot** — Powered by Google Gemini API. Students can ask any career question and get personalized guidance based on their profile and skills.
> 3. **Mock Interview** — The system generates role-specific questions using Gemini, evaluates answers with AI, gives a score and feedback. Questions get progressively harder.
> 4. **Internship Recommender** — Uses scikit-learn's TF-IDF vectorizer and cosine similarity to match the student's skills against internship requirements, returning a match percentage.
> 5. **Skill Gap Analysis** — Compares the student's skills against industry-standard requirements for their target role, then generates a 3-month personalized learning roadmap.

---

### Technical Questions & Answers

**Q: How does the ATS scoring work?**
> A: The ATS score is computed across 5 dimensions: keyword match (40%), section completeness (20%), TF-IDF similarity with job description (20%), format quality (10%), and action verbs/metrics (10%). TF-IDF converts resume and JD into vectors and we compute cosine similarity. Total is out of 100 with grades from "Needs Work" to "Excellent".

**Q: How does JWT authentication work?**
> A: On login, the Flask backend generates two tokens using `flask-jwt-extended`: an access token (expires in 1 hour) and a refresh token (expires in 30 days). The frontend stores these in localStorage and attaches the access token as a Bearer header. When the access token expires, the Axios response interceptor automatically calls the `/auth/refresh` endpoint using the refresh token to get a new access token — transparent to the user.

**Q: How does the internship recommendation algorithm work?**
> A: We use a two-stage approach. First, exact keyword matching — we count how many of the user's skills appear in the internship's required skills list. Second, TF-IDF cosine similarity — we convert both skill lists to TF-IDF vectors and compute the angle between them. The final match score is a weighted combination: 70% exact match + 30% TF-IDF similarity. Results are sorted by score and the top 8 are shown.

**Q: How did you handle CORS and security?**
> A: Flask-CORS is configured to allow requests only from the frontend domain. JWT tokens are verified on every protected route using `@jwt_required()` decorator. Passwords are hashed with `pbkdf2:sha256` using Werkzeug. Password reset tokens are hashed with SHA-256 before storing and expire in 1 hour.

**Q: What is the tech stack and why did you choose it?**
> A: React.js for the frontend because of its component reusability and rich ecosystem (recharts for visualization, react-dropzone for file upload). Flask for backend because Python is ideal for AI/ML integrations and Flask is lightweight and flexible. MySQL because it's reliable, widely used, and we have structured relational data. Google Gemini API because it's free tier is very generous (60 req/min) and the model quality is excellent for conversational AI. Scikit-learn for ML because it's the industry standard for traditional ML algorithms.

**Q: What challenges did you face?**
> A: The main challenges were:
> 1. **Resume text extraction** — PDFs have inconsistent formatting. We handled this by trying PyMuPDF first and falling back to pdfplumber, and we normalize the text before skill extraction.
> 2. **AI response consistency** — Gemini sometimes returns malformed JSON for structured outputs. We added robust try-catch with fallback responses.
> 3. **Internship matching accuracy** — Pure keyword matching missed synonyms (e.g., "Node.js" vs "NodeJS"). Adding TF-IDF similarity improved accuracy significantly.

---

## 📝 Resume Project Description

```
AI Career Companion | Final Year Major Project | React.js • Flask • MySQL • Gemini API

• Built a full-stack AI-powered career guidance platform for engineering students with 8 
  integrated modules: resume analysis, career chatbot, mock interviews, and internship matching

• Implemented custom ATS scoring algorithm using TF-IDF vectorization and cosine similarity 
  (scikit-learn) for 5-dimensional resume evaluation with skill gap detection

• Integrated Google Gemini API for personalized career guidance chatbot and dynamic 
  interview question generation with real-time AI evaluation and scoring

• Designed ML-based internship recommendation system using TF-IDF + cosine similarity 
  achieving 70%+ accuracy in skill-role matching

• Built stateless JWT authentication with access/refresh token rotation and secure 
  password reset flow via email

• Deployed on Vercel (frontend) + Render (backend) with MySQL Atlas; implemented 
  dark mode, mobile-responsive design, and real-time progress tracking
```

---

## 🏆 Hackathon Pitch (2 minutes)

> "Engineering students in India spend months applying to internships and jobs without knowing why they're getting rejected. Our platform, AI Career Companion, solves this with AI.
> 
> A student uploads their resume — our ATS engine gives them a score out of 100, tells them exactly which skills are missing, and suggests how to fix it. They can then chat with our AI advisor for a personalized career roadmap. Before interviews, they practice with our AI mock interview system that generates real technical questions and gives instant feedback. And when they're ready to apply, our recommendation engine matches them with internships based on their skill profile.
> 
> Built with React, Flask, MySQL, and Google Gemini. Deployed and live. Thank you."
