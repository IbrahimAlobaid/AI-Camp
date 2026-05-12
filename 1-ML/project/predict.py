from pathlib import Path
import pickle

from fastapi import FastAPI
from pydantic import BaseModel


# =========================
# Project Paths
# =========================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "employee_attrition_model.bin"
DV_PATH = MODEL_DIR / "employee_dict_vectorizer.bin"


# =========================
# Request Schema
# =========================

class EmployeeData(BaseModel):
    age: int
    businesstravel: str
    dailyrate: int
    department: str
    distancefromhome: int
    education: str
    educationfield: str
    environmentsatisfaction: str
    gender: str
    hourlyrate: int
    jobinvolvement: str
    joblevel: str
    jobrole: str
    jobsatisfaction: str
    maritalstatus: str
    monthlyincome: int
    monthlyrate: int
    numcompaniesworked: int
    overtime: str
    percentsalaryhike: int
    performancerating: str
    relationshipsatisfaction: str
    stockoptionlevel: int
    totalworkingyears: int
    trainingtimeslastyear: int
    worklifebalance: str
    yearsatcompany: int
    yearsincurrentrole: int
    yearssincelastpromotion: int
    yearswithcurrmanager: int


# =========================
# Load Model
# =========================

def load_pickle_file(file_path: Path):
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "rb") as f_in:
        return pickle.load(f_in)


model = load_pickle_file(MODEL_PATH)
dv = load_pickle_file(DV_PATH)


# =========================
# FastAPI App
# =========================

app = FastAPI(
    title="Employee Attrition Prediction API",
    description="API for predicting whether an employee may leave the company.",
    version="1.0.0",
)


@app.get("/")
def home():
    return {
        "message": "Employee Attrition Prediction API is running successfully."
    }


@app.post("/predict")
def predict(employee: EmployeeData):
    employee_dict = employee.model_dump()

    X = dv.transform([employee_dict])

    prediction = model.predict(X)
    label = int(prediction[0])

    probability = None

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)

        if proba.ndim == 2 and proba.shape[1] >= 2:
            probability = float(proba[0, 1])
        else:
            probability = float(proba[0])

    if label == 1:
        message = "Employee will LEAVE the company."
    else:
        message = "Employee will NOT leave the company."

    return {
        "prediction": label,
        "probability_of_leaving": probability,
        "message": message,
    }