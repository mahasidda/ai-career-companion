-- ============================================================
-- AI CAREER COMPANION - COMPLETE DATABASE SCHEMA
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_career_companion;
USE ai_career_companion;

-- ============================================================
-- TABLE 1: users
-- ============================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('student', 'admin') DEFAULT 'student',
    branch          VARCHAR(100),
    college         VARCHAR(200),
    graduation_year YEAR,
    profile_photo   VARCHAR(500),
    bio             TEXT,
    linkedin_url    VARCHAR(300),
    github_url      VARCHAR(300),
    is_active       BOOLEAN DEFAULT TRUE,
    reset_token     VARCHAR(255),
    reset_expiry    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: skills
-- ============================================================
CREATE TABLE skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    skill_name  VARCHAR(100) NOT NULL,
    level       ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    category    VARCHAR(50),         -- e.g., 'programming', 'soft_skill', 'framework'
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 3: resumes
-- ============================================================
CREATE TABLE resumes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    file_name           VARCHAR(255),
    file_path           VARCHAR(500),
    raw_text            LONGTEXT,
    extracted_skills    JSON,          -- ["Python", "React", "MySQL"]
    ats_score           DECIMAL(5,2),
    missing_skills      JSON,
    analysis_summary    TEXT,
    uploaded_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 4: internships
-- ============================================================
CREATE TABLE internships (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    company         VARCHAR(200) NOT NULL,
    location        VARCHAR(100),
    type            ENUM('remote', 'onsite', 'hybrid') DEFAULT 'remote',
    duration        VARCHAR(50),           -- e.g., "2 months"
    stipend         VARCHAR(50),           -- e.g., "₹10,000/month"
    required_skills JSON NOT NULL,         -- ["Python", "Flask"]
    description     TEXT,
    apply_link      VARCHAR(500),
    domain          VARCHAR(100),          -- e.g., "Web Dev", "Data Science"
    is_active       BOOLEAN DEFAULT TRUE,
    posted_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 5: internship_applications
-- ============================================================
CREATE TABLE internship_applications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    internship_id   INT NOT NULL,
    status          ENUM('saved', 'applied', 'interview', 'rejected', 'selected') DEFAULT 'saved',
    match_score     DECIMAL(5,2),
    applied_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (user_id, internship_id)
);

-- ============================================================
-- TABLE 6: mock_interviews
-- ============================================================
CREATE TABLE mock_interviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    interview_type  ENUM('technical', 'hr', 'mixed') NOT NULL,
    domain          VARCHAR(100),          -- e.g., "Python", "DSA", "System Design"
    total_score     DECIMAL(5,2),
    total_questions INT DEFAULT 0,
    correct_count   INT DEFAULT 0,
    duration_secs   INT,
    feedback        TEXT,
    completed       BOOLEAN DEFAULT FALSE,
    started_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 7: interview_questions
