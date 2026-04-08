"""
================================================
ResumeIQ - Flask Backend  (PRODUCTION VERSION)
================================================
Deployed on Render.com
Frontend is served by Flask itself (no separate server needed)
================================================
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re

# ── Optional: PyPDF2 ──
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

# ── Optional: python-docx ──
try:
    from docx import Document as DocxDocument
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False

# ── OCR is disabled on Render free tier (no Tesseract binary) ──
OCR_SUPPORT = False

# ══════════════════════════════════════════════
#   App Setup
# ══════════════════════════════════════════════

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# Use /tmp for uploads on cloud (writable on Render free tier)
UPLOAD_FOLDER = '/tmp/resumeiq_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ══════════════════════════════════════════════
#   SKILL DATABASE
# ══════════════════════════════════════════════

JOB_SKILLS = {
    "data scientist": [
        "python", "r", "machine learning", "deep learning", "statistics",
        "data analysis", "pandas", "numpy", "scikit-learn", "tensorflow",
        "keras", "matplotlib", "seaborn", "sql", "tableau", "power bi",
        "data visualization", "hypothesis testing", "regression", "classification",
        "clustering", "nlp", "feature engineering", "jupyter"
    ],
    "machine learning engineer": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "mlops", "docker", "kubernetes", "rest api",
        "model deployment", "feature engineering", "nlp", "computer vision",
        "aws", "gcp", "azure", "git", "linux", "data pipelines"
    ],
    "data analyst": [
        "sql", "excel", "python", "tableau", "power bi", "data visualization",
        "statistics", "pandas", "numpy", "reporting", "google analytics",
        "business intelligence", "etl", "data cleaning", "pivot tables",
        "looker", "storytelling"
    ],
    "data engineer": [
        "python", "sql", "spark", "hadoop", "kafka", "etl", "airflow",
        "aws", "gcp", "azure", "docker", "kubernetes", "postgresql",
        "mongodb", "redis", "data pipelines", "linux", "bash", "git"
    ],
    "full stack developer": [
        "html", "css", "javascript", "react", "node.js", "express",
        "mongodb", "sql", "git", "rest api", "typescript", "python",
        "linux", "docker", "aws", "responsive design", "tailwind css",
        "graphql", "next.js", "testing"
    ],
    "frontend developer": [
        "html", "css", "javascript", "react", "typescript", "vue.js",
        "angular", "webpack", "git", "responsive design", "sass",
        "tailwind css", "figma", "testing", "accessibility",
        "next.js", "redux"
    ],
    "backend developer": [
        "python", "java", "node.js", "express", "django", "flask",
        "rest api", "graphql", "sql", "postgresql", "mongodb", "redis",
        "docker", "kubernetes", "aws", "git", "linux", "microservices",
        "authentication", "testing"
    ],
    "devops engineer": [
        "docker", "kubernetes", "jenkins", "ci/cd", "aws", "azure", "gcp",
        "linux", "bash", "python", "terraform", "ansible", "git",
        "monitoring", "prometheus", "grafana", "nginx", "networking",
        "security", "helm"
    ],
    "cloud architect": [
        "aws", "azure", "gcp", "terraform", "kubernetes", "docker",
        "networking", "security", "microservices", "serverless", "iam",
        "storage", "databases", "cdn", "load balancing", "cost optimization",
        "disaster recovery", "linux"
    ],
    "cybersecurity analyst": [
        "network security", "ethical hacking", "penetration testing",
        "linux", "python", "wireshark", "firewalls", "ids/ips",
        "siem", "vulnerability assessment", "soc", "incident response",
        "cryptography", "kali linux", "bash", "compliance", "risk assessment",
        "cloud security"
    ],
    "android developer": [
        "java", "kotlin", "android sdk", "xml", "firebase", "rest api",
        "git", "room database", "retrofit", "mvvm", "jetpack compose",
        "testing", "play store", "notifications", "google maps api"
    ],
    "ios developer": [
        "swift", "objective-c", "xcode", "uikit", "swiftui", "rest api",
        "core data", "firebase", "git", "mvvm", "testing", "app store",
        "notifications", "combine"
    ],
    "ui/ux designer": [
        "figma", "sketch", "adobe xd", "prototyping", "wireframing",
        "user research", "usability testing", "responsive design",
        "design systems", "typography", "color theory", "interaction design",
        "accessibility", "html", "css"
    ],
    "project manager": [
        "agile", "scrum", "kanban", "jira", "risk management",
        "stakeholder management", "communication", "budgeting",
        "project planning", "ms project", "leadership", "reporting",
        "resource allocation", "pmp"
    ],
    "embedded systems engineer": [
        "c", "c++", "microcontrollers", "arduino", "raspberry pi",
        "rtos", "uart", "spi", "i2c", "pcb design", "debugging",
        "arm", "linux", "assembly", "git"
    ],
}

COURSE_RECOMMENDATIONS = {
    "python":              {"course": "Python for Everybody",                     "platform": "Coursera"},
    "machine learning":    {"course": "Machine Learning Specialization",          "platform": "Coursera (Andrew Ng)"},
    "deep learning":       {"course": "Deep Learning Specialization",             "platform": "Coursera"},
    "tensorflow":          {"course": "TensorFlow Developer Certificate",         "platform": "Coursera"},
    "pytorch":             {"course": "PyTorch for Deep Learning Bootcamp",       "platform": "Udemy"},
    "sql":                 {"course": "SQL for Data Science",                     "platform": "Coursera"},
    "docker":              {"course": "Docker Mastery",                           "platform": "Udemy"},
    "kubernetes":          {"course": "Kubernetes for Developers",                "platform": "Linux Foundation"},
    "aws":                 {"course": "AWS Certified Solutions Architect",        "platform": "AWS / Udemy"},
    "azure":               {"course": "AZ-900: Azure Fundamentals",              "platform": "Microsoft Learn"},
    "gcp":                 {"course": "Google Cloud Digital Leader",              "platform": "Google Cloud Skills Boost"},
    "react":               {"course": "React – The Complete Guide",               "platform": "Udemy"},
    "node.js":             {"course": "The Complete Node.js Developer Course",    "platform": "Udemy"},
    "javascript":          {"course": "JavaScript – The Complete Guide",          "platform": "Udemy"},
    "typescript":          {"course": "Understanding TypeScript",                 "platform": "Udemy"},
    "git":                 {"course": "Git & GitHub – The Complete Guide",        "platform": "Udemy"},
    "linux":               {"course": "Linux Command Line Basics",                "platform": "Udacity"},
    "bash":                {"course": "Shell Scripting for Beginners",            "platform": "Udemy"},
    "data analysis":       {"course": "Data Analysis with Python",                "platform": "IBM / Coursera"},
    "tableau":             {"course": "Tableau 2024 A-Z",                         "platform": "Udemy"},
    "power bi":            {"course": "Microsoft Power BI Desktop for Business",  "platform": "Udemy"},
    "statistics":          {"course": "Statistics with Python Specialization",    "platform": "Coursera"},
    "nlp":                 {"course": "Natural Language Processing Specialization","platform": "Coursera"},
    "computer vision":     {"course": "Computer Vision with Python & OpenCV",     "platform": "Udemy"},
    "spark":               {"course": "Apache Spark with Python",                 "platform": "Udemy"},
    "kafka":               {"course": "Apache Kafka Series",                      "platform": "Udemy"},
    "terraform":           {"course": "HashiCorp Certified: Terraform Associate", "platform": "Udemy"},
    "ci/cd":               {"course": "CI/CD Pipelines with GitHub Actions",      "platform": "Udemy"},
    "figma":               {"course": "UI Design Fundamentals with Figma",        "platform": "Coursera"},
    "agile":               {"course": "Agile with Atlassian Jira",                "platform": "Coursera"},
    "cybersecurity":       {"course": "Google Cybersecurity Certificate",         "platform": "Coursera"},
    "penetration testing": {"course": "Ethical Hacking Bootcamp",                 "platform": "Udemy"},
    "kotlin":              {"course": "Android Kotlin Development Masterclass",   "platform": "Udemy"},
    "swift":               {"course": "iOS App Development Bootcamp",             "platform": "Udemy"},
    "r":                   {"course": "R Programming",                            "platform": "Coursera"},
    "html":                {"course": "HTML & CSS – Build a Website",             "platform": "freeCodeCamp"},
    "css":                 {"course": "CSS – The Complete Guide",                 "platform": "Udemy"},
    "java":                {"course": "Java Programming Masterclass",             "platform": "Udemy"},
    "c":                   {"course": "C Programming for Beginners",              "platform": "Udemy"},
    "c++":                 {"course": "Beginning C++ Programming",                "platform": "Udemy"},
}

DEFAULT_COURSE = {"course": "Search on Coursera / Udemy / YouTube", "platform": "Various Platforms"}


# ══════════════════════════════════════════════
#   ERROR HANDLERS
# ══════════════════════════════════════════════

@app.errorhandler(413)
def file_too_large(e):
    return jsonify({"error": "File too large. Maximum allowed size is 16 MB."}), 413

@app.errorhandler(404)
def not_found(e):
    # Serve index.html for unknown routes (SPA fallback)
    return send_from_directory(app.static_folder, 'index.html')


# ══════════════════════════════════════════════
#   ROUTES
# ══════════════════════════════════════════════

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/upload.html')
def upload_page():
    return send_from_directory(app.static_folder, 'upload.html')

@app.route('/results.html')
def results_page():
    return send_from_directory(app.static_folder, 'results.html')

@app.route('/job-roles.html')
def job_roles_page():
    return send_from_directory(app.static_folder, 'job-roles.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status":       "ResumeIQ is live ✅",
        "pdf_support":  PDF_SUPPORT,
        "docx_support": DOCX_SUPPORT,
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file uploaded."}), 400

    file     = request.files['resume']
    job_role = request.form.get('job_role', '').strip().lower()
    use_ocr  = request.form.get('use_ocr', '').strip().lower() in {'1', 'true', 'yes', 'on'}

    if not file or file.filename == '':
        return jsonify({"error": "Empty file submitted."}), 400
    if not job_role:
        return jsonify({"error": "Please provide a job role."}), 400

    filename = secure_filename_simple(file.filename)
    ext      = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

    if ext not in ('pdf', 'doc', 'docx', 'txt'):
        return jsonify({"error": f"Unsupported file type '.{ext}'. Please upload PDF, DOC, DOCX, or TXT."}), 400

    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({"error": f"Could not save uploaded file: {str(e)}"}), 500

    try:
        resume_text = extract_text(filepath, filename, use_ocr=use_ocr)

        if not resume_text.strip():
            if ext == 'pdf':
                return jsonify({"error": "Could not extract text from the PDF. Please upload a text-based PDF or a DOCX/TXT file."}), 422
            return jsonify({"error": "Could not extract text from the file."}), 422

        required_skills = get_required_skills(job_role)
        if not required_skills:
            required_skills = fuzzy_match_role(job_role)
            if not required_skills:
                return jsonify({
                    "error": f"Job role '{job_role}' not found. Try: "
                             + ", ".join(list(JOB_SKILLS.keys())[:6])
                }), 404

        matched, missing = match_skills(resume_text, required_skills)
        score    = calculate_score(matched, required_skills)
        recs     = build_recommendations(missing)
        gap_text = generate_gap_analysis(job_role, score, matched, missing)

        return jsonify({
            "job_role":        job_role.title(),
            "match_score":     score,
            "matched_skills":  [s.title() for s in matched],
            "missing_skills":  [s.title() for s in missing],
            "gap_analysis":    gap_text,
            "recommendations": recs,
            "total_required":  len(required_skills)
        })

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    finally:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass


# ══════════════════════════════════════════════
#   HELPER FUNCTIONS
# ══════════════════════════════════════════════

def secure_filename_simple(filename):
    filename = os.path.basename(filename)
    filename = re.sub(r'[^\w.\-]', '_', filename)
    return filename or 'resume'


def extract_text(filepath, filename, use_ocr=False):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext == 'pdf':
        return extract_pdf_text(filepath)
    elif ext in ('doc', 'docx'):
        return extract_docx_text(filepath)
    else:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return ""


def extract_pdf_text(filepath):
    text = []
    if PDF_SUPPORT:
        try:
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
        except Exception as e:
            print(f"[PDF Error] {e}")
    return ' '.join(text).strip()


def extract_docx_text(filepath):
    if not DOCX_SUPPORT:
        return ""
    text = []
    try:
        doc = DocxDocument(filepath)
        for para in doc.paragraphs:
            text.append(para.text)
    except Exception as e:
        print(f"[DOCX Error] {e}")
    return ' '.join(text)


def get_required_skills(job_role):
    job_role = job_role.lower().strip()
    if job_role in JOB_SKILLS:
        return JOB_SKILLS[job_role]
    for key in JOB_SKILLS:
        if key in job_role or job_role in key:
            return JOB_SKILLS[key]
    return None


def fuzzy_match_role(job_role):
    job_words  = set(job_role.lower().split())
    best_match = None
    best_score = 0
    for key, skills in JOB_SKILLS.items():
        overlap = len(job_words & set(key.split()))
        if overlap > best_score:
            best_score = overlap
            best_match = skills
    return best_match if best_score > 0 else None


def match_skills(resume_text, required_skills):
    text_lower = resume_text.lower()
    matched, missing = [], []
    for skill in required_skills:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing


def calculate_score(matched_skills, required_skills):
    if not required_skills:
        return 0
    return min(100, round((len(matched_skills) / len(required_skills)) * 100))


def build_recommendations(missing_skills):
    recs = []
    for skill in missing_skills[:8]:
        course_info = COURSE_RECOMMENDATIONS.get(skill.lower(), DEFAULT_COURSE)
        recs.append({
            "skill":    skill.title(),
            "course":   course_info["course"],
            "platform": course_info["platform"]
        })
    return recs


def generate_gap_analysis(job_role, score, matched, missing):
    total    = len(matched) + len(missing)
    role_str = job_role.title()
    if score >= 80:
        return (
            f"Your resume is an excellent match for the {role_str} role. "
            f"You demonstrated {len(matched)} out of {total} required skills. "
            f"The {len(missing)} missing skill{'s' if len(missing) != 1 else ''} are minor gaps — "
            f"addressing them will make you a top-tier candidate."
        )
    elif score >= 60:
        return (
            f"You have a good match for the {role_str} role with {len(matched)} of {total} skills. "
            f"To become a stronger candidate, focus on learning the {len(missing)} missing skills. "
            f"Targeted courses could close these gaps in as little as 3–6 weeks."
        )
    elif score >= 40:
        return (
            f"Your profile partially matches the {role_str} requirements ({len(matched)} of {total} skills). "
            f"There are {len(missing)} skills that employers in this field commonly expect. "
            f"A structured learning plan would significantly improve your profile."
        )
    else:
        return (
            f"Your resume currently matches {len(matched)} of {total} skills for a {role_str}. "
            f"This role may be a stretch target for now — the learning recommendations below "
            f"outline a clear path to build the necessary foundation."
        )


# ══════════════════════════════════════════════
#   ENTRY POINT
# ══════════════════════════════════════════════

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
