# ============================================================
# AI CAREER COMPANION - Flask Backend Entry Point
# ============================================================

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

from config import Config
from routes.auth import auth_bp
from routes.resume import resume_bp
from routes.chatbot import chatbot_bp
from routes.interview import interview_bp
from routes.internship import internship_bp
from routes.skills import skills_bp
from routes.admin import admin_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    # Register blueprints (routes)
    app.register_blueprint(auth_bp,        url_prefix='/api/auth')
    app.register_blueprint(resume_bp,      url_prefix='/api/resume')
    app.register_blueprint(chatbot_bp,     url_prefix='/api/chatbot')
    app.register_blueprint(interview_bp,   url_prefix='/api/interview')
    app.register_blueprint(internship_bp,  url_prefix='/api/internship')
    app.register_blueprint(skills_bp,      url_prefix='/api/skills')
    app.register_blueprint(admin_bp,       url_prefix='/api/admin')

    @app.route('/')
    def index():
        return {"message": "AI Career Companion API", "version": "1.0.0", "status": "running"}

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Route not found"}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get("FLASK_ENV") == "development")