-- ============================================================
CREATE TABLE interview_questions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    interview_id    INT NOT NULL,
    question_text   TEXT NOT NULL,
    question_type   ENUM('technical', 'hr', 'behavioral') DEFAULT 'technical',
    difficulty      ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    user_answer     TEXT,
    ai_feedback     TEXT,
    score           DECIMAL(5,2),
    answered_at     DATETIME,
    FOREIGN KEY (interview_id) REFERENCES mock_interviews(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 8: chat_sessions
-- ============================================================
CREATE TABLE chat_sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(200) DEFAULT 'New Chat',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 9: chat_messages
-- ============================================================
CREATE TABLE chat_messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    session_id  INT NOT NULL,
    role        ENUM('user', 'assistant') NOT NULL,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 10: skill_gap_reports
-- ============================================================
CREATE TABLE skill_gap_reports (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    target_role         VARCHAR(150),        -- e.g., "Full Stack Developer"
    user_skills         JSON,
    required_skills     JSON,
    missing_skills      JSON,
    gap_percentage      DECIMAL(5,2),
    roadmap             TEXT,
    generated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: learning_resources
-- ============================================================
CREATE TABLE learning_resources (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    skill_name  VARCHAR(100) NOT NULL,
    title       VARCHAR(200),
    platform    VARCHAR(100),   -- e.g., "Coursera", "YouTube", "GeeksforGeeks"
    url         VARCHAR(500),
    resource_type ENUM('video', 'article', 'course', 'book') DEFAULT 'course',
    is_free     BOOLEAN DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 12: user_progress
-- ============================================================
CREATE TABLE user_progress (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    resumes_uploaded    INT DEFAULT 0,
    interviews_taken    INT DEFAULT 0,
    avg_interview_score DECIMAL(5,2),
    skills_count        INT DEFAULT 0,
    last_activity       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_progress (user_id)
);

-- ============================================================
-- SEED DATA: Sample internships
-- ============================================================
INSERT INTO internships (title, company, location, type, duration, stipend, required_skills, description, domain) VALUES
('Frontend Developer Intern', 'TechCorp India', 'Bangalore', 'remote', '3 months', '₹15,000/month', '["React", "JavaScript", "CSS", "HTML"]', 'Work on building responsive web UIs with React.js', 'Web Development'),
('Data Science Intern', 'Analytics Hub', 'Hyderabad', 'hybrid', '6 months', '₹20,000/month', '["Python", "Pandas", "Machine Learning", "SQL"]', 'Analyze large datasets and build ML models', 'Data Science'),
('Backend Developer Intern', 'StartupXYZ', 'Remote', 'remote', '2 months', '₹12,000/month', '["Python", "Flask", "MySQL", "REST API"]', 'Build and maintain RESTful APIs using Flask', 'Backend'),
('Android Developer Intern', 'AppWorks', 'Mumbai', 'onsite', '3 months', '₹18,000/month', '["Java", "Android", "Kotlin", "Firebase"]', 'Develop features for consumer Android application', 'Mobile'),
('DevOps Intern', 'CloudSystems', 'Chennai', 'remote', '4 months', '₹22,000/month', '["Docker", "AWS", "Linux", "CI/CD", "Python"]', 'Manage cloud infrastructure and deployment pipelines', 'DevOps'),
('Full Stack Developer Intern', 'WebGenius', 'Pune', 'hybrid', '3 months', '₹16,000/month', '["React", "Node.js", "MongoDB", "Express"]', 'Build full stack features end to end', 'Web Development'),
('ML Engineer Intern', 'AI Ventures', 'Bangalore', 'remote', '6 months', '₹25,000/month', '["Python", "TensorFlow", "Deep Learning", "NLP"]', 'Develop and deploy ML models in production', 'AI/ML'),
('Cybersecurity Intern', 'SecureNet', 'Delhi', 'onsite', '3 months', '₹18,000/month', '["Linux", "Networking", "Python", "Ethical Hacking"]', 'Vulnerability assessment and security testing', 'Security');

-- SEED DATA: Sample learning resources
INSERT INTO learning_resources (skill_name, title, platform, url, resource_type, is_free) VALUES
('Python', 'Python for Beginners - Full Course', 'YouTube', 'https://youtube.com/python-beginner', 'video', TRUE),
('React', 'React - The Complete Guide', 'Udemy', 'https://udemy.com/react-complete', 'course', FALSE),
('Machine Learning', 'Machine Learning by Andrew Ng', 'Coursera', 'https://coursera.org/ml-andrew-ng', 'course', TRUE),
('DSA', 'Data Structures and Algorithms', 'GeeksforGeeks', 'https://geeksforgeeks.org/dsa', 'article', TRUE),
('SQL', 'SQL Tutorial for Beginners', 'W3Schools', 'https://w3schools.com/sql', 'article', TRUE),
('Flask', 'Flask Web Development', 'Official Docs', 'https://flask.palletsprojects.com', 'article', TRUE),
('Docker', 'Docker for Beginners', 'YouTube', 'https://youtube.com/docker-beginners', 'video', TRUE),
('System Design', 'System Design Primer', 'GitHub', 'https://github.com/donnemartin/system-design-primer', 'article', TRUE);
