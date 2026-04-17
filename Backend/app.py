from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = app.logger

# ===============================
# MongoDB Connection
# ===============================

# Use optimized connection parameters for Atlas
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "student_projects")

client = MongoClient(
    MONGO_URI,
    maxPoolSize=50,
    connectTimeoutMS=5000,
    socketTimeoutMS=45000,
    serverSelectionTimeoutMS=5000
)
db = client[DB_NAME]

# Using a single standardized collection makes queries, updates, and deletes 
# much more efficient and scalable than managing dynamic collections.
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

        student_name = request.form.get("name", "Unknown")
        department = request.form.get("department", "Unknown")
        academic_year = request.form.get("academic_year", "Unknown")
        class_section = request.form.get("class_section", "Unknown")
        year = request.form.get("year", "Unknown")

        if file and file.filename != "":

            filename = f"{student_name}.pdf"
            
            # store the data as department->year->section (file structure locally)
            save_dir = os.path.join(UPLOAD_FOLDER, department, academic_year, class_section)
            os.makedirs(save_dir, exist_ok=True)

            file_path = os.path.join(
                save_dir,
                filename
            )

            file.save(file_path)

        # Make abstract directory
        abstract_dir = os.path.join(UPLOAD_FOLDER, department, academic_year, class_section, "abstracts")
        os.makedirs(abstract_dir, exist_ok=True)

        # Collect weekly abstracts
        weekly_abstracts = []
        for key in request.files:
            if key.startswith("weekly_abstract_"):
                week_num = key.split("_")[-1]
                w_file = request.files[key]
                if w_file and w_file.filename != "":
                    reg_no = request.form.get("reg_no")
                    # Use reg_no to ensure uniqueness
                    w_filename = f"{reg_no}_week_{week_num}.pdf"
                    w_file_path = os.path.join(abstract_dir, w_filename)
                    w_file.save(w_file_path)
                    weekly_abstracts.append({
                        "week": int(week_num),
                        "file_name": w_filename,
                        "file_path": w_file_path
                    })

        # Collect form data
        student_data = {
            "reg_no": request.form.get("reg_no"),
            "name": student_name,
            "class_section": class_section,
            "academic_year": academic_year,
            "year": year,
            "team_name": request.form.get("team_name"),
            "team_size": request.form.get("team_size"),
            "team_guide": request.form.get("team_guide"),
            "department": department,
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

            "review_status": request.form.get("review_status"),
            "report_submission": request.form.get("report_submission"),

            "ee_sem1_grade": request.form.get("ee_sem1_mark"),
            "ee_sem2_grade": request.form.get("ee_sem2_mark"),
            "ee_sem3_grade": request.form.get("ee_sem3_mark"),

            "file_name": filename,
            "file_path": file_path,
            "weekly_abstracts": weekly_abstracts,

            "submitted_at": datetime.now()
        }

        # Save to single centralized MongoDB Collection
        collection.insert_one(student_data)

        return jsonify({
            "message": "Data stored successfully"
        })

    except Exception as e:
        logger.error(f"Submission Error: {str(e)}")
        return jsonify({
            "error": "Failed to store record"
        }), 500


# ===============================
# Admin Create Route
# ===============================

@app.route("/admin_create", methods=["POST"])
def admin_create():
    try:
        data = request.json
        data["submitted_at"] = datetime.now()
        data["file_name"] = None
        data["file_path"] = None
        
        # Ensure it has a reg_no
        if not data.get("reg_no"):
            return jsonify({"error": "Register Number is required"}), 400
            
        collection.insert_one(data)
        
        return jsonify({"message": "Student record created successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# Update Route
# ===============================

@app.route("/update/<path:reg_no>", methods=["PUT"])
def update_student(reg_no):
    try:
        data = request.json
        
        # Only update fields provided in request
        update_fields = {k: v for k, v in data.items() if v is not None}
        
        if not update_fields:
            return jsonify({"error": "No data provided for update"}), 400
            
        result = collection.update_one({"reg_no": reg_no}, {"$set": update_fields})
        
        if result.matched_count == 0:
            return jsonify({"error": "Student not found"}), 404
            
        return jsonify({"message": "Student record updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# Delete Route
# ===============================

@app.route("/delete/<path:reg_no>", methods=["DELETE"])
def delete_student(reg_no):
    try:
        result = collection.delete_one({"reg_no": reg_no})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Student not found"}), 404
            
        return jsonify({"message": "Student record deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===============================
# Get Data Routes
# ===============================

@app.route("/students", methods=["GET"])
def get_students():
    # Built-in robust filtering!
    query = {}
    
    class_filter = request.args.get("class")
    department_filter = request.args.get("department")
    year_filter = request.args.get("year")
    
    if class_filter:
        query["class_section"] = class_filter
    if department_filter:
        query["department"] = department_filter
    if year_filter:
        query["year"] = year_filter
        
    projection = {
        "_id": 0, "name": 1, "reg_no": 1, "email": 1, "department": 1,
        "year": 1, "project_title": 1, "technology_used": 1, "review_status": 1,
        "report_submission": 1, "ee_sem1_grade": 1, "ee_sem2_grade": 1,
        "submitted_at": 1, "class_section": 1
    }
    
    data = list(collection.find(query, projection))
    data.sort(key=lambda x: x.get("submitted_at", datetime.min), reverse=True)
    
    for d in data:
        if "submitted_at" in d and isinstance(d["submitted_at"], datetime):
            d["submitted_at"] = d["submitted_at"].isoformat()

    return jsonify(data)

@app.route("/student/<path:reg_no>", methods=["GET"])
def get_student_details(reg_no):
    student = collection.find_one({"reg_no": reg_no}, {"_id": 0})

    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    if "submitted_at" in student and isinstance(student["submitted_at"], datetime):
        student["submitted_at"] = student["submitted_at"].isoformat()
        
    return jsonify(student)

@app.route("/students_full", methods=["GET"])
def get_students_full():
    data = list(collection.find({}, {"_id": 0}))
    data.sort(key=lambda x: x.get("submitted_at", datetime.min), reverse=True)
    
    for d in data:
        if "submitted_at" in d and isinstance(d["submitted_at"], datetime):
            d["submitted_at"] = d["submitted_at"].isoformat()

    return jsonify(data)


@app.route("/uploads/<path:filename>")
def serve_file(filename):
    filename = os.path.basename(filename) # To handle both just a name and full paths if passed
    for root, dirs, files in os.walk(UPLOAD_FOLDER):
        if filename in files:
            return send_from_directory(root, filename)
    return "File not found", 404


# ===============================
# Run Server
# ===============================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)