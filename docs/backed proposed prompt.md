# Backend Proposed Prompt

## Objective

Create a **Master Backend Implementation Plan** for the CleaniSense project.

This document will become the **single source of truth** for backend development and should be written as if it is being handed over to a team of senior backend engineers building a production-ready government civic platform.

**Do NOT generate code.**

Generate **only** a complete implementation plan.

---

# Project Overview

CleaniSense is an AI-powered environmental reporting platform that enables citizens to report pollution and environmental issues while helping municipalities verify, prioritize, resolve, and transparently communicate actions taken.

The platform is designed around one primary workflow:

```
Citizen
      ↓
Report Environmental Issue
      ↓
AI Validation (Future)
      ↓
Priority & Severity Analysis
      ↓
Municipality Review
      ↓
Resolution
      ↓
Citizen Verification
```

The backend should be designed for **long-term scalability**, even though the initial implementation will focus only on the Citizen Module.

---

# Technology Stack

Backend

- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Alembic
- Pydantic
- Firebase Authentication
- Firebase Storage (Object Storage)
- Python

Authentication

- Firebase Authentication
- Firebase ID Token Verification
- **No backend-issued JWT**

Storage

- Firebase Storage for:
  - Complaint Images
  - Resolution Images
  - Future Attachments

Database

- PostgreSQL

---

# Architectural Principles

Follow a strict layered architecture.

```
API Layer
        ↓
Service Layer
        ↓
Repository Layer
        ↓
Database
```

Rules:

- No business logic inside API routes.
- No database logic inside services.
- Repository layer only communicates with the database.
- Every service should have a single responsibility.
- Keep modules independent.
- Use dependency injection where appropriate.
- Design for maintainability over shortcuts.

---

# Required Folder Structure

Generate a scalable backend architecture including:

```
app/

api/
core/
database/
models/
schemas/
repositories/
services/
middleware/
utils/
storage/

tests/

alembic/
```

Explain the responsibility of every folder.

---

# Backend Modules

Generate implementation plans for the following modules.

---

# 1. Authentication Module

Using Firebase Authentication.

Include:

- Firebase Admin SDK initialization
- Token verification
- Current user dependency
- Protected routes
- Role verification
- Citizen/Admin authorization
- Authentication middleware
- Logout behaviour

---

# 2. User Module

Include:

- User profile
- Language preference
- Theme preference
- Notification preferences
- Account settings
- Active/Inactive users
- User roles
- Profile updates

---

# 3. Dashboard Module

Dashboard should return **one aggregated response**.

Include:

- Overview statistics
- Recent complaints
- Nearby hotspots
- Notification summary
- User preferences

Avoid multiple frontend API calls.

---

# 4. Complaint Module (Core Module)

This is the heart of the application.

Design the complete complaint lifecycle.

```
Draft

↓

Submitted

↓

AI Validation (Future)

↓

Municipality Review

↓

Assigned

↓

In Progress

↓

Resolved

↓

Rejected

↓

Archived
```

Include APIs for:

- Create Complaint
- Get Complaint
- Update Complaint
- Delete Complaint
- Complaint History
- Complaint Details
- Search
- Pagination
- Filters
- Categories
- Human-readable location
- GPS coordinates
- Complaint attachments
- Firebase Storage integration

---

# 5. Resolution Module

Include:

Government Resolution Report

- Department
- Officer/Team
- Resolution summary
- Work performed
- Completion timestamp

Evidence

- Before Image
- After Image
- Multiple evidence images

Citizen View

- Resolution report
- Timeline
- Transparency details

---

# 6. Notification Module

Support:

- Complaint submitted
- AI verification complete
- Municipality assigned
- Inspection scheduled
- Complaint resolved
- Complaint rejected

Features:

- Read
- Unread
- Mark all read
- Deep linking
- Notification history

Future Ready:

- Push Notifications
- Email Notifications

---

# 7. Hotspot Module

Include:

- Nearby hotspots
- Complaint clustering
- Severity levels
- Radius search
- Heatmap-ready response

Future architecture for:

- Environmental Risk Index
- Prediction Engine

---

# 8. File Storage Module

Design a dedicated storage service.

Use Firebase Storage.

Include:

Upload Flow

```
Citizen

↓

FastAPI

↓

Validate Image

↓

Upload to Firebase Storage

↓

Receive Public/Secure URL

↓

Store URL in PostgreSQL
```

Support:

- Complaint images
- Resolution images
- Multiple attachments

Validation:

- Allowed formats
- File size
- MIME validation

Future:

- Video uploads
- Document uploads

---

# 9. Admin Module

Architecture only.

No implementation.

Include future support for:

- Complaint Management
- User Management
- Municipality Management
- Dashboard Analytics
- Reports
- Settings

---

# 10. AI Module

Architecture only.

No implementation.

Reserve services for:

- Gemini Analysis
- OpenCV Processing
- Duplicate Detection
- Severity Analysis
- Complaint Classification
- Hotspot Detection
- Environmental Risk Index
- Prediction Engine
- Explainable AI

---

# 11. Reward Module

Architecture only.

No implementation.

Design support for:

- Impact Points
- Citizen Contribution Score
- Badges
- Reward History

No gamification or leaderboards.

---

# Database Design

Generate a complete database plan.

Include:

- Tables
- Relationships
- Primary Keys
- Foreign Keys
- UUID Strategy
- Soft Delete Strategy
- Indexes
- Audit Fields

Generate conceptual ER relationships.

---

# API Design

Generate a REST API specification.

Every endpoint should include:

- Method
- Route
- Purpose
- Authentication
- Request Body
- Response Body
- Validation Rules
- Possible Error Responses

Use REST best practices.

---

# Validation Rules

Design validation for:

- Images
- Categories
- GPS Coordinates
- Complaint title
- Complaint description
- Pagination
- Search
- Duplicate complaints
- Required fields

---

# Security

Include architecture for:

- Firebase verification
- Role authorization
- Input validation
- SQL Injection prevention
- Rate limiting
- Secure file uploads
- File validation
- CORS
- Logging
- Exception handling

---

# Standard API Response

Every endpoint should return the same response envelope.

Example:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

Include a standardized error response format as well.

---

# Dashboard Aggregation Strategy

The dashboard should never call multiple APIs.

Instead:

```
Dashboard API

↓

Dashboard Service

↓

Complaint Repository

↓

Notification Repository

↓

Hotspot Repository

↓

User Repository

↓

Aggregated Response
```

Return everything required by the dashboard in one request.

---

# Mock Server Strategy (Future)

Do NOT implement.

Design a future development-only mock server.

Requirements:

- Same API contracts
- Same response format
- Seeded mock data
- Switchable through environment variable
- Independent from production
- Useful for frontend development

---

# Future Scalability

Reserve architecture for:

- Google Cloud Storage migration (optional)
- Background Workers
- Async Task Queue
- WebSockets
- Push Notifications
- Municipality Dashboard
- AI Processing Pipeline
- Analytics Engine
- Mobile Applications

---

# Documentation

The implementation plan must include:

- Folder structure
- Module responsibilities
- API Flow diagrams
- Request lifecycle
- Service interactions
- Repository interactions
- Database interactions
- Storage flow
- Authentication flow

---

# Output Requirements

Produce a professional engineering implementation plan.

The document should be modular, scalable, and implementation-ready.

It should be detailed enough that a backend engineer can build the complete backend without needing architectural redesign later.

Avoid overengineering the MVP, but ensure every major component has a reserved architecture for future expansion.

The implementation plan should prioritize:
- Maintainability
- Scalability
- Security
- Clean Architecture
- Enterprise-grade code organization
- Government production readiness