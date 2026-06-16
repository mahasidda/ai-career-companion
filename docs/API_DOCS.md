# 📡 API Documentation — AI Career Companion

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <access_token>`

---

## 🔐 Auth  `/api/auth`

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/signup`          | ❌   | Register new user        |
| POST   | `/login`           | ❌   | Login, get JWT tokens    |
| GET    | `/profile`         | ✅   | Get current user profile |
| PUT    | `/profile`         | ✅   | Update profile           |
| POST   | `/forgot-password` | ❌   | Send reset email         |
| POST   | `/reset-password`  | ❌   | Reset with token         |
| POST   | `/refresh`         | 🔄   | Refresh access token     |

### POST /signup
```json
{
  "full_name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "secret123",
  "branch": "Computer Science",
  "college": "JNTU Hyderabad",
  "graduation_year": 2025
}
```
Response: `{ user, access_token, refresh_token }`

### POST /login
```json
{ "email": "arjun@example.com", "password": "secret123" }
```
Response: `{ user, access_token, refresh_token }`

---

## 📄 Resume  `/api/resume`

| Method | Endpoint             | Auth | Description              |
|--------|----------------------|------|--------------------------|
| POST   | `/upload`            | ✅   | Upload PDF resume        |
| GET    | `/history`           | ✅   | List uploaded resumes    |
| GET    | `/<id>`              | ✅   | Get single resume        |
| POST   | `/<id>/improve`      | ✅   | AI improvement tips      |

### POST /upload (multipart/form-data)
```
resume: <PDF file>
target_role: "full stack developer"
job_description: "Optional JD text..."
```
Response:
```json
{
  "resume_id": 1,
  "extracted_skills": ["Python", "React", "SQL"],
  "ats_score": {
    "total_score": 72,
    "grade": "Good",
    "breakdown": { ... },
    "missing_keywords": ["Docker", "TypeScript"],
    "suggestions": ["Add more action verbs..."]
  }
}
```

---

## 🤖 Chatbot  `/api/chatbot`

| Method | Endpoint               | Auth | Description          |
|--------|------------------------|------|----------------------|
| POST   | `/message`             | ✅   | Send message         |
| GET    | `/sessions`            | ✅   | List chat sessions   |
| GET    | `/sessions/<id>`       | ✅   | Get session messages |
| DELETE | `/sessions/<id>`       | ✅   | Delete session       |

### POST /message
```json
{
  "message": "How do I prepare for DSA interviews?",
  "session_id": 5
}
```
Response: `{ session_id, response: "AI response text..." }`

---

## 🎤 Interview  `/api/interview`

| Method | Endpoint                | Auth | Description            |
|--------|-------------------------|------|------------------------|
| POST   | `/start`                | ✅   | Start new interview    |
| POST   | `/<id>/answer`          | ✅   | Submit answer          |
| GET    | `/<id>/results`         | ✅   | Get full results       |
| GET    | `/history`              | ✅   | Interview history      |

### POST /start
```json
{
  "domain": "Python",
  "interview_type": "technical",
  "num_questions": 5
}
```
Response: `{ interview_id, domain, total, question: { id, question, hints, difficulty } }`

### POST /<id>/answer
```json
{
  "question_id": 12,
  "answer": "Python uses GIL which prevents true multi-threading..."
}
```
Response: `{ evaluation, next_question | completed, final_score }`

---

## 💼 Internship  `/api/internship`

| Method | Endpoint              | Auth | Description                |
|--------|-----------------------|------|----------------------------|
| GET    | `/recommend`          | ✅   | AI-matched recommendations |
| GET    | `/`                   | ✅   | All internships            |
| POST   | `/<id>/save`          | ✅   | Save/apply to internship   |
| GET    | `/my-applications`    | ✅   | User's applications        |
| POST   | `/skill-gap`          | ✅   | Skill gap analysis         |

### POST /skill-gap
```json
{ "target_role": "full stack developer" }
```
Response:
```json
{
  "readiness_score": 68.5,
  "gap_percentage": 31.5,
  "have_essential": ["React", "JavaScript", "HTML"],
  "missing_essential": ["Docker", "SQL", "REST API"],
  "roadmap": "**Month 1: Foundation**\n- Week 1-2: Learn SQL..."
}
```

---

## ⚡ Skills  `/api/skills`

| Method | Endpoint       | Auth | Description       |
|--------|----------------|------|-------------------|
| GET    | `/`            | ✅   | Get all skills    |
| POST   | `/`            | ✅   | Add skill         |
| PUT    | `/<id>`        | ✅   | Update skill level|
| DELETE | `/<id>`        | ✅   | Delete skill      |

---

## 👑 Admin  `/api/admin`  (Admin role required)

| Method | Endpoint              | Auth  | Description         |
|--------|-----------------------|-------|---------------------|
| GET    | `/dashboard`          | Admin | Platform analytics  |
| GET    | `/users`              | Admin | List all users      |
| PUT    | `/users/<id>/toggle`  | Admin | Enable/disable user |
| POST   | `/internships`        | Admin | Add internship      |
| DELETE | `/internships/<id>`   | Admin | Remove internship   |

---

## Error Responses

All errors return:
```json
{ "error": "Human readable error message" }
```

Common status codes:
- `400` Bad Request (validation error)
- `401` Unauthorized (no/invalid token)
- `403` Forbidden (wrong role)
- `404` Not Found
- `409` Conflict (email already exists)
- `500` Server Error
