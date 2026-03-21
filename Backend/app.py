from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ===============================
# MongoDB Connection
# ===============================

client = MongoClient("mongodb+srv://Admin:9IqmNsXiX9nqRFzn@cluster0.njjmlsv.mongodb.net/?appName=Cluster0")
db = client["student_projects"]
collection = db["submissions"]

# ===============================
# File Upload Folder
# ===============================

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ===============================
# Submit Route
# ===============================

@app.route("/submit", methods=["POST"])
def submit():

    try:

        # Save file
        file = request.files.get("file")

        filename = None
        file_path = None

        if file and file.filename != "":

            student_name = request.form.get("name")

            filename = f"{student_name}.pdf"

            file_path = os.path.join(
                UPLOAD_FOLDER,
                filename
            )

            file.save(file_path)

        # Collect form data

        student_data = {

            "reg_no": request.form.get("reg_no"),
            "name": request.form.get("name"),
            "team_name": request.form.get("team_name"),
            "team_size": request.form.get("team_size"),
            "team_guide": request.form.get("team_guide"),
            "department": request.form.get("department"),
            "email": request.form.get("email"),
            "phone": request.form.get("phone"),

            "project_title": request.form.get("project_title"),
            "project_domain": request.form.get("project_domain"),
            "technology_used": request.form.get("technology_used"),
            "project_description": request.form.get("project_description"),
            "other_projects": request.form.get("other_projects"),

            "paper_published": request.form.get("paper_published"),
            "journal_name": request.form.get("journal_name"),
            "isbn_no": request.form.get("isbn_no"),
            "journal_type": request.form.get("journal_type"),

            "payment_status": request.form.get("payment_status"),
            "report_submission": request.form.get("report_submission"),

            "ee_sem1_grade": request.form.get("ee_sem1_mark"),
            "ee_sem2_grade": request.form.get("ee_sem2_mark"),
            "ee_sem3_grade": request.form.get("ee_sem3_mark"),

            "file_name": filename,
            "file_path": file_path,

            "submitted_at": datetime.now()

        }

        collection.insert_one(student_data)

        return jsonify({
            "message": "Data stored successfully"
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ===============================
# Get Data Route
# ===============================

@app.route("/students", methods=["GET"])
def get_students():

    data = list(collection.find({}, {"_id": 0}))

    return jsonify(data)


# ===============================
# Run Server
# ===============================

if __name__ == "__main__":
    app.run(debug=True)