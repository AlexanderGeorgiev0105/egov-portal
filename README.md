# E-Gov Portal

Full-stack e-government portal prototype built with **React (Vite)** and **Spring Boot**, using **PostgreSQL** for persistence and **Flyway** for DB migrations.

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Java + Spring Boot (Maven), Spring Data JPA
- **Database:** PostgreSQL
- **Migrations:** Flyway
- **Dev/Deploy:** Docker / Docker Compose

## Key Features
- [TODO] Authentication & authorization (e.g., roles: Citizen/Admin)
- [TODO] Service requests / applications (create, view status, history)
- [TODO] CRUD modules (documents / reports / users / services)
- [TODO] Validation + error handling
- Database schema management with Flyway migrations

## Project Structure
- `frontend/` – React (Vite) client
- `backend/` – Spring Boot REST API
- `docker/` – Docker-related files (if applicable)
- `README.md` – this file

## Getting Started

### Option A: Run with Docker (recommended)
> Use this if you have Docker Desktop installed.

1) Open terminal in the **root** folder (where `frontend/` and `backend/` are).

2) Start services:
- If you have `docker-compose.yml` in the **backend** folder:
```bash
cd backend
docker compose up --build

Open:
Backend: http://localhost:8080
Frontend: http://localhost:5173

Run locally (without Docker)

Backend (Spring Boot):
cd backend
./mvnw spring-boot:run

Frontend (React + Vite):
cd frontend
npm install
npm run dev
