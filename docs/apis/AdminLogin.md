# Admin Login API
## Endpoint
**POST** `POST /api/system/admin-login`

## Purpose

Authenticates an admin user using a Firebase ID token and initializes or updates the admin user in the backend database.

This endpoint:

Verifies the Firebase authentication token

Confirms the user is whitelisted as an admin

Creates the admin user on first login

Updates `lastLogin` on subsequent logins
---
# Authentication

**Required:** Firebase ID Token

**Header**
Authorization: Bearer <FIREBASE_ID_TOKEN>

## Request
### Method
`POST`

## Headers
| Name | Value | Required |
|------|-------|----------|
| `Authorization` | `Bearer <Firebase ID Token>` | ✅ |
| `Content-Type` | `application/json` | ❌ (no body required) |

### Body
❌ No request body required
---

## Response
### Success (Admin Login)

**Status Code:** `200 OK`


**Response Body**
``` Json
{
  "message": "Admin login successful",
  "user": {
    "firebaseid": "fhgakjhsgheyugwiueghfuw",
    "email": "admin@example.com",
    "fullName": "Kgadi Selepe",
    "role": "admin"
  }
} 
``` 


- If the admin user does not exist, they are created automatically

- If the admin user exists, lastLogin is updated

### Errors
| HTTP Status | Error Code | Error Message | Description |
|:-------------:|:------------:|:---------------:|:-------------|
| 401 | N/A | `No token provided` | Missing Authorization header |
| 401 | N/A | `Invalid or expired token` | Firebase token invalid or expired |
| 403 | N/A | `Email not authorized` | Email not in preloaded whitelist |
| 403 | N/A | `Admin access required` | User is not an admin |
| 500 | N/A | `Failed to complete admin login` | Database or server error |
---
## Frontend Usage Example (Using fetch)

```javascript
import { getAuth } from "firebase/auth";

const auth = getAuth();

async function adminLogin() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  const response = await fetch("/api/system/admin-login", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw {
      status: response.status,
      message: errorData.message
    };
  }

  return await response.json();
}
```

## Error Handling Example
```javascript
try {
  const result = await adminLogin();
  console.log("Admin logged in:", result.user);
} catch (err) {
  if (err.status === 401) {
    alert("Session expired. Please log in again.");
  } else if (err.status === 403) {
    alert("You do not have admin access.");
  } else {
    alert("Admin login failed. Please try again later.");
  }
}
```
---

## Notes

- Firebase login must happen before calling this endpoint

- This endpoint does not accept email/password

- **Always include the Authorization header with a valid Firebase ID token**

- Tokens are automatically refreshed by Firebase if needed
---