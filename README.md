# ⬡ ResumeIQ – Intelligent Resume Screening & Skill Gap Analyzer

A beginner-friendly full-stack college project that uses keyword matching to
screen resumes and identify skill gaps for a target job role.

---

## 📁 Folder Structure

```
resume_screener/
│
├── frontend/               ← All HTML, CSS, JS files
│   ├── index.html          ← Home page
│   ├── upload.html         ← Resume upload page
│   ├── results.html        ← Results & analysis page
│   ├── style.css           ← All styles (blue/white theme)
│   ├── main.js             ← Shared JS utilities
│   ├── upload.js           ← Upload page logic
│   └── results.js          ← Results page rendering
│
├── backend/                ← Python Flask API
│   ├── app.py              ← Main Flask application
│   ├── requirements.txt    ← Python dependencies
│   ├── sample_resume.txt   ← Test resume (text format)
│   └── uploads/            ← Temporary upload folder (auto-created)
│
└── README.md               ← This file
```

---

## 🚀 How to Run the Project

### Step 1 – Install Python
Make sure Python 3.8+ is installed.
Check with: `python --version`

---

### Step 2 – Install Dependencies

Open your terminal, navigate to the `backend/` folder:

```bash
cd resume_screener/backend
pip install -r requirements.txt
```

This installs:
- **Flask** – Web framework for the API
- **Flask-CORS** – Allows the HTML frontend to talk to Flask
- **PyPDF2** – Extracts text from PDF resumes
- **python-docx** – Extracts text from DOCX resumes

---

### Step 3 – Start the Flask Backend

From the `backend/` folder, run:

```bash
python app.py
```

You should see:
```
==================================================
  ResumeIQ Backend is starting...
  PDF support:  ✅ PyPDF2 installed
  DOCX support: ✅ python-docx installed
  Running at:   http://127.0.0.1:5000
==================================================
```

Keep this terminal window open.

---

### Step 4 – Open the Frontend

Open a **new terminal** (or use File Explorer) and open:

```
resume_screener/frontend/index.html
```

Double-click `index.html` to open it in your browser, OR use VS Code's
**Live Server** extension for a better experience.

---

### Step 5 – Test the App

1. Click **"Get Started"** on the Home page
2. Upload `sample_resume.txt` (found in the `backend/` folder)
3. Type a job role like **"Data Scientist"** or click a quick-pick chip
4. Click **"Analyze Resume"**
5. View your results on the Results page!

---

## 🧪 Supported Job Roles

| Category | Roles |
|----------|-------|
| AI/Data  | Data Scientist, Machine Learning Engineer, Data Analyst, Data Engineer |
| Web Dev  | Full Stack Developer, Frontend Developer, Backend Developer |
| Ops      | DevOps Engineer, Cloud Architect |
| Security | Cybersecurity Analyst |
| Mobile   | Android Developer, iOS Developer |
| Design   | UI/UX Designer |
| Other    | Project Manager, Embedded Systems Engineer |

---

## 🔧 API Reference

### `POST /analyze`

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `resume` | File | PDF, DOCX, or TXT file |
| `job_role` | String | Target job role |

**Response:** JSON
```json
{
  "job_role": "Data Scientist",
  "match_score": 72,
  "matched_skills": ["Python", "Pandas", "Scikit-Learn", "..."],
  "missing_skills": ["Tensorflow", "Keras", "..."],
  "gap_analysis": "Your profile partially matches...",
  "recommendations": [
    {
      "skill": "TensorFlow",
      "course": "TensorFlow Developer Certificate",
      "platform": "Coursera"
    }
  ],
  "total_required": 24
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Could not connect to server" | Make sure `python app.py` is running in the backend folder |
| PDF text not extracted | Ensure the PDF is not scanned/image-based (use text-based PDFs) |
| CORS error | Flask-CORS is installed — restart Flask |
| "Job role not found" | Use one of the supported roles listed above |
| Port 5000 busy | Edit `app.py` last line: change `port=5000` to `port=5001` and update upload.js URL |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (Grid/Flexbox), Vanilla JS |
| Backend | Python 3, Flask, Flask-CORS |
| PDF Parsing | PyPDF2 |
| DOCX Parsing | python-docx |
| Skill Matching | Regex keyword matching |
| Fonts | Google Fonts (Sora + DM Sans) |

---

## 💡 How It Works

1. **Upload** → Flask receives the file and saves it temporarily
2. **Extract** → PyPDF2 or python-docx reads the text content
3. **Match** → Regex searches for each required skill keyword in the text
4. **Score** → `(matched / total_required) × 100`
5. **Analyze** → Missing skills are identified and sorted
6. **Recommend** → Pre-defined course database maps skills to courses
7. **Display** → Frontend renders animated results with progress bars

---

## 📚 Extensions / Future Ideas

- Add more job roles to `JOB_SKILLS` dict in `app.py`
- Use spaCy NLP for smarter skill extraction
- Add user authentication and save results to a database
- Generate a downloadable PDF report
- Compare multiple resumes for the same role

---

Built with ♥ as a college project · ResumeIQ 2025
