# Software Requirements Specification (SRS)

# CleaniSense

### Hyperlocal Community Pollution Monitoring & Hotspot Detection Platform

**Version:** 1.0

**Date:** July 2026

---

# 1. Introduction

## 1.1 Purpose

The purpose of CleaniSense is to provide a hyperlocal pollution monitoring platform that enables citizens to report localized pollution incidents such as garbage accumulation, open waste burning, smoke emissions, construction dust, and other environmental hazards.

The system combines citizen reports, image analysis, weather conditions, air quality information, and geospatial clustering to identify pollution hotspots, estimate their severity, predict their progression over the next 24 hours, and assist municipal authorities in prioritizing response efforts.

Unlike conventional city-level AQI systems, CleaniSense focuses on neighbourhood-scale environmental monitoring through community participation.

---

## 1.2 Scope

CleaniSense is a web and mobile-based application consisting of two major interfaces:

### Citizen Portal

Allows residents to:

- Register/Login
- Report pollution incidents
- Upload images
- Fill a guided survey
- View complaint status
- View nearby pollution hotspots

### Municipal Dashboard

Allows authorities to:

- View live pollution maps
- Analyze complaint clusters
- Prioritize hotspots
- Monitor complaint trends
- Receive alerts for critical zones
- View prediction reports

The platform emphasizes low-cost deployment by utilizing free and open-source technologies wherever possible.

---

## 1.3 Intended Users

- Citizens
- Municipal Corporations
- Pollution Control Boards
- Environmental NGOs
- Local Administrative Authorities

---

## 1.4 Definitions

| Term | Description |
| --- | --- |
| Complaint | A pollution report submitted by a citizen |
| Hotspot | A geographic cluster of pollution complaints |
| Severity Score | Numerical estimate representing pollution intensity |
| Prediction Score | Estimated risk of pollution worsening within 24 hours |
| Image Severity | Pollution estimate derived from image analysis |
| Cluster | Group of nearby complaints |

---

# 2. Overall Description

## 2.1 Product Perspective

CleaniSense acts as an intelligent pollution reporting and monitoring platform.

Instead of relying solely on expensive monitoring stations, the system crowdsources environmental information from citizens while validating reports using computer vision techniques.

The backend continuously aggregates reports to generate real-time pollution intelligence.

---

## 2.2 Product Objectives

The platform should:

- Enable easy pollution reporting.
- Detect pollution using uploaded images.
- Generate pollution severity scores.
- Identify pollution hotspots.
- Forecast hotspot escalation.
- Help authorities prioritize responses.
- Increase citizen participation.

---

## 2.3 Assumptions

- Users possess smartphones with GPS.
- Internet connectivity is available.
- Weather APIs remain operational.
- Citizens provide genuine reports.
- Images are captured at the reported location.

---

# 3. System Architecture

```
Citizen

     │
     ▼

Web / Mobile Application

     │

Upload Complaint
Image + Survey + GPS

     │

Backend Server

     │
     ├───────────────┐
     │               │
     ▼               ▼

Image Processing   Gemini Vision

     │               │
     └──────┬────────┘

            ▼

Severity Calculation

            ▼

Weather + AQI APIs

            ▼

Hotspot Detection

            ▼

Prediction Engine

            ▼

Database

            ▼

Municipal Dashboard
```

---

# 4. Functional Requirements

## FR-1 User Registration

Users shall be able to:

- Register
- Login
- Logout
- Reset Password

---

## FR-2 Complaint Submission

Users shall submit:

- Image
- Pollution category
- GPS location
- Area affected
- Population affected
- Duration
- Additional notes

---

## FR-3 Automatic Image Analysis

The system shall process uploaded images using:

### OpenCV

- Smoke detection
- Dust estimation
- Garbage segmentation
- Color analysis
- Texture analysis
- Morphological filtering

### Gemini Vision (Hybrid Verification)

Gemini Vision will:

- Verify pollution type
- Classify uncertain images
- Generate confidence scores
- Produce a short environmental description

The final classification will combine OpenCV outputs with Gemini Vision analysis to improve robustness while minimizing AI usage.

---

## FR-4 Weather Collection

The system shall fetch:

- Temperature
- Humidity
- Wind Speed
- Wind Direction
- Rain Probability

---

## FR-5 Air Quality Collection

Retrieve:

- AQI
- PM2.5
- PM10
- NO₂
- SO₂
- CO

using public datasets/APIs.

---

## FR-6 Severity Estimation

Severity shall be calculated using:

Image Features

- 

Gemini Confidence

- 

Survey Responses

- 

Weather

- 

Nearby Complaints

Example:

Severity Score

= 35% Image Processing

- 20% Gemini Vision
- 20% Survey
- 15% Weather
- 10% Complaint Density

Categories:

- Normal
- Moderate
- High
- Critical

---

## FR-7 Hotspot Detection

The system shall:

- Cluster nearby complaints
- Merge overlapping reports
- Generate hotspot boundaries
- Calculate hotspot severity

Algorithms:

- DBSCAN
- HDBSCAN

---

## FR-8 Prediction Engine

The system predicts:

- Pollution persistence
- Pollution spread
- Escalation probability
- Risk category for next 24 hours

Inputs:

