from pathlib import Path
import pickle

import bentoml
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)
from xgboost import XGBClassifier


# =========================
# Project Paths
# =========================

BASE_DIR = Path(__file__).resolve().parent
IMAGE_DIR = BASE_DIR / "image"
MODEL_DIR = BASE_DIR / "model"

IMAGE_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


# =========================
# Data Preparation Part
# =========================

df = pd.read_csv("../data/WA_Fn-UseC_-HR-Employee-Attrition.csv")


def preprocess_data(df):
    print("Preprocessing the data...")

    df = df.ffill()
    df.columns = df.columns.str.lower()
    df = df.drop_duplicates().reset_index(drop=True)

    df["attrition"] = df["attrition"].map({"Yes": 1, "No": 0})

    df = df.drop(
        ["employeecount", "standardhours", "over18", "employeenumber"],
        axis=1,
    )

    df["education"] = df["education"].replace({
        1: "Below College",
        2: "College",
        3: "Bachelor",
        4: "Master",
        5: "Doctor",
    })

    df["environmentsatisfaction"] = df["environmentsatisfaction"].replace({
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Very High",
    })

    df["jobinvolvement"] = df["jobinvolvement"].replace({
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Very High",
    })

    df["joblevel"] = df["joblevel"].replace({
        1: "Entry Level",
        2: "Junior Level",
        3: "Mid Level",
        4: "Senior Level",
        5: "Executive Level",
    })

    df["jobsatisfaction"] = df["jobsatisfaction"].replace({
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Very High",
    })

    df["performancerating"] = df["performancerating"].replace({
        1: "Low",
        2: "Good",
        3: "Excellent",
        4: "Outstanding",
    })

    df["relationshipsatisfaction"] = df["relationshipsatisfaction"].replace({
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Very High",
    })

    df["worklifebalance"] = df["worklifebalance"].replace({
        1: "Bad",
        2: "Good",
        3: "Better",
        4: "Best",
    })

    x = df.drop("attrition", axis=1)
    y = df["attrition"]

    print("✅ Data preprocessing completed.")
    return df, x, y


df, x, y = preprocess_data(df)


# =========================
# Vectorization Part
# =========================

def split_and_vectorize(x, y):
    print("Splitting the data into training and testing sets...")

    X_train, X_test, Y_train, Y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    dv = DictVectorizer(sparse=False)

    train_dicts = X_train.to_dict(orient="records")
    test_dicts = X_test.to_dict(orient="records")

    X_train = dv.fit_transform(train_dicts)
    X_test = dv.transform(test_dicts)

    features = dv.get_feature_names_out().tolist()

    print("✅ Data splitting and vectorization completed.")
    return X_train, X_test, Y_train, Y_test, features, dv


X_train, X_test, Y_train, Y_test, features, dv = split_and_vectorize(x, y)


# =========================
# Model Training Part
# =========================

def train_xgboost(X_train, Y_train):
    print("Training the XGBoost model...")

    model = XGBClassifier(
        learning_rate=0.05,
        max_depth=4,
        n_estimators=200,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        subsample=0.8,
        colsample_bytree=0.8,
    )

    model.fit(X_train, Y_train)

    print("✅ Model training completed.")
    return model


model = train_xgboost(X_train, Y_train)


# =========================
# Evaluation Part
# =========================

def evaluate(model, X_train, X_test, Y_train, Y_test):
    Y_train_pred = model.predict(X_train)
    Y_test_pred = model.predict(X_test)
    Y_test_proba = model.predict_proba(X_test)[:, 1]

    print("✅ TRAINING RESULTS:")
    print("===============================")
    print(f"CONFUSION MATRIX:\n{confusion_matrix(Y_train, Y_train_pred)}")
    print(f"ACCURACY SCORE: {accuracy_score(Y_train, Y_train_pred):.4f}")
    print(
        "CLASSIFICATION REPORT:\n",
        pd.DataFrame(classification_report(Y_train, Y_train_pred, output_dict=True)),
    )

    print("\n✅ TESTING RESULTS:")
    print("===============================")
    print(f"CONFUSION MATRIX:\n{confusion_matrix(Y_test, Y_test_pred)}")
    print(f"ACCURACY SCORE: {accuracy_score(Y_test, Y_test_pred):.4f}")
    print(
        "CLASSIFICATION REPORT:\n",
        pd.DataFrame(classification_report(Y_test, Y_test_pred, output_dict=True)),
    )

    auc = roc_auc_score(Y_test, Y_test_proba)

    print("\n========= ROC AUC SCORE =========")
    print(f"ROC AUC SCORE: {auc:.4f}")

    print("✅ Model evaluation completed.")


evaluate(model, X_train, X_test, Y_train, Y_test)


# =========================
# Model Saving Part
# =========================

def model_saving_pickle(
    model,
    dv,
    df,
    model_path=MODEL_DIR / "employee_attrition_model.bin",
    dv_path=MODEL_DIR / "employee_dict_vectorizer.bin",
    data_path=MODEL_DIR / "preprocessed_data.csv",
):
    print("Saving the model, DictVectorizer, and cleaned data...")

    df.to_csv(data_path, index=False)

    with open(model_path, "wb") as f_out:
        pickle.dump(model, f_out)

    with open(dv_path, "wb") as f_out:
        pickle.dump(dv, f_out)

    print(f"✅ Model saved to: {model_path}")
    print(f"✅ DictVectorizer saved to: {dv_path}")
    print(f"✅ Cleaned dataset saved to: {data_path}")


def model_saving_bentoml(
    model,
    dv,
    model_name="employee_attrition_model",
    dv_name="employee_dict_vectorizer",
):
    print("Saving the model and DictVectorizer with BentoML...")

    bentoml.sklearn.save_model(model_name, model)
    bentoml.sklearn.save_model(dv_name, dv)

    print(f"✅ BentoML model saved as: {model_name}")
    print(f"✅ BentoML DictVectorizer saved as: {dv_name}")


model_saving_pickle(model, dv, df)
model_saving_bentoml(model, dv)

print("✅ All tasks completed successfully.")