# CCIP Phase 1 API Reference

**Status:** All 17 endpoints implemented | **Last Updated:** March 8, 2026

---

## 🔐 Authentication Routes

### 1. Google OAuth Callback
```
POST /api/auth/callback/google

Body:
{
  "email": "user@university.edu",
  "name": "John Doe",
  "picture": "https://...",
  "sub": "google_id_123"
}

Response (Success - 200):
{
  "data": {
    "userId": "uuid",
    "user": { IUser object },
    "email": "user@university.edu"
  },
  "error": null
}

Response (Error - 403 Forbidden):
{
  "data": null,
  "error": {
    "message": "Email domain must be @university.edu",
    "code": "FORBIDDEN"
  }
}
```

### 2. Logout
```
POST /api/auth/logout

Response (200):
{
  "data": { "message": "Signed out successfully" },
  "error": null
}
```

### 3. Get Current User
```
GET /api/auth/me

Headers:
Authorization: Bearer <session_token>

Response (200):
{
  "data": {
    "id": "uuid",
    "email": "user@university.edu",
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "role_id": "uuid",
    "org_id": "uuid",
    "created_at": "2026-03-08T00:00:00Z",
    "updated_at": "2026-03-08T00:00:00Z"
  },
  "error": null
}

Response (401):
{
  "data": null,
  "error": {
    "message": "Not authenticated",
    "code": "UNAUTHORIZED"
  }
}
```

---

## 📝 Content Routes

### 4. List Published Content
```
GET /api/content

Query Parameters:
(none for now, but filterable in Phase 2)

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "title": "Important Announcement",
      "body": "<html>content</html>",
      "slug": "important-announcement",
      "status": "PUBLISHED",
      "visibility": "PUBLIC",
      "author_id": "uuid",
      "created_at": "...",
      "updated_at": "...",
      "published_at": "...",
      "scheduled_at": null,
      "deleted_at": null
    }
  ],
  "error": null
}
```

### 5. Create Content
```
POST /api/content

Body:
{
  "title": "Enrollment Deadline",
  "body": "<p>Register by March 15</p>",
  "status": "DRAFT", // DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  "visibility": "ORG_ONLY", // PUBLIC | ORG_ONLY | DEPT_ONLY
  "org_ids": ["uuid1", "uuid2"],
  "scheduled_at": "2026-03-15T09:00:00Z", // optional
  "tags": ["enrollment", "deadline"] // optional
}

Response (201):
{
  "data": { IContent object },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "You do not have permission to create content",
    "code": "FORBIDDEN"
  }
}

Response (422):
{
  "data": null,
  "error": {
    "message": "Invalid content data",
    "code": "VALIDATION_ERROR"
  }
}
```

### 6. Get Content Detail
```
GET /api/content/[id]

Response (200):
{
  "data": { IContent object },
  "error": null
}

Response (404):
{
  "data": null,
  "error": {
    "message": "Content not found",
    "code": "NOT_FOUND"
  }
}
```

### 7. Update Content
```
PATCH /api/content/[id]

Body: (partial updates)
{
  "title": "New Title",
  "body": "<p>New body</p>",
  "status": "PUBLISHED"
}

Response (200):
{
  "data": { updated IContent },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "You do not have permission to edit this content",
    "code": "FORBIDDEN"
  }
}
```

### 8. Delete Content (Soft Delete)
```
DELETE /api/content/[id]

Response (200):
{
  "data": { IContent with deleted_at set },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "You do not have permission to delete this content",
    "code": "FORBIDDEN"
  }
}
```

---

## 👥 User Routes

### 9. List All Users (Admin Only)
```
GET /api/users

Response (200):
{
  "data": [
    { IUser object },
    { IUser object }
  ],
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "Only admins can view all users",
    "code": "FORBIDDEN"
  }
}
```

### 10. Get User Profile
```
GET /api/users/[id]

Response (200):
{
  "data": { IUser object },
  "error": null
}
```

### 11. Update User Profile or Role
```
PATCH /api/users/[id]

For updating own profile:
{
  "display_name": "New Name",
  "avatar_url": "https://..."
}

For assigning role (admin only):
{
  "role_id": "uuid"
}

Response (200):
{
  "data": { updated IUser },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "Only admins can assign roles",
    "code": "FORBIDDEN"
  }
}
```