- Weather forecast
- Complaint growth
- Historical complaints
- Existing hotspot severity

Outputs:

- Stable
- Moderate Risk
- High Risk
- Critical

---

## FR-9 Municipal Dashboard

Dashboard shall display:

- Interactive pollution map
- Complaint list
- Heatmaps
- Severity
- Predictions
- Analytics
- Historical trends

---

## FR-10 Notifications

Critical hotspots shall trigger notifications to municipal authorities.

---

# 5. Non-Functional Requirements

## Performance

- Complaint submission < 5 seconds
- Dashboard loading < 3 seconds
- Prediction generation < 10 seconds

---

## Availability

Target uptime:

99%

---

## Scalability

Support:

- 10,000 users
- 100,000 complaints
- Real-time clustering

---

## Security

- HTTPS
- JWT Authentication
- Password hashing
- Firebase Authentication

---

## Reliability

Duplicate complaints should be automatically merged into nearby clusters.

---

## Maintainability

Architecture should follow modular microservice principles.

---

## Usability

Citizen complaint submission should require less than one minute.

# 6. System Modules

## Module 1

Authentication

---

## Module 2

Complaint Management

Functions:

- Create complaint
- Edit complaint
- Delete complaint
- Track complaint

---

## Module 3

Image Analysis Engine

Pipeline

Image

↓

Preprocessing

↓

OpenCV Feature Extraction

↓

Gemini Vision Verification

↓

Severity Features

---

## Module 4

Weather Service

Collects:

- Wind
- Humidity
- AQI
- Forecast

---

## Module 5

Severity Calculator

Combines all features into a pollution score.

---

## Module 6

Hotspot Detection

Uses clustering algorithms.

Outputs:

- Cluster centroid
- Radius
- Severity
- Complaint count

---

## Module 7

Prediction Engine

Machine learning model predicting hotspot escalation.

Possible models:

- Random Forest
- Gradient Boosting
- XGBoost (optional)

---

## Module 8

Dashboard

Visualization

Analytics

Heatmaps

Filters

Reports

---

# 7. Database Design

## Users

- User ID
- Name
- Email
- Phone
- Password Hash

---

## Complaints

- Complaint ID
- User ID
- Image URL
- Latitude
- Longitude
- Timestamp
- Pollution Type
- Survey Data
- OpenCV Score
- Gemini Score
- Severity Score

---

## Weather

- Complaint ID
- Temperature
- Humidity
- AQI
- Wind Speed
- Forecast

---

## Hotspots

- Cluster ID
- Center Latitude
- Center Longitude
- Radius
- Complaint Count
- Severity
- Prediction

---

# 8. External APIs

## Weather

Open-Meteo API

---

## AQI

OpenAQ

or

CPCB datasets

---

## Maps

OpenStreetMap

Leaflet

---

## AI

Gemini Vision API (Free Tier)

---

# 9. Technology Stack

Frontend

- React
- Flutter (optional)

Backend

- Node.js
- Express.js

Database

- Firebase Firestore

Authentication

- Firebase Auth

Storage

- Firebase Storage

Maps

- Leaflet
- OpenStreetMap

Image Processing

- OpenCV

AI

- Gemini Vision

Machine Learning

- Scikit-Learn

Deployment

- Vercel
- Render

---

# 10. User Workflow

Citizen

↓

Login

↓

Capture Image

↓

Fill Survey

↓

Submit Complaint

↓

OpenCV Analysis

↓

Gemini Verification

↓

Weather Collection

↓

Severity Calculation

↓

Hotspot Clustering

↓

Prediction Engine

↓

Municipal Dashboard

↓

Authority Response

---

# 11. Future Enhancements

- Satellite imagery integration (Google Earth Engine)
- IoT sensor integration
- Live CCTV pollution monitoring
- WhatsApp-based complaint submission
- Voice complaint registration
- Multilingual support
- Automatic duplicate image detection
- Citizen reputation scoring
- AI-generated municipal response recommendations
- Predictive pollution spread simulation using wind vectors

---

# 12. Success Metrics

The project will be considered successful if it achieves the following objectives:

- Complaint submission completed in under one minute.
- Automatic pollution classification accuracy greater than 85%.
- Reliable hotspot detection through complaint clustering.
- Prediction of hotspot escalation for the next 24 hours with useful operational accuracy.
- Interactive dashboard capable of displaying live complaints and hotspot severity.
- Entire system deployable using free-tier services and open-source technologies.

---

# 13. Constraints

- The solution must rely primarily on free-tier and open-source resources.
- Gemini Vision usage should be minimized through a hybrid OpenCV-first approach to reduce API consumption.
- Satellite imagery is considered an optional future enhancement due to limited update frequency and integration complexity.
- Predictions are based on reported incidents and environmental context rather than dense sensor networks, making them indicative rather than authoritative.

---

# 14. Conclusion

CleaniSense provides a scalable, low-cost, and community-driven solution for hyperlocal pollution monitoring. By combining citizen participation, classical computer vision, selective AI verification using Gemini Vision, environmental data, and geospatial analytics, the platform enables municipalities to detect hidden pollution hotspots, prioritize interventions, and proactively respond to emerging environmental hazards. The modular architecture ensures future extensibility while remaining feasible for rapid development during a hackathon using entirely free-tier technologies.