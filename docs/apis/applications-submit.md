# Applications API -Submmitting an application
This API handles **client application submissions**.
### 1. Create a New Application

**POST** `/api/applications/`  
**Accessible to authenticated users only.**

**Headers**
| Name | Value | Required |
|:------:|:-------:|:----------|
| Authorization | Bearer &lt;Firebase ID Token&gt; | ✅ required |
| Content-Type | application/json | ✅ required |

**Body**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "0712345678",
  "yearOfStudy": "3",
  "faculty": "Engineering",
  "position": "tutor",
  "motivation": "I want to contribute...",
  "impactIdeas": "Optional impact ideas",
  "tutorModules": ["Module1", "Module2"]
}
```

**Success Response**

**Status Code:** `201 CREATED`
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "application": {
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
}
```

**Error Responses**

400 Bad Request – Missing required fields

409 Conflict – Application already submitted for this email

500 Internal Server Error – Server/database failure
---

**Frontend Example (Using fetch)**
```javascript
async function fetchApplications(page = 1) {
  const token = await firebase.auth().currentUser.getIdToken();

  const response = await fetch(`/api/applications/?page=${page}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to fetch applications");
  }

  return await response.json();
}
```