# PromathsBridge

**PromathsBridge** is a mentorship management platform built for the Promaths program.  
This system is developed and maintained by **The X-Axis**, the foundational engineering team of the company.

> The X-Axis represents the baseline upon which all future systems, teams, and growth of the company will be built.

---

## 🚀 Tech Stack

### Frontend
- HTML
- Tailwind CSS
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Authentication
- Firebase Authentication

### Database
- MongoDB (via Mongoose)

### Testing
- Jest

### Deployment
- Render

### Version Control
- Git & GitHub

---

## 📁 Project Structure

root/
│
├── public/ # All frontend code
│ ├── pages/
│ │ ├── admin/ # Admin-side HTML pages
│ │ └── client/ # Client-side HTML pages
│ │
│ ├── scripts/
│ │ ├── admin/ # Admin-side JS logic
│ │ └── client/ # Client-side JS logic
│ │
│ └── styles/ # Global & page-specific styles
│
├── controllers/ # Express controllers
├── models/ # Mongoose models
├── routes/ # API routes
├── config/ # Firebase, DB, env configuration
│
├── docs/ # Feature documentation
│
├── tests/ # Jest tests
│
├── app.js # Express app setup
├── server.js # Server bootstrap
└── README.md



---

## 🌐 Page Serving Architecture

- **All HTML files are served from the backend**
- The frontend does **not** hardcode routing logic
- Admin pages and tabs are dynamically loaded via backend routes
- This keeps routing secure, centralized, and scalable

---

## 🔐 Authentication & Authorization

- Authentication is handled using **Firebase Authentication**
- After login, the Firebase ID token is:
  - Stored in `localStorage`
  - Sent with **every protected request** via the `Authorization` header

Example:



🚨 **Important**
- **ALL routes are protected**
- If a token is missing or invalid, the backend will reject the request
- Frontend developers must **always include the token** when calling APIs

---

## 🔀 Git Workflow Rules (STRICT)

We follow a **feature-branch workflow**.

### Branches
- `production` (main) – live system
- `staging` – pre-release testing
- `development` – integration branch
- `feature/*` – all development work

### Rules
1. **Always create a `feature/*` branch**
feature/admin-auth
feature/applications-form


2. **Always pull from `development` before starting work**
```bash
git checkout development
git pull origin development
```

❌ NEVER push directly to:

development

staging

production (main)

✅ All work must be submitted via Pull Request

PR → development

PRs must be reviewed and approved before merge

Only designated maintainers can merge PRs


🧾 Documentation Rules

Every feature must be documented

Documentation lives in the docs/ folder

Use README.md files for documentation

Each feature document should explain:

What the feature does

How it works (high-level)

Any assumptions or edge cases

How to test it

📌 If it’s not documented, it’s not finished.



🧪 Testing

Jest is used for testing backend logic

Tests should be added where applicable

Features should not break existing tests


👥 Team

Team Name: The X-Axis
Role: Foundational Engineering Team

The X-Axis is responsible for building the core systems, architecture, and engineering standards that all future teams will build upon.

This project — PromathsBridge — is the first system developed under this vision.


✅ Final Notes

Keep code clean and readable

Communicate early if you’re blocked

Follow the workflow strictly

Build with the future in mind


## ▶️ Running the Node.js Application (Local Development)

Follow these steps to run the PromathsBridge system locally.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd promathsbridge

2. Install Dependencies

npm install

3. Environment Variables

Create a .env file in the root directory and add the required environment variables.

Example:

PORT=3000
MONGO_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

⚠️ Never commit the .env file
It is intentionally excluded from version control.
4. Start the Server

npm run dev

or (if not using nodemon):

npm start

You should see:

Server running on port 3000

5. Access the Application

    Login page:

http://localhost:3000/login

    Admin dashboard:

http://localhost:3000/admin

    Health check:

http://localhost:3000/health

6. Authentication Requirement

Most routes require authentication.

After logging in:

    A Firebase auth token is stored in localStorage

    The token must be sent in every protected request using:

Authorization: Bearer <token>

If a route fails to load:

    Check that the token exists

    Check that it is being sent correctly