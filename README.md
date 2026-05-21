# Projexa — Academic Project Submission & Evaluation Platform

Projexa is a modern, high-fidelity web application designed to streamline the submission, management, and evaluation of academic projects. Featuring an elegant glassmorphic stepper interface for students and a robust, secure dashboard for staff, Projexa bridges the gap between academic progress tracking and secure digital records management.

---

## 🚀 Overview

The portal is split into two primary interfaces:
1. **Student Submission Portal (`index.html`)**: A sleek, user-friendly multi-step form built with a 3D animated cinematic transition system. It collects comprehensive project, author, publication, and grade details, along with structured weekly PDF abstracts.
2. **Staff Administration Panel (`AdminDashboard.html`)**: A secure, data-rich management console. Administrators can view, filter (by year, section, and department), search, edit, create, or delete student records, download dynamic CSV sheets, and read uploaded final reports and weekly updates in real time.

---

## 🎨 Key Features

### 👨‍🎓 For Students
* **6-Step Cinematic Stepper Form**:
  1. **Student Details**: Register number, team information, guide name, department, contact details, year, academic year, and section.
  2. **Project Details**: Title, domain, technologies used, detailed description, and past achievements/related works.
  3. **Weekly Abstracts**: Dynamic list builder allowing students to attach multiple weekly progress PDF files.
  4. **Publication Details**: Optional entries for published research papers (including Journal name, ISBN, and Journal Type) with conditional UI disabling.
  5. **Submission**: Secure drag-and-drop or file-click selector zone for uploading the final project report PDF (supports file-size validation, automatic upload-mock indicators, and clear-file logic).
  6. **Evaluation Marks**: Fields for recording EE Sem 1, 2, and 3 grades.
* **Smart UI States & Validation**: Fields dynamically disable themselves when they become non-applicable (e.g., if no paper is published, the Sem 3 Grade and publication inputs cleanly block themselves with automatic visual feedback).
* **Cinematic 3D Panel Transitions**: Enhanced visual polish using HSL variables, smooth CSS gradients, glassmorphism layers, and custom animation hooks.

### 👩‍🏫 For Staff & Admins
* **Secure Department Lock**: Simple yet effective department-specific password authentication (e.g., `cse@123`, `it@123`) mapping directly to relevant department metrics.
* **Collection-Style Navigation**: Visual folder-based selection by academic year (1st to 4th Year) and section tabs (Section A to E).
* **Full CRUD Capability**: Administrative tools to quickly insert new student profiles, update field details directly, or permanently delete student documents.
* **Unified Document Viewer**: Instantly download or view student PDFs and their corresponding weekly abstracts directly from the modal windows.
* **Instant Filtering & Deep Search**: Live matching against students' names, register numbers, email addresses, or project titles.
* **Analytics Metrics Card Panel**: Real-time stats widgets computing total records, approved projects, and pending corrections instantly.
* **CSV Export Utility**: Generate well-structured spreadsheet data with one click for easy backup or reporting.

---

## 🏗️ Project Architecture

The workspace is organized into clean, isolated Frontend and Backend directories:

```text
Projexa/
├── Backend/
│   ├── app.py                # Python Flask server containing RESTful endpoints
│   ├── requirements.txt      # Backend Python dependencies
│   ├── runtime.txt           # Specified python runtime engine (python-3.11.9)
│   ├── test_mongo.py         # Diagnostic utility to verify MongoDB Atlas connection
│   └── uploads/              # Local storage base for hierarchically sorted uploads
│       └── [Department]/[AcademicYear]/[Section]/...
│
├── Frontend/
│   ├── index.html            # Main multi-step student submission webpage
│   ├── AdminLogin.html       # Administrative staff gateway credentials portal
│   ├── AdminDashboard.html   # Main management dashboard grid
│   └── assets/
│       ├── css/
│       │   ├── main.css      # Stepper form structure, variables, & glass styling
│       │   └── admin_dashboard.css # Admin grid, folder shapes, and modal overlays
│       └── js/
│           └── script.js     # Transitions, validators, upload drops, and API routing
│
├── .gitignore                # Optimized patterns for environment vars, caches, and PDFs
└── README.md                 # Project instruction manual (this file)
```

---

## 💻 Tech Stack

### Frontend
* **Core**: Semantic HTML5 & Modern ES6 JavaScript (Vanilla).
* **Styling**: Pure CSS3 utilizing custom HSL properties, Glassmorphism design principles, and native flexible grids.
* **Iconography & Typography**: Google Fonts (*Outfit* & *Inter*) & Feather Icons.

### Backend
* **Server Framework**: Flask & Flask-CORS (Python).
* **Database Management**: PyMongo Atlas integration with optimized pooling (`maxPoolSize=50`, `socketTimeoutMS=45000`).
* **Environment Configuration**: Dotenv (`python-dotenv`).
* **Production Web Server**: Gunicorn.

---

## ⚙️ Installation & Local Setup

To get both the Backend and Frontend running on your local machine, follow these steps:

### 1. Database Setup
* Ensure you have a running MongoDB database (either a local instance or a free MongoDB Atlas Cluster).
* Obtain your MongoDB connection string (URI).

### 2. Backend Configurations
1. Navigate into the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file inside the `Backend/` folder with the following keys:
   ```env
   MONGO_URI=your_mongodb_connection_string_here
   DB_NAME=student_projects
   PORT=5000
   ```
6. *(Optional)* Test your database connectivity before launching:
   ```bash
   python test_mongo.py
   ```
7. Start the Flask server:
   ```bash
   python app.py
   ```
   *The backend will boot up at `http://127.0.0.1:5000`.*

### 3. Frontend Configurations
1. Projexa is configured to dynamically route API calls depending on your hostname:
   * If run locally (`localhost`, `127.0.0.1`, or via the `file://` protocol), it targets the local server at `http://127.0.0.1:5000`.
   * Otherwise, it will fallback to your configured `PRODUCTION_URL` in `Frontend/assets/js/script.js` & `Frontend/AdminDashboard.html`.
2. Simply double-click `Frontend/index.html` or run a local static web server to open the portal.
   * To access the administrative portal, click the **Staff Icon** at the bottom-right corner of the main form page or open `Frontend/AdminLogin.html` directly in your browser.

---

## 🔐 Administrative Access Details

Access to the `AdminDashboard.html` is secured using a simple front-to-back departmental password verification scheme.

* **Login Path**: `Frontend/AdminLogin.html`
* **Department Username**: Select your department from the dropdown (e.g., `CSE`, `IT`, `ECE`, `EEE`, `MECH`, `CIVIL`).
* **Department Passwords**: The portal authenticates using the pattern `[department_code_lowercase]@123`.
  * *For example:*
    * **CSE**: `cse@123`
    * **IT**: `it@123`
    * **ECE**: `ece@123`
    * **EEE**: `eee@123`

---

## 🗂️ PDF Directory Structure

When a student submits their details, the backend programmatically structures the uploaded static PDFs inside the local `uploads` directory. This makes backing up files extremely neat and structured by class/year:

* **Final Report**: `uploads/[Department]/[AcademicYear]/[Section]/[StudentName].pdf`
* **Weekly Abstracts**: `uploads/[Department]/[AcademicYear]/[Section]/abstracts/[RegNo]_week_[WeekNumber].pdf`
