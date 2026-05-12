import streamlit as st
import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import time
import math

FASTAPI_URL = "http://localhost:8000/predict" 

st.set_page_config(page_title="Employee Attrition — Predict & Visualize",
                   layout="wide",
                   initial_sidebar_state="collapsed")


st.markdown(
    """
    <style>
    /* Page background */
    .stApp {
        background: linear-gradient(180deg, #f6f8fb 0%, #ffffff 100%);
    }

    /* Card style */
    .card {
        background: #ffffff;
        border-radius: 12px;
        padding: 18px;
        box-shadow: 0 6px 18px rgba(32,33,36,0.08);
        margin-bottom: 16px;
    }

    /* Headings */
    .title {
        font-size:28px;
        font-weight:700;
        color:#0f172a;
        margin-bottom:6px;
    }
    .subtitle {
        color:#475569;
        margin-top: -6px;
        margin-bottom: 12px;
        font-size:14px;
    }

    /* Button */
    .stButton>button {
        background: linear-gradient(90deg,#7c3aed,#06b6d4);
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
    }
    .stButton>button:hover {
        filter: brightness(1.03);
    }

    /* Metric style tweak */
    .stMetric > div {
        background: transparent;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


st.markdown('<div class="card"><div class="title">🏢 Employee Attrition Predictor</div>'
            '<div class="subtitle">Fill employee details (left) and click Predict. See charts & summary on the right.</div></div>',
            unsafe_allow_html=True)


left_col, right_col = st.columns([1, 1.2], gap="large")

with left_col:
    with st.form("prediction_form", clear_on_submit=False):
        
        st.markdown('<div class="card"> <strong>Employee information</strong></div>', unsafe_allow_html=True)

        c1, c2 = st.columns(2)
        with c1:
            age = st.number_input("Age", min_value=18, max_value=80, value=30)
            businesstravel = st.selectbox("Business Travel", ["Travel_Rarely", "Travel_Frequently", "Non-Travel"])
            dailyrate = st.number_input("Daily Rate", min_value=0, max_value=20000, value=500)
            department = st.selectbox("Department", ["Sales", "Research & Development", "Human Resources"])
            distancefromhome = st.number_input("Distance From Home", min_value=0, max_value=500, value=10)
            education = st.selectbox("Education", ["Below College", "College", "Bachelor", "Master", "Doctor"])
            educationfield = st.selectbox("Education Field",
                                          ["Life Sciences", "Medical", "Marketing", "Technical Degree",
                                           "Human Resources", "Other"])
            environmentsatisfaction = st.selectbox("Environment Satisfaction", ["Low", "Medium", "High", "Very High"])

        with c2:
            gender = st.selectbox("Gender", ["Male", "Female"])
            hourlyrate = st.number_input("Hourly Rate", min_value=0, max_value=1000, value=50)
            jobinvolvement = st.selectbox("Job Involvement", ["Low", "Medium", "High", "Very High"])
            joblevel = st.selectbox("Job Level", ["Entry Level", "Junior Level", "Mid Level", "Senior Level", "Executive Level"])
            jobrole = st.selectbox("Job Role", ["Sales Executive", "Research Scientist", "Laboratory Technician",
                                               "Manufacturing Director", "Healthcare Representative", "Manager",
                                               "Sales Representative", "Research Director", "Human Resources"])
            jobsatisfaction = st.selectbox("Job Satisfaction", ["Low", "Medium", "High", "Very High"])
            maritalstatus = st.selectbox("Marital Status", ["Single", "Married", "Divorced"])
            monthlyincome = st.number_input("Monthly Income", min_value=0, max_value=500000, value=5000)

        
        st.markdown("**More details**")
        t1, t2, t3, t4 = st.columns(4)
        with t1:
            monthlyrate = st.number_input("Monthly Rate", min_value=0, max_value=500000, value=15000)
        with t2:
            numcompaniesworked = st.number_input("Num Companies Worked", min_value=0, max_value=50, value=1)
        with t3:
            overtime = st.selectbox("OverTime", ["Yes", "No"])
        with t4:
            percentsalaryhike = st.number_input("Percent Salary Hike", min_value=0, max_value=100, value=11)

        u1, u2, u3, u4 = st.columns(4)
        with u1:
            performancerating = st.selectbox("Performance Rating", ["Low", "Good", "Excellent", "Outstanding"])
        with u2:
            relationshipsatisfaction = st.selectbox("Relationship Satisfaction", ["Low", "Medium", "High", "Very High"])
        with u3:
            stockoptionlevel = st.number_input("Stock Option Level", min_value=0, max_value=5, value=0)
        with u4:
            totalworkingyears = st.number_input("Total Working Years", min_value=0, max_value=60, value=5)

        v1, v2, v3 = st.columns(3)
        with v1:
            trainingtimeslastyear = st.number_input("Training Times Last Year", min_value=0, max_value=100, value=2)
        with v2:
            worklifebalance = st.selectbox("Work Life Balance", ["Bad", "Good", "Better", "Best"])
        with v3:
            yearsatcompany = st.number_input("Years at Company", min_value=0, max_value=60, value=2)

        w1, w2, w3 = st.columns(3)
        with w1:
            yearsincurrentrole = st.number_input("Years in Current Role", min_value=0, max_value=60, value=1)
        with w2:
            yearssincelastpromotion = st.number_input("Years since Last Promotion", min_value=0, max_value=60, value=0)
        with w3:
            yearswithcurrmanager = st.number_input("Years with Current Manager", min_value=0, max_value=60, value=1)

        submit_btn = st.form_submit_button("Predict")

with right_col:
    
    result_card = st.empty()
    charts_card = st.empty()

if 'submit_btn' not in st.session_state:
    st.session_state['submit_btn'] = False

def _post_payload_with_timeout(url, payload, timeout_seconds=10):
    """
    Try to POST once with given timeout. Return (success_bool, response_or_exception)
    """
    try:
        resp = requests.post(url, json=payload, timeout=timeout_seconds)
        resp.raise_for_status()
        return True, resp
    except Exception as e:
        return False, e

def _verify_response_json(resp):
    """
    Return True if response looks valid (has 'prediction' key).
    """
    try:
        j = resp.json()
        if isinstance(j, dict) and 'prediction' in j:
            return True
        return False
    except Exception:
        return False

# Main submission logic with wake/poll handling
if submit_btn:
    payload = {
        "age": int(age),
        "businesstravel": businesstravel,
        "dailyrate": int(dailyrate),
        "department": department,
        "distancefromhome": int(distancefromhome),
        "education": str(education),
        "educationfield": educationfield,
        "environmentsatisfaction": str(environmentsatisfaction),
        "gender": gender,
        "hourlyrate": int(hourlyrate),
        "jobinvolvement": str(jobinvolvement),
        "joblevel": str(joblevel),
        "jobrole": jobrole,
        "jobsatisfaction": str(jobsatisfaction),
        "maritalstatus": maritalstatus,
        "monthlyincome": int(monthlyincome),
        "monthlyrate": int(monthlyrate),
        "numcompaniesworked": int(numcompaniesworked),
        "overtime": overtime,
        "percentsalaryhike": int(percentsalaryhike),
        "performancerating": str(performancerating),
        "relationshipsatisfaction": str(relationshipsatisfaction),
        "stockoptionlevel": int(stockoptionlevel),
        "totalworkingyears": int(totalworkingyears),
        "trainingtimeslastyear": int(trainingtimeslastyear),
        "worklifebalance": str(worklifebalance),
        "yearsatcompany": int(yearsatcompany),
        "yearsincurrentrole": int(yearsincurrentrole),
        "yearssincelastpromotion": int(yearssincelastpromotion),
        "yearswithcurrmanager": int(yearswithcurrmanager),
    }

    # Configurable parameters
    MAX_WAIT_SECONDS = 90          # how long we will poll/wait total (adjustable)
    POLL_INTERVAL_SECONDS = 5      # how often to retry
    SINGLE_TRY_TIMEOUT = 8        # timeout for each POST try

    start_time = time.time()
    deadline = start_time + MAX_WAIT_SECONDS

    # UI placeholders for progress & messages
    wake_card = st.empty()
    progress_bar = st.empty()
    progress_text = st.empty()

    # Initial immediate attempt (fast)
    wake_card.markdown(
        '<div class="card"><strong>Info</strong><div style="color:#475569">Sending request to backend — if the service is sleeping it may take up to ~1 minute to wake up.</div></div>',
        unsafe_allow_html=True
    )

    # Try once right away
    success, resp_or_exc = _post_payload_with_timeout(FASTAPI_URL, payload, timeout_seconds=SINGLE_TRY_TIMEOUT)
    verified = False
    resp = None

    if success:
        resp = resp_or_exc
        verified = _verify_response_json(resp)

    # If first try didn't succeed or not verified, enter poll loop
    if not success or not verified:
        elapsed = time.time() - start_time
        # show progress bar initial state
        progress = 0.0
        progress_bar.progress(int(progress * 100))
        while time.time() < deadline:
            remaining = int(deadline - time.time())
            # display dynamic status
            mins = remaining // 60
            secs = remaining % 60
            progress = min(1.0, (time.time() - start_time) / MAX_WAIT_SECONDS)
            progress_bar.progress(int(progress * 100))
            progress_text.markdown(
                f'<div style="margin-top:8px;color:#475569">Waking backend... approx wait left: <strong>{mins}m {secs}s</strong></div>',
                unsafe_allow_html=True
            )

            # Attempt POST again with short timeout
            success, resp_or_exc = _post_payload_with_timeout(FASTAPI_URL, payload, timeout_seconds=SINGLE_TRY_TIMEOUT)
            if success:
                resp = resp_or_exc
                if _verify_response_json(resp):
                    verified = True
                    break
                else:
                    # got a response but doesn't look valid yet, continue polling
                    verified = False
            # wait before next try (but break early if time's up)
            time_to_next = min(POLL_INTERVAL_SECONDS, max(0, deadline - time.time()))
            if time_to_next <= 0:
                break
            time.sleep(time_to_next)

    # clear progress UI
    progress_bar.empty()
    progress_text.empty()

    # After polling: check if we have a verified response
    if verified and resp is not None:
        try:
            result = resp.json()
        except Exception as e:
            result_card.markdown(
                '<div class="card"><strong style="color:#b91c1c">Error</strong><div style="color:#475569">'
                f'Failed to parse response JSON: {str(e)}'
                '</div></div>',
                unsafe_allow_html=True)
            charts_card.empty()
        else:
            # proceed with rendering result (same as before)
            pred_label = result.get("prediction", None)
            prob = result.get("probability_of_leaving", None)
            message = result.get("message", "")

            prob_pct = None
            try:
                prob_pct = float(prob)
            except Exception:
                prob_pct = None

            status_color = "#ef4444" if pred_label == 1 else "#059669"
            status_text = "AT RISK — MAY LEAVE" if pred_label == 1 else "STABLE — LIKELY TO STAY"

            result_card.markdown(
                f'''
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h2 style="margin:0;">Prediction</h2>
                            <div style="font-size:16px; color:#475569; margin-top:4px">{message}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700; font-size:18px; color:{status_color};">{status_text}</div>
                            <div style="color:#94a3b8; font-size:12px;">Model label: {pred_label}</div>
                        </div>
                    </div>
                    <hr style="margin:12px 0;">
                    <div style="display:flex; gap:16px; align-items:center;">
                        <div style="flex:1;">
                            <div style="font-size:13px; color:#64748b;">Probability of leaving</div>
                            <div style="font-weight:700; font-size:20px;">{prob_pct:.4f}</div>
                            <div style="margin-top:6px;">
                                <!-- progress bar -->
                                <progress value="{prob_pct if prob_pct is not None else 0}" max="1" style="width:100%; height:14px;"></progress>
                            </div>
                        </div>
                        <div style="width:1px; background:#eef2ff; height:64px;"></div>
                        <div style="min-width:220px;">
                            <div style="font-size:13px; color:#64748b;">Quick metrics</div>
                            <div style="display:flex; gap:8px; margin-top:8px;">
                                <div style="background:#f8fafc; padding:8px; border-radius:8px;">
                                    <div style="font-size:12px; color:#475569">Age</div>
                                    <div style="font-weight:700;">{age}</div>
                                </div>
                                <div style="background:#f8fafc; padding:8px; border-radius:8px;">
                                    <div style="font-size:12px; color:#475569">Monthly Income</div>
                                    <div style="font-weight:700;">{monthlyincome}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ''',
                unsafe_allow_html=True
            )

            numeric_df = pd.DataFrame({
                "feature": ["Age", "Monthly Income", "Total Working Years", "Years at Company"],
                "value": [age, monthlyincome, totalworkingyears, yearsatcompany]
            }).set_index("feature")

            fig1, ax1 = plt.subplots(figsize=(6, 3.6))
            numeric_df["value"].plot(kind="bar", ax=ax1)
            ax1.set_ylabel("Value")
            ax1.set_title("Key numeric attributes (single employee)")
            ax1.grid(axis="y", linestyle="--", alpha=0.3)
            plt.tight_layout()

            cats = {"OverTime": overtime, "Gender": gender, "Marital": maritalstatus}
            cat_values = [1, 1, 1]  
            fig2, ax2 = plt.subplots(figsize=(4, 3.6))
            wedges, texts = ax2.pie(cat_values, wedgeprops=dict(width=0.5), startangle=-40)
            ax2.legend(wedges, [f"{k}: {v}" for k, v in cats.items()], title="Categories", loc="center left", bbox_to_anchor=(1, 0.5))
            ax2.set_title("Categorical snapshot")
            plt.tight_layout()

            with charts_card.container():
                st.markdown('<div class="card"><strong>Visuals</strong></div>', unsafe_allow_html=True)
                c1, c2 = st.columns([1, 0.7])
                with c1:
                    st.pyplot(fig1)
                with c2:
                    st.pyplot(fig2)

            st.markdown(
                """
                <div style="margin-top:8px; color:#475569;">
                <em>Tip:</em> Use the numeric bars to quickly spot unusually high/low values for this employee. 
                If you'd like cohort-level charts (compare to peers), upload a CSV with multiple employees and I can add cohort analytics.
                </div>
                """,
                unsafe_allow_html=True
            )
    else:
        # show helpful troubleshooting info
        result_card.markdown(
            '<div class="card"><strong style="color:#b91c1c">Error</strong>'
            '<div style="color:#475569">Could not get a verified response from the backend within the allotted time (≈1 minute).<br>'
            'Possible reasons:<ul>'
            '<li>The hosting service (Render) is sleeping and did not wake in time.</li>'
            '<li>Backend error or wrong FASTAPI_URL.</li>'
            '<li>Temporary network issues.</li>'
            '</ul>'
            'Try again, or check your service logs. If you expect long cold-starts, increase the wait timeout in the app.</div></div>',
            unsafe_allow_html=True
        )
        charts_card.empty()
