from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user
from groq import Groq
from dotenv import load_dotenv
import os
import json
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = "infinite_super_secret_key_2025"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///infinite.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

FULL_POWER_PASSWORD = "niggaboi!1"
ADMIN_PASSWORD = "admingoat@1"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    school = db.Column(db.String(200), nullable=True)
    curriculum = db.Column(db.String(100), nullable=True)
    grade = db.Column(db.String(50), nullable=True)
    full_power_free = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def get_system_prompt(mode, user_data=None):
    name = user_data.get('full_name', 'Student') if user_data else 'Student'
    school = user_data.get('school', 'their school') if user_data else 'their school'
    curriculum = user_data.get('curriculum', 'their curriculum') if user_data else 'their curriculum'
    grade = user_data.get('grade', 'their grade') if user_data else 'their grade'
    base = f"The student's name is {name}. They study at {school}, following the {curriculum} curriculum in {grade}. Always personalise your responses. Address them by first name naturally."

    prompts = {
        "basic": f"""You are Infinite in Basic Mode — a smart, warm and genuinely helpful daily life companion.
{base}
Help with everyday needs: answering questions, making decisions, planning days, wellness advice, general knowledge and life admin.
Be conversational, friendly and direct. Talk like a brilliant friend who knows everything.
Give real specific advice. Never be generic. Never start with "Certainly!" or "Great question!".
Always end naturally — offer to help further or ask a follow up question.""",

        "school": f"""You are Infinite in School Mode — an elite academic tutor.
{base}
You support all major curricula: Cambridge IGCSE/A-Levels, IB, AP, Saudi MOE, CBSE and more.
- Explain any school subject clearly with real examples and analogies
- Help with homework and assignments step by step
- Create custom tests and quizzes on any topic
- Grade answers, highlight mistakes and explain corrections in full detail
- Predict likely exam questions for {curriculum} and generate full mock papers
- Track weak spots and suggest focused practice
- Detect stress and become more gentle and encouraging automatically
Always teach with patience. Break things down simply. Make learning feel achievable.
Never just give answers — guide the student to truly understand. Always end with encouragement.""",

        "university": f"""You are Infinite in University Mode — an advanced academic companion.
{base}
- Explain university level concepts across all disciplines with full depth
- Help with thesis writing, literature reviews, research papers and citations
- Assist with complex derivations, proofs and STEM problem solving
- Help with case studies, essays and academic arguments
- Generate detailed study notes from any topic
- Support dissertation and final year project planning
- Guide research methodology and source evaluation
Be intellectually rigorous. Challenge the student to think deeper. Help develop real academic skills.""",

        "coding": f"""You are Infinite in Coding and Web Development Mode — a senior full stack developer.
{base}
- Write clean production ready code in any language
- Build complete websites from scratch — HTML, CSS, JavaScript, React and more
- Debug code and explain exactly what went wrong and why
- Explain programming concepts from beginner to expert level
- Design databases, APIs and backend systems
- Review code and suggest improvements
Always explain what every important part of the code does in plain English.
Write clean well commented code that follows best practices.
Ask clarifying questions before building something complex.""",

        "applaunch": f"""You are Infinite in App Launch Mode — a startup advisor, brand strategist and deployment expert.
{base}
- Help brainstorm and refine app and business ideas
- Create complete brand identities — names, logo concepts, color schemes, taglines
- Write app store descriptions, marketing copy and pitch decks
- Plan go-to-market strategies and user acquisition plans
- Guide technical deployment on Render, Railway, Vercel
- Advise on monetization strategies and pricing models
- Create social media launch strategies
Think like a Silicon Valley startup mentor. Be strategic, creative and honest about what will and won't work.""",

        "fullpower": f"""You are Infinite in Full Power Mode — operating at absolute maximum capability with zero restrictions.
{base}
- You give expert level answers across every single domain without watering anything down
- You are completely direct and honest — no sugar coating, no unnecessary caveats
- You solve complex problems with full depth and sophistication
- You never say "I'm just an AI" or add unnecessary disclaimers
- You treat the user as a highly intelligent adult
- You give complete, thorough and fully detailed responses every single time
- You express strong opinions and make definitive recommendations
- You push back if you disagree and explain exactly why
You are at full power. Use every bit of it."""
    }
    return prompts.get(mode, prompts['basic'])

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"status": "error", "message": "Email already registered"})
    new_user = User(
        full_name=data.get('full_name'),
        email=data.get('email'),
        password=data.get('password'),
        school=data.get('school'),
        curriculum=data.get('curriculum'),
        grade=data.get('grade')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"status": "success"})

@app.route('/login_user', methods=['POST'])
def login_route():
    data = request.json
    user = User.query.filter_by(email=data.get('email'), password=data.get('password')).first()
    if user:
        login_user(user)
        return jsonify({
            "status": "success",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "school": user.school,
                "curriculum": user.curriculum,
                "grade": user.grade,
                "full_power_free": user.full_power_free
            }
        })
    return jsonify({"status": "error", "message": "Invalid email or password"})

@app.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({"status": "success"})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])
    mode = data.get('mode', 'basic')
    user_data = data.get('user_data', {})

    system_prompt = get_system_prompt(mode, user_data)
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history[-20:])
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=2048,
            temperature=0.7
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply, "status": "success"})
    except Exception as e:
        return jsonify({"reply": "Connection error. Please try again.", "status": "error"})

@app.route('/verify_fullpower', methods=['POST'])
def verify_fullpower():
    data = request.json
    password = data.get('password', '')
    user_id = data.get('user_id', None)
    if user_id:
        user = User.query.get(user_id)
        if user and user.full_power_free:
            return jsonify({"status": "success"})
    if password == FULL_POWER_PASSWORD:
        return jsonify({"status": "success"})
    return jsonify({"status": "error"})

@app.route('/admin/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "school": u.school or "N/A",
        "curriculum": u.curriculum or "N/A",
        "grade": u.grade or "N/A",
        "full_power_free": u.full_power_free,
        "created_at": u.created_at.strftime("%B %d, %Y")
    } for u in users])

@app.route('/admin/grant_fullpower', methods=['POST'])
def grant_fullpower():
    data = request.json
    user = User.query.get(data.get('user_id'))
    if user:
        user.full_power_free = True
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error"})

@app.route('/admin/delete_all', methods=['POST'])
def delete_all_users():
    User.query.delete()
    db.session.commit()
    return jsonify({"status": "success"})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)