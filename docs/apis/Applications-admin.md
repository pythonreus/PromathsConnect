# Applications API - Admin Only

**Base URL:** `/api/applications`

This API handles **admin management** of submitted applications.
---
## Endpoints
### 1. Get Paginated Applications (Admin Only)

**GET** `/api/applications/`
**Accessible only to admins.**

Query Parameters

| Parameter | Default | Description |
|:-----------:|:---------:|:-------------|
| `page` | `1` | Page number for pagination |

**Headers**

| Header | Value | Required | Description |
|:--------:|:-------:|:----------:|:-------------|
| `Authorization` | `Bearer <Firebase ID Token>` | ✅ Required | Firebase authentication token |
| `Content-Type` | `application/json` | ❌ Optional | Only if request has body |

#### Success Response

**Status Code:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "63f1b9c2a8d9f72a12345678",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "0712345678",
      "yearOfStudy": "3",
      "faculty": "Engineering",
      "position": "tutor",
      "motivation": "I want to contribute...",
      "impactIdeas": "Optional impact ideas",
      "tutorModules": ["Module1", "Module2"],
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50,
    "perPage": 10
  }
}
```

**Error Responses**

403 Forbidden – Not an admin

500 Internal Server Error – Server/database failure
---
### 2. Get Application by ID (Admin Only)

**GET** `/api/applications/:id`
**Accessible only to admins.**

| Parameter | Type | Required | Description |
|:-----------:|:------:|:----------:|:-------------|
| `id` | string | ✅ Required | Application ObjectId (24-character hex string) |

###  Example Request
```http
GET /api/applications/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```
### Headers

| Header | Value | Required | Description |
|:--------:|:-------:|:----------:|:-------------|
| `Authorization` | `Bearer <Firebase ID Token>` | ✅ Required | Firebase authentication token |
| `Content-Type` | `application/json` | ❌ Optional | Only if request has body |

### Success Response

**Status Code:** `200 OK`
```json
{
  "success": true,
  "application": {
    "_id": "63f1b9c2a8d9f72a12345678",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "0712345678",
    "yearOfStudy": "3",
    "faculty": "Engineering",
    "position": "Team Member",
    "motivation": "I want to contribute...",
    "impactIdeas": "Optional impact ideas",
    "tutorModules": ["Module1", "Module2"],
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
}
```

 **Error Responses**

400 Bad Request – Invalid application ID

403 Forbidden – Not an admin

404 Not Found – Application not found

500 Internal Server Error – Server/database failure
---
**Frontend Example (Using fetch)**

```Javascript
async function submitApplication(applicationData) {
  const token = await firebase.auth().currentUser.getIdToken();

  const response = await fetch("/api/applications/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(applicationData)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to submit application");
  }

  return await response.json();
}
```
**Notes**

- Client submission only requires Firebase authentication (verifyAuthToken).

- Admin endpoints require requireAdmin middleware.

- Email is normalized to lowercase and duplicate submissions are prevented.

- Pagination defaults to 10 items per page.

- **Always include the Authorization header with a valid Firebase ID token**