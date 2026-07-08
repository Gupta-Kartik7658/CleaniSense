# CleaniSense Documentation

This folder contains the engineering requirements, software design specifications, architectural designs, API schemas, and development progress logs.

## Table of Contents

1. [Software Requirements Specification (SRS)](Software%20Requirements%20Specification%20(SRS)%20390661850045808b8456ee0eed494d67.md)
2. [Backend Implementation Plan](backend-implementation-plan.md)
3. [Backend API Documentation](backend_api_docs.md)
4. [AI Development Progress Log](progress.md)
5. [Frontend-Backend Integration Guide](frontend_backend_integration_prompt.md)
6. [Municipal Dashboard API Guide](municipal_api_docs.md)
7. [API Connectivity Audit](api_connection_audit.md)

## Latest Implementation Snapshot

As of 2026-07-08, the implementation includes:

- Gemini-assisted image verification with server-side API key configuration.
- SRS weighted severity scoring with image, Gemini confidence, survey, weather/AQI, and nearby complaint density components.
- Open-Meteo weather and air-quality ingestion without an API key.
- Generated hotspot clusters persisted from unresolved complaint density, with critical hotspot notifications.
- Superadmin-only role management by email.
- Citizen complaint survey fields for area affected, people affected, duration, and severity hints.
- Firebase password reset UI.
- Deployment-ready external dependencies: PostgreSQL `DATABASE_URL`, Supabase/Firebase object storage, Firebase credentials from env, and DB-backed admin settings.

The Prediction Engine remains intentionally deferred.
