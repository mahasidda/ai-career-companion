import os
import json
import requests
import time

OPENROUTER_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FREE_MODELS = [
    "openai/gpt-oss-20b:free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
]
def call_gemini(prompt: str, system_context: str = None, temperature: float = 0.7) -> str:
    if not OPENROUTER_KEY:
        return "AI service not configured. Please add API key to .env file."

    messages = []
    if system_context:
        messages.append({"role": "system", "content": system_context})
    messages.append({"role": "user", "content": prompt})

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Career Companion"
    }

    for model in FREE_MODELS:
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 1024
            }
            response = requests.post(
                OPENROUTER_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            if response.status_code == 429:
                time.sleep(2)
                continue
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                if content and len(content) > 5:
                    return content
        except requests.exceptions.Timeout:
            continue
        except Exception as e:
            continue

    return "AI models are busy. Please wait 1 minute and try again."


def get_career_advice(user_message: str, chat_history: list = None, user_profile: dict = None) -> str:
    system_context = """You are an expert AI Career Advisor for engineering students in India.
You help students with:
- Career path selection (Software Dev, Data Science, DevOps, etc.)
- Skill development roadmaps
- Interview preparation tips
- Resume improvement advice
- Industry insights and trends
- Coding challenge recommendations

Be friendly, specific, encouraging, and practical. Use bullet points for lists.
Keep responses focused and under 300 words. Reference Indian tech industry context when relevant."""

    if user_profile:
        system_context += f"\n\nStudent Profile: {json.dumps(user_profile)}"

    if chat_history:
        history_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in chat_history[-6:]])
        full_prompt = f"Recent conversation:\n{history_text}\n\nStudent: {user_message}"
    else:
        full_prompt = user_message

    return call_gemini(full_prompt, system_context, temperature=0.7)


def generate_interview_question(domain: str, difficulty: str = "medium", q_type: str = "technical") -> dict:
    prompt = f"""Generate one {difficulty} {q_type} interview question for a {domain} engineering role.

Return ONLY valid JSON in this exact format:
{{
  "question": "The interview question here",
  "hints": ["Hint 1", "Hint 2"],
  "ideal_answer_points": ["Key point 1", "Key point 2", "Key point 3"],
  "difficulty": "{difficulty}",
  "type": "{q_type}"
}}

Do NOT add any text outside the JSON."""

    try:
        response = call_gemini(prompt, temperature=0.8)
        response = response.strip()
        if response.startswith('```json'):
            response = response[7:]
        if response.startswith('```'):
            response = response[3:]
        if response.endswith('```'):
            response = response[:-3]
        return json.loads(response.strip())
    except Exception:
        return {
            "question": f"Explain the core concepts of {domain} and a challenging problem you solved.",
            "hints": ["Think about your projects", "Mention specific technologies"],
            "ideal_answer_points": ["Clear explanation", "Real example", "Technical depth"],
            "difficulty": difficulty,
            "type": q_type
        }


def evaluate_interview_answer(question: str, user_answer: str, domain: str) -> dict:
    prompt = f"""You are an interviewer evaluating a candidate's answer.

Domain: {domain}
Question: {question}
Candidate's Answer: {user_answer}

Return ONLY valid JSON:
{{
  "score": <integer 0-10>,
  "feedback": "Detailed feedback here (2-3 sentences)",
  "strengths": ["What they did well"],
  "improvements": ["What could be better"],
  "model_answer_hint": "Brief hint about ideal answer"
}}"""

    try:
        response = call_gemini(prompt, temperature=0.3)
        response = response.strip().lstrip('```json').lstrip('```').rstrip('```')
        return json.loads(response.strip())
    except Exception:
        word_count = len(user_answer.split()) if user_answer else 0
        fallback_score = min(7, max(2, word_count // 10))
        return {
            "score": fallback_score,
            "feedback": "Answer received. Try to be more detailed with examples.",
            "strengths": ["Attempted the question"],
            "improvements": ["Add more technical details", "Include examples"],
            "model_answer_hint": "Focus on core concepts and real-world applications"
        }


def generate_learning_roadmap(current_skills: list, target_role: str, missing_skills: list) -> str:
    prompt = f"""Create a 3-month learning roadmap for an engineering student.

Target Role: {target_role}
Current Skills: {', '.join(current_skills[:15])}
Skills to Learn: {', '.join(missing_skills[:10])}

Format as:
**Month 1: Foundation**
- Week 1-2: [Specific topic + free resource]
- Week 3-4: [Specific topic + free resource]

**Month 2: Building**
- Week 1-2: [topic + resource]
- Week 3-4: [topic + resource]

**Month 3: Advanced + Projects**
- Week 1-2: [topic + resource]
- Week 3-4: [Build a project using all skills]

Be specific and practical with free resources only."""

    return call_gemini(prompt, temperature=0.6)


def suggest_resume_improvements(resume_text: str, target_role: str, missing_skills: list) -> str:
    prompt = f"""Analyze this resume for a {target_role} position and provide specific improvement suggestions.

Resume Text (first 1000 chars): {resume_text[:1000]}
Missing Skills: {', '.join(missing_skills[:8])}

Provide:
1. Top 3 content improvements
2. How to highlight existing skills better
3. Project suggestions to add these missing skills
4. One-line summary/objective statement suggestion

Be specific and actionable."""

    return call_gemini(prompt, temperature=0.5)

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
}}

Do NOT add any text outside the JSON."""
    try:
        response = call_gemini(prompt, temperature=0.8)
        response = response.strip().lstrip('```json').lstrip('```').rstrip('```')
        return json.loads(response.strip())
    except:
        return {
            "question": f"As a {role}, how would you approach building a scalable system? Explain with examples.",
            "hints": ["Think about architecture", "Consider performance and reliability"],
            "ideal_answer_points": ["Clear architecture explanation", "Scalability considerations", "Real examples"],
            "difficulty": difficulty,
            "type": q_type
        }


def generate_resume_based_question(resume_text: str, q_type: str = 'technical', difficulty: str = 'medium') -> dict:
    prompt = f"""You are an interviewer. Based on this resume, generate one specific {difficulty} interview question.
Ask about a specific project, skill, or experience mentioned in the resume.

Resume (first 800 chars): {resume_text[:800]}

Return ONLY valid JSON:
{{
  "question": "Specific question based on their resume experience",
  "hints": ["Hint related to their background"],
  "ideal_answer_points": ["Key point 1", "Key point 2", "Key point 3"],
  "difficulty": "{difficulty}",
  "type": "{q_type}"
}}

Do NOT add any text outside the JSON."""
    try:
        response = call_gemini(prompt, temperature=0.8)
        response = response.strip().lstrip('```json').lstrip('```').rstrip('```')
        return json.loads(response.strip())
    except:
        return {
            "question": "Tell me about your most challenging project and how you overcame the technical difficulties.",
            "hints": ["Focus on a specific project", "Mention technologies used", "Explain the problem and solution"],
            "ideal_answer_points": ["Problem description", "Your approach", "Technologies used", "Results achieved"],
            "difficulty": difficulty,
            "type": q_type
        }