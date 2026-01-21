# E-Gov Portal (Diploma Project)

Full-stack web application simulating e-government services:
citizen profile, requests, documents, reporting, etc.

## Tech Stack
- Frontend: React + Vite + React Router
- Backend: Java + Spring Boot (Maven), Spring Data JPA
- DB: PostgreSQL 16
- Migrations: Flyway
- Containerization: Docker + Docker Compose

## Features
- Authentication/authorization (describe what you implemented)
- Citizen profile / services (brief bullets)
- CRUD modules (requests, reports, documents, etc.)
- File uploads (max 25MB, request 60MB)
- Database migrations with Flyway

## Architecture
- `frontend/` - Vite React app
- `backend/` - Spring Boot REST API
- Postgres runs in Docker (port 5433 -> 5432)
- Backend runs on `http://localhost:8080`
- Frontend runs on `http://localhost:5173`

## Run with Docker (recommended)
From the `backend/` directory:

```bash
docker compose up --build

Frontend: http://localhost:5173

cd frontend
npm install
npm run dev

Backend: http://localhost:8080

cd backend
./mvnw spring-boot:run





