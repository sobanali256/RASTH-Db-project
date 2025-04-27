# RASTH Backend Server

## Database Connection
The backend connects to AWS RDS MySQL database with the following configuration:
- Host: database-1.c1yuys0g6rjh.eu-north-1.rds.amazonaws.com
- Port: 3306
- Username: admin

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will run on port 3001 by default.

## Database Schema

### Users Table
- id (Primary Key)
- firstName
- lastName
- email (Unique)
- password (Hashed)
- phone
- userType (patient/doctor/admin)
- createdAt

### Patients Table
- id (Primary Key)
- userId (Foreign Key)
- dateOfBirth
- address
- medicalHistory

### Doctors Table
- id (Primary Key)
- userId (Foreign Key)
- specialization
- licenseNumber
- hospital
- experience
- education
- status (pending/active/inactive)

## API Endpoints

### POST /api/register
Registers a new user (patient or doctor)

### POST /api/login
Authenticate user and return JWT token