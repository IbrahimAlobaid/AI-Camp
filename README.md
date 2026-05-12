
#  AI Camp  University of Aleppo

Welcome to the **Artificial Intelligence Camp** at the **University of Aleppo**.

This repository contains the educational materials, notebooks, datasets, and practical projects used during the AI Camp sessions.  
The goal of this camp is to help students and beginners build a strong foundation in Artificial Intelligence through practical, hands-on learning.


##  About the Camp

The AI Camp is designed to introduce students to the main fields of Artificial Intelligence step by step, starting from Machine Learning fundamentals and moving toward more advanced AI topics.

The camp focuses on:

- Understanding AI concepts in a simple and practical way
- Learning how Machine Learning models work
- Building real-world projects
- Practicing with Python and popular ML libraries
- Preparing students for future AI projects and research

##  AI Community in Syria

Join the Artificial Intelligence community in Syria through Telegram:

👉 [https://t.me/AIworkshop_ite](https://t.me/AIworkshop_ite)

This community aims to support students, engineers, and developers interested in Artificial Intelligence through workshops, discussions, resources, and practical learning paths.

##  Repository Structure

```text
AI-Camp/
│
├── README.md
│
└── 1-ML/
    ├── data/
    ├── notebook/
    └── project/
````



#  1-ML — Session 1: Machine Learning

The folder `1-ML` contains the full material for the **first session** of the Artificial Intelligence Camp at the **University of Aleppo**.

This session introduces students to the foundations of **Machine Learning**, including theoretical concepts, practical notebooks, and a complete end-to-end ML project.

--

## 📂 1-ML Folder Structure

```text
1-ML/
│
├── data/
│   └── WA_Fn-UseC_-HR-Employee-Attrition.csv
│
├── notebook/
│   ├── LINEAR_AND_Logistic_REGRESSION.ipynb
│   ├── Machine_Learning.ipynb
│   └── ML_Explained.ipynb
│
└── project/
    ├── Dockerfile
    ├── README.md
    ├── main.py
    ├── predict.py
    ├── Streamlit.py
    ├── train.py
    ├── requirements.txt
    ├── pyproject.toml
    ├── uv.lock
    ├── images/
    └── model/
```

---

##  Session 1 Topics

The first session covers the core ideas of Machine Learning:

* What is Machine Learning?
* Why do we use Machine Learning?
* Difference between traditional programming and ML
* Types of Machine Learning:

  * Supervised Learning
  * Unsupervised Learning
  * Reinforcement Learning
* ML workflow and pipeline
* Data preprocessing
* Feature engineering
* Model training
* Model evaluation
* Model deployment basics


##  Notebooks

The `notebook/` folder contains educational notebooks used during the session.

| Notebook                               | Description                                                   |
| -------------------------------------- | ------------------------------------------------------------- |
| `ML_Explained.ipynb`                   | Simple explanation of Machine Learning concepts               |
| `Machine_Learning.ipynb`               | Practical ML examples and workflow                            |
| `LINEAR_AND_Logistic_REGRESSION.ipynb` | Linear Regression and Logistic Regression explained with code |



##  Dataset

The dataset used in the practical project is stored in:

```text
1-ML/data/WA_Fn-UseC_-HR-Employee-Attrition.csv
```

It is used to build an **Employee Attrition Prediction** model.

The task is to predict whether an employee may leave the company based on HR-related features such as:

* Age
* Job Role
* Department
* Monthly Income
* Overtime
* Job Satisfaction
* Years at Company
* Work-Life Balance


##  Practical Project

The `project/` folder contains a complete end-to-end Machine Learning project:

```text
Employee Attrition Prediction
```

The project includes:

* Data preprocessing
* Model training
* Model saving
* FastAPI backend
* Streamlit frontend
* Docker deployment

---

##  How to Run the Project

Go to the project folder:

```bash
cd 1-ML/project
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Or using `uv`:

```bash
uv pip install -r requirements.txt
```

Train the model:

```bash
python train.py
```

Run FastAPI:

```bash
uvicorn predict:app --reload
```

Run Streamlit:

```bash
streamlit run Streamlit.py
```

---

##  Docker

Build the Docker image:

```bash
docker build -t employee-attrition-api .
```

Run the container:

```bash
docker run -p 8000:8000 employee-attrition-api
```

Open the API documentation:

```text
http://127.0.0.1:8000/docs
```

---


##  Learning Outcomes

By the end of this session, students should be able to:

* Understand the basic concepts of Machine Learning
* Prepare and clean a dataset
* Train a simple ML model
* Evaluate model performance
* Save and load trained models
* Build a basic FastAPI prediction service
* Create a simple Streamlit interface
* Package the backend using Docker

---

##  Organized By

**Artificial Intelligence Camp**
**University of Aleppo**

---

## ✅ Status

Session 1 material is ready and includes notebooks, dataset, and a complete practical Machine Learning project.


