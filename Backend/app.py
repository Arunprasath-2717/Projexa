from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from datetime import datetime
import os

# ==============================
# Flask Setup
# ==============================

app = Flask(__name__)
CORS(app)

# ==============================
# MongoDB Connection
# ==============================

client = MongoClient("mongodb://localhost:27017/")
db = client["studentDB"]
collection = db["projects"]   # collection name stays the same

# ==============================
# File Upload Configuration
# ==============================

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create uploads folder if not exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ==============================
# Helper Functions
# ==============================

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def to_int_or_none(value):
    try:
        return int(value) if value is not None and value != "" else None
    except ValueError:
        return None


# ==============================
# Submit Student Project
# ==============================

@app.route("/submit", methods=["POST"])
def submit():

    try:
        # --------------------------
        # Student & Team Details
        # --------------------------

        reg_no = request.form.get("reg_no")
        name = request.form.get("name")

        team_name = request.form.get("team_name")
        team_size = request.form.get("team_size")
        team_guide = request.form.get("team_guide")

        # --------------------------
        # Project Details
        # --------------------------

        project_title = request.form.get("project_title")
        other_projects = request.form.get("other_projects")

        # --------------------------
        # Journal Details
        # --------------------------

        paper_published = request.form.get("paper_published")
        journal_name = request.form.get("journal_name")
        isbn_no = request.form.get("isbn_no")
        journal_type = request.form.get("journal_type")

        # --------------------------
        # Submission & Payment
        # --------------------------

        payment_status = request.form.get("payment_status")
        report_submission = request.form.get("report_submission")

        # --------------------------
        # Evaluation Marks
        # --------------------------

        ee_sem1 = to_int_or_none(request.form.get("ee_sem1"))
        ee_sem2 = to_int_or_none(request.form.get("ee_sem2"))
        ee_sem3 = to_int_or_none(request.form.get("ee_sem3"))

        # --------------------------
        # Validation
        # --------------------------

        if not reg_no or not name:
            return jsonify({
                "error": "Register number and name are required"
            }), 400

        # Prevent duplicate register number
        existing = collection.find_one({"reg_no": reg_no})
        if existing:
            return jsonify({
                "error": "Student with this register number already exists"
            }), 409

        # --------------------------
        # File Handling
        # --------------------------

        if "file" not in request.files:
            return jsonify({
                "error": "PDF file is required"
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "error": "Empty file name"
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": "Only PDF files are allowed"
            }), 400

        # Save file using student name
        safe_name = secure_filename(name)
        filename = f"{safe_name}_{reg_no}.pdf"

        file_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            filename
        )

        file.save(file_path)

        # --------------------------
        # Store Data in MongoDB
        # --------------------------

        student_data = {

            # Student Details
            "reg_no": reg_no,
            "name": name,

            # Team Details
            "team_name": team_name,
            "team_size": team_size,
            "team_guide": team_guide,

            # Project Details
            "project_title": project_title,
            "other_projects": other_projects,

            # Journal Details
            "paper_published": paper_published,
            "journal_name": journal_name,
            "isbn_no": isbn_no,
            "journal_type": journal_type,

            # Submission
            "payment_status": payment_status,
            "report_submission": report_submission,

            # Marks
            "ee_sem1_grade": ee_sem1,
            "ee_sem2_grade": ee_sem2,
            "ee_sem3_grade": ee_sem3,

            # File
            "file_name": filename,
            "file_path": file_path,

            # Timestamp
            "submitted_at": datetime.now()

        }

        collection.insert_one(student_data)

        return jsonify({
            "message": "Student data and file stored successfully"
        }), 200

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500


# ==============================
# Get All Students
# ==============================

@app.route("/students", methods=["GET"])
def get_students():

    students = list(collection.find({}, {"_id": 0}))

    return jsonify(students)


# ==============================
# Get One Student
# ==============================

@app.route("/student/<reg_no>", methods=["GET"])
def get_student(reg_no):

    student = collection.find_one(
        {"reg_no": reg_no},
        {"_id": 0}
    )

    if not student:
        return jsonify({
            "error": "Student not found"
        }), 404

    return jsonify(student)


# ==============================
# Download PDF
# ==============================

@app.route("/download/<reg_no>", methods=["GET"])
def download_file(reg_no):

    student = collection.find_one({"reg_no": reg_no})

    if not student:
        return jsonify({
            "error": "Student not found"
        }), 404

    filename = student.get("file_name")

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename,
        as_attachment=True
    )


# ==============================
# Delete Student
# ==============================

@app.route("/delete/<reg_no>", methods=["DELETE"])
def delete_student(reg_no):

    student = collection.find_one({"reg_no": reg_no})

    if not student:
        return jsonify({
            "error": "Student not found"
        }), 404

    # Delete file
    file_path = student.get("file_path")

    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Delete DB record
    collection.delete_one({"reg_no": reg_no})

    return jsonify({
        "message": "Student deleted successfully"
    })


# ==============================
# Run Server
# ==============================

if __name__ == "__main__":
    app.run(debug=True)