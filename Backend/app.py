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

# Use optimized connection parameters for Atlas
client = MongoClient(
    "mongodb+srv://Admin:9IqmNsXiX9nqRFzn@cluster0.njjmlsv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    maxPoolSize=50,
    connectTimeoutMS=5000,
    socketTimeoutMS=45000,
    serverSelectionTimeoutMS=5000
)
db = client["student_projects"]
collection = db["submissions"]

# ===============================
# File Upload Folder
# ===============================

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Define indexes for faster search and sorting
collection.create_index("reg_no")
collection.create_index("submitted_at")

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

            "review_status": request.form.get("review_status"),
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
    # Return light-weight list for the dashboard table (Efficiency for 70+ users)
    projection = {
        "_id": 0, "name": 1, "reg_no": 1, "email": 1, "department": 1,
        "project_title": 1, "technology_used": 1, "review_status": 1,
        "report_submission": 1, "ee_sem1_grade": 1, "ee_sem2_grade": 1,
        "submitted_at": 1
    }
    data = list(collection.find({}, projection).sort("submitted_at", -1))
    
    for d in data:
        if "submitted_at" in d and isinstance(d["submitted_at"], datetime):
            d["submitted_at"] = d["submitted_at"].isoformat()

    return jsonify(data)

@app.route("/student/<path:reg_no>", methods=["GET"])
def get_student_details(reg_no):
    # Fetch full record for the edit modal
    student = collection.find_one({"reg_no": reg_no}, {"_id": 0})
    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    if "submitted_at" in student and isinstance(student["submitted_at"], datetime):
        student["submitted_at"] = student["submitted_at"].isoformat()
        
    return jsonify(student)

@app.route("/students_full", methods=["GET"])
def get_students_full():
    # Fetch everything for a proper full export
    data = list(collection.find({}, {"_id": 0}).sort("submitted_at", -1))
    
    for d in data:
        if "submitted_at" in d and isinstance(d["submitted_at"], datetime):
            d["submitted_at"] = d["submitted_at"].isoformat()

    return jsonify(data)


# ===============================
# Run Server
# ===============================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)