---

## 🏢 Organization Routes

### 12. List Organizations
```
GET /api/organizations?type=UNIVERSITY

Query Parameters:
type: (optional) "UNIVERSITY" | "SCHOOL" | "DEPARTMENT"

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "name": "College of Engineering",
      "slug": "college-of-engineering",
      "type": "SCHOOL",
      "parent_id": "uuid",
      "created_at": "..."
    }
  ],
  "error": null
}
```

### 13. Create Organization (Admin Only)
```
POST /api/organizations

Body:
{
  "name": "Computer Science Department",
  "type": "DEPARTMENT", // UNIVERSITY | SCHOOL | DEPARTMENT
  "parent_id": "uuid" // optional
}

Response (201):
{
  "data": { IOrganization object },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "Only admins can create organizations",
    "code": "FORBIDDEN"
  }
}
```

### 14. Get Organization Detail
```
GET /api/organizations/[id]?hierarchy=true

Query Parameters:
hierarchy: (optional) "true" to include parent and children

Response (200) - Without hierarchy:
{
  "data": { IOrganization },
  "error": null
}

Response (200) - With hierarchy:
{
  "data": {
    "org": { IOrganization },
    "parent": { IOrganization } | null,
    "children": [{ IOrganization }, ...]
  },
  "error": null
}
```

### 15. Update Organization (Admin Only)
```
PATCH /api/organizations/[id]

Body:
{
  "name": "New Name",
  "parent_id": "uuid"
}

Response (200):
{
  "data": { updated IOrganization },
  "error": null
}

Response (403):
{
  "data": null,
  "error": {
    "message": "Only admins can update organizations",
    "code": "FORBIDDEN"
  }
}
```

---

## 🎯 Roles Routes

### 16. List All Roles
```
GET /api/roles

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "name": "STUDENT",
      "created_at": "..."
    },
    {
      "id": "uuid",
      "name": "DEPT_EDITOR",
      "created_at": "..."
    },
    {
      "id": "uuid",
      "name": "UNIVERSITY_EDITOR",
      "created_at": "..."
    },
    {
      "id": "uuid",
      "name": "SUPER_ADMIN",
      "created_at": "..."
    }
  ],
  "error": null
}
```

---

## 📊 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error |
| 500 | Server Error | Unexpected error |

---

## 🔐 Permission Rules

### Creating Content
- ✅ DEPT_EDITOR
- ✅ UNIVERSITY_EDITOR
- ✅ SUPER_ADMIN
- ❌ STUDENT

### Editing Content
- ✅ Own content: DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN
- ✅ Any content: SUPER_ADMIN only
- ❌ STUDENT

### Deleting Content
- ✅ Own content: DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN
- ✅ Any content: SUPER_ADMIN only
- ❌ STUDENT

### Managing Users
- ✅ SUPER_ADMIN only

### Managing Organizations
- ✅ SUPER_ADMIN only

### Listing Users
- ✅ SUPER_ADMIN only

---

## 🧪 Testing the API

### Using cURL
```bash
# Get published content
curl -X GET http://localhost:3000/api/content

# Get current user (requires auth cookie)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: your-session-cookie"

# Create content (requires auth)
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test",
    "body": "Test body",
    "status": "DRAFT",
    "visibility": "PUBLIC",
    "org_ids": ["uuid"]
  }'
```

### Using Postman
1. Import the base URL: `http://localhost:3000/api`
2. Set up a collection with each endpoint
3. After login, Supabase will set a cookie that Postman should automatically include
4. Test each endpoint with different roles

---

## 🐛 Common Errors

### "Not authenticated"
→ No valid session cookie. User needs to log in via Google OAuth.

### "You do not have permission"
→ User's role doesn't allow this action. Check permission rules above.

### "Email domain must be..."
→ User tried to sign up with wrong email domain. Use institutional email.

### "Content not found"
→ Resource ID doesn't exist or was deleted. Check the ID is correct.

### "Invalid content data"
→ Request body failed Zod validation. Check required fields and types.

---

*CCIP Phase 1 API Reference | Complete | All 17 endpoints documented*
