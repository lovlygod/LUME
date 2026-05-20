# LUME API Documentation

Full documentation for all LUME API endpoints.

**Base URL:** `http://localhost:5000/api`

**Swagger UI:** `http://localhost:5000/api-docs`

---

## 🔐 Authentication

All requests (except `/login`, `/register`) require:
- **Cookie:** `token` (httpOnly)
- **Header:** `X-CSRF-Token`
- **Header:** `Authorization: Bearer <token>` (optional)

---

## 📑 Table of Contents

- [Auth](#auth)
- [Users](#users)
- [Posts](#posts)
- [Messages](#messages)
- [groups](#groups)
- [Verification](#verification)
- [Admin](#admin)
- [Uploads](#uploads)
- [Errors](#errors)
- [Notifications](#notifications)
- [WebSocket Events](#websocket-events)
- [Workspaces](#workspaces)
- [Projects](#projects)
- [Tasks](#tasks)
- [Explore](#explore)
- [Related Documents](#related-documents)

---

## Auth

### POST `/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "verified": false
  }
}
```

**Cookies:**
- `refreshToken` (httpOnly, 30 days)
- `token` (httpOnly, 24 hours)

**Errors:**
- `400` - Validation error (email format, password length, username format)
- `409` - Email already exists

---

### POST `/login`
Sign in.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "...",
    "avatar": "...",
    "banner": "...",
    "verified": false
  }
}
```

**Cookies:**
- `refreshToken` (httpOnly, 30 days)
- `token` (httpOnly, 24 hours)

**Errors:**
- `401` - Invalid credentials

---

### POST `/refresh`
Refresh access token.

**Cookies:** `refreshToken`

**Response 200:**
```json
{
  "token": "new access token"
}
```

**Cookies:**
- `token` (refreshed, 24 hours)

**Errors:**
- `401` - Invalid or expired refresh token

---

### POST `/logout`
Sign out.

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies:** `refreshToken` and `token` are cleared

---

## Users

### GET `/profile`
Get current user profile.

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Hello!",
    "avatar": "https://res.cloudinary.com/dbmpcpvrr/image/upload/...",
    "banner": "https://res.cloudinary.com/dbmpcpvrr/image/upload/...",
    "verified": false,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "followersCount": 42,
    "city": "Moscow",
    "website": "https://example.com"
  }
}
```

---

### GET `/profile/:userId`
Get another user profile.

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Hello!",
    "avatar": "...",
    "banner": "...",
    "verified": false,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "followersCount": 42
  }
}
```

---

### PUT `/profile`
Update profile.

**Body:**
```json
{
  "name": "New Name",
  "username": "newusername",
  "bio": "Updated bio",
  "city": "Saint Petersburg",
  "website": "https://newsite.com"
}
```

**Response 200:**
```json
{
  "message": "Profile updated successfully"
}
```

---

### POST `/profile/avatar`
Upload avatar.

**Content-Type:** `multipart/form-data`

**Body:**
- `avatar`: file (image/jpeg, png, gif, webp, max 25MB)

**Response 200:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar": "https://res.cloudinary.com/dbmpcpvrr/image/upload/..."
}
```

---

### POST `/profile/banner`
Upload banner.

**Content-Type:** `multipart/form-data`

**Body:**
- `banner`: file (image/jpeg, png, gif, webp, max 25MB)

**Response 200:**
```json
{
  "message": "Banner uploaded successfully",
  "banner": "https://res.cloudinary.com/dbmpcpvrr/image/upload/..."
}
```

---

### DELETE `/profile`
Delete account.

**Body:**
```json
{
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Account deleted permanently"
}
```

**Errors:**
- `400` - Password is required
- `401` - Invalid password

---

## Posts

### GET `/posts`
Get feed posts.

**Response 200:**
```json
{
  "posts": [
    {
      "id": "1",
      "userId": "1",
      "text": "Hello world!",
      "imageUrl": "https://res.cloudinary.com/dbmpcpvrr/image/upload/...",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "replies": 5,
      "reposts": 2,
      "resonance": 10,
      "author": {
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      }
    }
  ]
}
```

---

### GET `/posts/recommended`
Popular posts (last 7 days).

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### GET `/posts/following`
Posts from users you follow.

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### GET `/users/:userId/posts`
Posts by a specific user.

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### POST `/posts`
Create a post.

**Content-Type:** `application/json` or `multipart/form-data`

**Body (JSON):**
```json
{
  "text": "My new post"
}
```

**Body (FormData):**
- `text`: string (max 420 chars)
- `image`: file (optional)

**Response 201:**
```json
{
  "message": "Post created successfully",
  "postId": 1,
  "post": { ... }
}
```

**Errors:**
- `400` - Text too long (>420 chars)

---

### DELETE `/posts/:postId`
Delete a post.

**Response 200:**
```json
{
  "message": "Post deleted successfully"
}
```

**Errors:**
- `403` - Not your post
- `404` - Post not found

---

### POST `/posts/:postId/resonance`
Toggle like (Resonance).

**Response 200:**
```json
{
  "message": "Post resonated",
  "resonance": 11,
  "liked": true
}
```

---

### GET `/posts/:postId/comments`
Get post comments.

**Response 200:**
```json
{
  "comments": [
    {
      "id": 1,
      "userId": "1",
      "text": "Great post!",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "name": "John Doe",
      "username": "johndoe",
      "avatar": "...",
      "verified": false
    }
  ]
}
```

---

### POST `/posts/:postId/comments`
Add a comment.

**Body:**
```json
{
  "text": "Great post!"
}
```

**Response 201:**
```json
{
  "message": "Comment added",
  "commentId": 1,
  "comment": { ... }
}
```

---

### POST `/posts/:postId/report`
Report a post.

**Body:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response 201:**
```json
{
  "message": "Report submitted",
  "reportId": 1
}
```

---

## Messages

### GET `/messages`
Get chat list.

**Response 200:**
```json
{
  "chats": [
    {
      "id": "1",
      "userId": "2",
      "name": "Jane Doe",
      "username": "janedoe",
      "avatar": "...",
      "verified": false,
      "lastMessage": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "unread": 3
    }
  ]
}
```

---

### GET `/messages/:userId`
Get message history with a user.

**Response 200:**
```json
{
  "messages": [
    {
      "id": "1",
      "senderId": "2",
      "text": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "own": false,
      "attachments": [],
      "deletedForMe": false,
      "deletedForAll": false
    }
  ]
}
```

---

### POST `/messages`
Send a message.

**Body:**
```json
{
  "receiverId": "2",
  "text": "Hello!",
  "attachmentIds": ["1", "2"]
}
```

**Response 201:**
```json
{
  "message": "Message sent",
  "messageId": 1,
  "attachments": [...]
}
```

---

### DELETE `/messages/:messageId?scope=me|all`
Delete a message.

**Query Parameters:**
- `scope`: `me` (for yourself) or `all` (for everyone, only within 15 minutes)

**Response 200:**
```json
{
  "message": "Message deleted"
}
```

---

### POST `/chats/:chatId/messages/bulk-delete`
Delete multiple messages at once.

**Request Body:**
```json
{
  "messageIds": ["1", "2", "3"],
  "scope": "me" | "all"
}
```

**Query Parameters:**
- `chatId`: Chat ID
- `scope`: `me` (for yourself) or `all` (for everyone, only own messages)

**Response 200:**
```json
{
  "message": "Messages deleted"
}
```

**Notes:**
- Maximum 100 messages per operation
- For `scope=all`: only author's messages can be deleted for everyone
- PostgreSQL uses `ANY($1::bigint[])` for IN clause with proper type casting

---

### GET `/messages/search`
Full-text message search (Meilisearch).

**Query Parameters:**
- `q`: search query (required)
- `limit`: max number of results (optional, default 50)

**Features:**
- Fuzzy search (automatic typo correction)
- Partial match (search by word part)
- Sort by date (newest first)
- Restriction: only chats where the user is a participant

**Response 200:**
```json
{
  "query": "hello",
  "results": [
    {
      "id": "123",
      "text": "Hello! How are you?",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "chatId": "45",
      "user": {
        "id": "2",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      },
      "contact": {
        "id": "1",
        "name": "Jane Doe",
        "username": "janedoe",
        "avatar": "...",
        "verified": true
      }
    }
  ],
  "total": 1
}
```

**Errors:**
- `400` - Search query "q" is required

---

### POST `/chats/:chatId/read`
Mark chat as read.

**Body:**
```json
{
  "lastReadMessageId": "123"
}
```

**Response 200:**
```json
{
  "message": "Chat marked as read"
}
```

---

### GET `/chats/:chatId/read-status`
Get read status.

**Response 200:**
```json
{
  "chatId": "1",
  "userId": "2",
  "lastReadMessageId": "100"
}
```

---

## groups

### POST `/groups`
Create a group.

**Content-Type:** `multipart/form-data`

**Body:**
- `name`: string (required)
- `username`: string (min 5 chars, for public)
- `type`: `public` or `private`
- `description`: string (optional)
- `icon`: file (optional, image)

**Response 201:**
```json
{
  "message": "group created successfully",
  "group": {
    "id": 1,
    "name": "Gaming Hub",
    "username": "gaminghub",
    "type": "public",
    "description": "...",
    "iconUrl": "...",
    "ownerId": 1
  }
}
```

**Errors:**
- `400` - Validation error (username format, name required)
- `409` - Username already exists

---

### GET `/groups/my`
Get my groups.

**Response 200:**
```json
{
  "groups": [
    {
      "id": 1,
      "username": "gaminghub",
      "name": "Gaming Hub",
      "type": "public",
      "role": {
        "id": 1,
        "name": "Owner",
        "rank": 100
      }
    }
  ]
}
```

---

### GET `/groups/public`
Get public groups.

**Response 200:**
```json
{
  "groups": [...]
}
```

---

### GET `/groups/:identifier`
Get group by username or ID.

**Response 200:**
```json
{
  "group": {
    "id": 1,
    "username": "gaminghub",
    "name": "Gaming Hub",
    "type": "public",
    "isMember": true,
    "role": {
      "id": 3,
      "name": "Member",
      "rank": 10
    },
    "channels": [
      {
        "id": 1,
        "name": "general",
        "type": "text",
        "position": 0
      }
    ]
  }
}
```

**Errors:**
- `404` - group not found

---

### PUT `/groups/:id`
Update group (Owner).

**Body:**
```json
{
  "name": "New Name",
  "description": "...",
  "username": "newusername"
}
```

**Response 200:**
```json
{
  "message": "group updated"
}
```

**Errors:**
- `403` - Not owner
- `404` - group not found

---

### DELETE `/groups/:id`
Delete group (Owner).

**Response 200:**
```json
{
  "message": "group deleted"
}
```

**Errors:**
- `403` - Not owner
- `404` - group not found

---

### POST `/groups/:id/join`
Join a public group.

**Response 200:**
```json
{
  "message": "Joined group successfully"
}
```

**Errors:**
- `400` - Already a member
- `403` - Cannot join private group (use request-join)
- `404` - group not found

---

### POST `/groups/:id/request-join`
Request to join a private group.

**Response 200:**
```json
{
  "message": "Join request sent",
  "requestId": 1
}
```

**Errors:**
- `400` - Already a member or pending request
- `403` - Can only request join to private groups
- `404` - group not found

---

### GET `/groups/:id/requests`
Get join requests (Owner).

**Response 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "userId": 2,
      "name": "Jane Doe",
      "username": "janedoe",
      "avatar": "...",
      "verified": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Not owner

---

### POST `/groups/:id/requests/:requestId/approve`
Approve request (Owner).

**Response 200:**
```json
{
  "message": "Request approved"
}
```

**Errors:**
- `403` - Not owner
- `404` - Request not found

---

### POST `/groups/:id/requests/:requestId/reject`
Reject request (Owner).

**Response 200:**
```json
{
  "message": "Request rejected"
}
```

**Errors:**
- `403` - Not owner
- `404` - Request not found

---

### POST `/groups/:id/leave`
Leave a group.

**Response 200:**
```json
{
  "message": "Left group successfully"
}
```

**Errors:**
- `400` - Not a member
- `403` - Owner cannot leave
- `404` - group not found

---

### POST `/groups/:id/channels`
Create a channel (Admin+).

**Body:**
```json
{
  "name": "new-channel"
}
```

**Response 201:**
```json
{
  "message": "Channel created",
  "channel": {
    "id": 1,
    "name": "new-channel",
    "type": "text",
    "position": 0
  }
}
```

**Errors:**
- `403` - Insufficient rank (Admin+ required)
- `404` - group not found

---

### GET `/groups/:groupId/channels/:channelId/messages`
Get channel messages.

**Query Parameters:**
- `limit`: optional, default 50
- `before`: optional, message ID for pagination

**Response 200:**
```json
{
  "messages": [
    {
      "id": "1",
      "channelId": "1",
      "userId": "1",
      "text": "Hello!",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "author": {
        "id": "1",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      },
      "attachments": []
    }
  ]
}
```

**Errors:**
- `403` - Not a member
- `404` - Channel not found

---

### POST `/groups/:groupId/channels/:channelId/messages`
Send a message to a channel.

**Body:**
```json
{
  "text": "Hello channel!",
  "attachmentIds": ["1", "2"]
}
```

**Response 201:**
```json
{
  "message": "Message sent",
  "messageId": 1
}
```

**Errors:**
- `403` - Not a member
- `404` - Channel not found

---

### DELETE `/groups/:groupId/channels/:channelId/messages/:messageId`
Delete a message (Author/Moderator+).

**Body:**
```json
{
  "scope": "all"
}
```

**Response 200:**
```json
{
  "message": "Message deleted"
}
```

**Errors:**
- `403` - Insufficient permissions
- `404` - Message not found

---

### GET `/groups/:id/members`
Get group members.

**Response 200:**
```json
{
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "avatar": "...",
      "verified": false,
      "role": {
        "id": 1,
        "name": "Owner",
        "rank": 100
      }
    }
  ]
}
```

**Errors:**
- `403` - Not a member

---

### PUT `/groups/:groupId/members/:memberId/role`
Change member role (Admin+).

**Body:**
```json
{
  "roleId": 2
}
```

**Response 200:**
```json
{
  "message": "Role updated"
}
```

**Errors:**
- `403` - Insufficient rank
- `404` - Member not found

---

### DELETE `/groups/:groupId/members/:memberId`
Kick a member (Moderator+).

**Response 200:**
```json
{
  "message": "Member kicked"
}
```

**Errors:**
- `403` - Insufficient rank (cannot manage higher rank)
- `404` - Member not found

---

## Verification

### GET `/profile/:userId/verification-status`
Get verification status.

**Response 200:**
```json
{
  "verificationStatus": {
    "status": "approved",
    "reason": "Content creator",
    "tiktokVideoUrl": "https://tiktok.com/...",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "reviewedAt": "2024-01-02T12:00:00.000Z",
    "reviewerName": "Admin"
  }
}
```

---

### POST `/profile/verification-request`
Submit a verification request.

**Body:**
```json
{
  "reason": "I'm a content creator",
  "tiktokVideoUrl": "https://tiktok.com/@user/video/123"
}
```

**Response 201:**
```json
{
  "message": "Verification request submitted",
  "requestId": 1
}
```

**Errors:**
- `400` - Invalid TikTok URL
- `409` - Pending request already exists

---

## Admin

### GET `/admin/verification-requests`
Get all verification requests.

**Response 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "userId": 2,
      "name": "Jane Doe",
      "username": "janedoe",
      "email": "jane@example.com",
      "reason": "Content creator",
      "tiktokVideoUrl": "https://tiktok.com/...",
      "status": "pending",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/admin/review-verification-request/:requestId`
Review a verification request.

**Body:**
```json
{
  "status": "approved",
  "reviewNotes": "Looks good!"
}
```

**Response 200:**
```json
{
  "message": "Request reviewed"
}
```

**Errors:**
- `400` - Invalid status

---

### GET `/admin/users`
Get all users.

**Response 200:**
```json
{
  "users": [...]
}
```

---

### GET `/admin/post-reports`
Get post reports.

**Response 200:**
```json
{
  "reports": [
    {
      "id": 1,
      "postId": 5,
      "postText": "...",
      "postImage": "...",
      "reporterName": "John",
      "reporterUsername": "john",
      "postAuthorName": "Jane",
      "postAuthorUsername": "jane",
      "reason": "Spam",
      "status": "pending",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/admin/post-reports/:reportId`
Review a post report.

**Body:**
```json
{
  "action": "delete_post",
  "reviewNotes": "Confirmed spam"
}
```

**Response 200:**
```json
{
  "message": "Report reviewed"
}
```

**Errors:**
- `400` - Invalid action

---

## Uploads

### POST `/uploads`
Upload a file.

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: file (max 10MB)

**Response 201:**
```json
{
  "message": "File uploaded successfully",
  "attachmentId": "123",
  "url": "https://res.cloudinary.com/dbmpcpvrr/...",
  "type": "image",
  "mime": "image/jpeg",
  "size": 102400
}
```

**Errors:**
- `400` - File too large or invalid type

---

### GET `/attachments/:attachmentId`
Get attachment info.

**Response 200:**
```json
{
  "attachment": {
    "id": "123",
    "url": "https://res.cloudinary.com/dbmpcpvrr/...",
    "type": "image",
    "mime": "image/jpeg",
    "size": 102400,
    "width": 1920,
    "height": 1080
  }
}
```

---

## Errors

### 400 Bad Request
```json
{
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "fields": {
        "email": ["Invalid email format"]
      }
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Authentication required",
    "code": "AUTH_REQUIRED",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### 409 Conflict
```json
{
  "error": {
    "message": "Resource already exists",
    "code": "CONFLICT",
    "statusCode": 409
  }
}
```

### 429 Too Many Requests
```json
{
  "error": {
    "message": "Too many attempts. Try again in 30 minutes.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "details": {
      "retryAfter": 1800
    }
  }
}
```

### 500 Internal group Error
```json
{
  "error": {
    "message": "Internal group error",
    "code": "INTERNAL_ERROR",
    "statusCode": 500
  }
}
```

---

## Notifications

### GET `/notifications`
Get user notifications.

**Query Parameters:**
- `limit`: optional, default 50
- `unreadOnly`: optional, if `true` returns only unread notifications

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "1",
      "userId": "1",
      "type": "message",
      "entityId": "123",
      "read": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Notification Types:**
- `message` - new message
- `reply` - reply to your post
- `mention` - mention (@username)
- `reaction` - post reaction (Resonance)
- `group_invite` - group join request

---

### POST `/notifications/read`
Mark notifications as read.

**Body:**
```json
{
  "notificationId": "1",
  "markAllAsRead": false
}
```

**Parameters:**
- `notificationId`: optional, notification ID to mark
- `markAllAsRead`: optional, if `true` marks all as read

**Response 200:**
```json
{
  "message": "Notification marked as read"
}
```

---

## WebSocket Events

### `notification_new`
New notification event.

**Payload:**
```json
{
  "type": "notification_new",
  "data": {
    "userId": "1",
    "type": "message",
    "entityId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Onboarding

### GET `/onboarding/status`
Get user's onboarding status.

**Response 200:**
```json
{
  "onboarding": {
    "completed": false,
    "primary_role": "Developer",
    "skills": ["React", "Node.js"],
    "goals": ["Find a team"]
  }
}
```

### POST `/onboarding/profile`
Save profile step (role).

**Body:**
```json
{
  "primaryRole": "Frontend Developer"
}
```

### POST `/onboarding/skills`
Save skills step.

**Body:**
```json
{
  "skills": ["React", "TypeScript", "Node.js"]
}
```

### POST `/onboarding/goals`
Save goals step.

**Body:**
```json
{
  "goals": ["Find a team", "Show my project"]
}
```

### POST `/onboarding/workspace`
Handle workspace creation or joining.

**Body (Create):**
```json
{
  "action": "create",
  "workspace": {
    "name": "My Team",
    "slug": "my-team",
    "description": "Building awesome projects",
    "type": "public",
    "focus": ["Web Development"]
  }
}
```

### POST `/onboarding/complete`
Mark onboarding as completed.

---

## Workspaces

### POST `/workspaces`
Create a new workspace.

**Body:**
```json
{
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Building awesome projects together",
  "type": "public",
  "focusTags": ["Web Development", "Open Source"]
}
```

### GET `/workspaces/my`
Get user's workspaces.

### GET `/workspaces/public`
Get public workspaces.

### GET `/workspaces/:slug`
Get workspace by slug.

### PATCH `/workspaces/:id`
Update workspace (owner/admin only).

### DELETE `/workspaces/:id`
Delete workspace (owner only).

### POST `/workspaces/:id/members`
Add member to workspace.

### PATCH `/workspaces/:id/members/:userId`
Update member role.

### DELETE `/workspaces/:id/members/:userId`
Remove member.

### GET `/workspaces/:id/members`
Get workspace members.

### POST `/workspaces/:id/invites`
Generate invite code.

### POST `/workspaces/join/:inviteCode`
Join workspace via invite code.

---

## Projects

### POST `/projects`
Create a new project.

**Body:**
```json
{
  "name": "Awesome App",
  "slug": "awesome-app",
  "description": "Building the next big thing",
  "status": "building",
  "visibility": "public",
  "stack": ["React", "Node.js", "PostgreSQL"],
  "tags": ["Web", "SaaS"],
  "githubUrl": "https://github.com/user/awesome-app",
  "demoUrl": "https://awesome-app.com",
  "lookingForMembers": true,
  "isOpenSource": true
}
```

**Response 201:**
```json
{
  "project": {
    "id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "owner_id": "1",
    "status": "building",
    "visibility": "public",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### GET `/projects/my`
Get user's projects (owned + member of).

**Response 200:**
```json
{
  "projects": [
    {
      "id": "1",
      "name": "Awesome App",
      "slug": "awesome-app",
      "status": "building",
      "visibility": "public",
      "owner_id": "1"
    }
  ]
}
```

---

### GET `/projects/public`
Get public projects for explore.

**Response 200:**
```json
{
  "projects": [...]
}
```

---

### GET `/projects/:slug`
Get project by slug.

**Response 200:**
```json
{
  "project": {
    "id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "description": "...",
    "status": "building",
    "visibility": "public",
    "stack": ["React", "Node.js"],
    "tags": ["Web"],
    "github_url": "https://github.com/...",
    "demo_url": "https://...",
    "logo_url": "https://res.cloudinary.com/...",
    "looking_for_members": true,
    "is_open_source": true,
    "owner_id": "1",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### PATCH `/projects/:id`
Update project. **Requires:** admin, lead, or manager role.

**Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "status": "launched",
  "visibility": "private",
  "stack": ["React", "TypeScript"],
  "githubUrl": "https://github.com/...",
  "demoUrl": "https://...",
  "lookingForMembers": false,
  "isOpenSource": true
}
```

**Response 200:**
```json
{
  "project": { ... },
  "message": "Project updated"
}
```

---

### POST `/projects/:id/logo`
Upload project logo. **Requires:** admin, lead, or manager role.

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: image file

**Response 200:**
```json
{
  "project": { ... },
  "logoUrl": "https://res.cloudinary.com/..."
}
```

---

### DELETE `/projects/:id`
Delete project. **Requires:** owner only.

**Response 200:**
```json
{
  "message": "Project deleted"
}
```

---

### POST `/projects/:id/members`
Add or update project member. **Requires:** admin, lead, or manager role.

**Body:**
```json
{
  "userId": 2,
  "role": "developer"
}
```

**Response 201:**
```json
{
  "message": "Project member upserted"
}
```

---

### GET `/projects/:id/members`
Get all project members.

**Response 200:**
```json
{
  "members": [
    {
      "id": "1",
      "project_id": "1",
      "user_id": "1",
      "role": "owner",
      "joined_at": "2024-01-01T12:00:00.000Z",
      "user": {
        "id": "1",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ]
}
```

---

### DELETE `/projects/:id/members/:userId`
Remove member from project. **Requires:** admin, lead, or manager role.

**Response 200:**
```json
{
  "message": "Project member removed"
}
```

---

### POST `/projects/:id/leave`
Leave project. **Owner cannot leave.**

**Response 200:**
```json
{
  "message": "Left project"
}
```

---

### POST `/projects/:id/invite`
Generate invite code. **Requires:** admin, lead, or manager role.

**Body:**
```json
{
  "expiresInHours": 168,
  "maxUses": 5
}
```

**Response 201:**
```json
{
  "invite": {
    "id": "1",
    "code": "XYZ789ABC",
    "project_id": "1",
    "expires_at": "2024-01-08T12:00:00.000Z",
    "max_uses": 5
  }
}
```

---

### POST `/projects/:id/join`
Join a public project.

**Response 200:**
```json
{
  "message": "Joined project"
}
```

---

### POST `/projects/:id/chat`
Link a chat to the project. **Requires:** owner only.

**Body:**
```json
{
  "chatId": "6"
}
```

**Response 200:**
```json
{
  "message": "Chat linked to project"
}
```

---

### DELETE `/projects/:id/chat`
Unlink chat from project. **Requires:** owner only.

**Response 200:**
```json
{
  "message": "Chat unlinked from project"
}
```

---

### GET `/projects/:id/chat`
Get linked chat for project.

**Response 200:**
```json
{
  "chat": {
    "id": "6",
    "title": "Project Chat",
    "username": "project-chat"
  }
}
```

---

### GET `/projects/:id/search-users`
Search users by username. **Requires:** admin, lead, or manager role.

**Query:** `?q=john`

**Response 200:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "https://..."
    }
  ]
}
```

---

### GET `/chats/:chatId/project`
Get project info from chat context.

**Response 200:**
```json
{
  "project": {
    "id": "2",
    "name": "Lume",
    "slug": "lume",
    "status": "launched",
    "member_role": "admin"
  }
}
```

---

## Tasks

### POST `/projects/:projectId/tasks`
Create a task. **Requires:** admin, lead, or manager role.

**Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth with refresh tokens",
  "status": "todo",
  "priority": "high",
  "assigneeId": "2",
  "sourceMessageId": "123"
}
```

**Response 201:**
```json
{
  "task": {
    "id": "1",
    "project_id": "1",
    "title": "Implement user authentication",
    "status": "todo",
    "priority": "high",
    "assignee_id": "2",
    "source_message_id": "123",
    "created_by": "1",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### GET `/projects/:projectId/tasks`
Get all tasks for a project.

**Response 200:**
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Implement user authentication",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "2",
      "assignee": { "id": "2", "username": "janedoe", "name": "Jane Doe" },
      "creator": { "id": "1", "username": "johndoe", "name": "John Doe" }
    }
  ]
}
```

---

### PATCH `/tasks/:taskId`
Update a task.

**Permissions:**
- Admin/Lead/Manager: can update any task
- Task creator: can update own tasks
- Assignee: can update assigned tasks

**Body:**
```json
{
  "title": "Updated title",
  "status": "review",
  "priority": "medium",
  "assigneeId": "3"
}
```

**Response 200:**
```json
{
  "task": { ... },
  "message": "Task updated"
}
```

---

### DELETE `/tasks/:taskId`
Delete a task. **Requires:** admin, lead, or manager role.

**Response 200:**
```json
{
  "message": "Task deleted"
}
```

---

### POST `/tasks/:taskId/comments`
Add a comment to a task.

**Body:**
```json
{
  "content": "I've started working on this."
}
```

**Response 201:**
```json
{
  "comment": {
    "id": "1",
    "task_id": "1",
    "user_id": "2",
    "content": "I've started working on this.",
    "created_at": "2024-01-01T12:00:00.000Z",
    "user": { "id": "2", "username": "janedoe", "name": "Jane Doe" }
  }
}
```

---

## Explore

### GET `/explore/builders`
Search for builders/developers.

**Query Parameters:**
- `role`: filter by role
- `availability`: filter by availability
- `skills`: comma-separated skills

### GET `/explore/projects`
Search for public projects.

### GET `/explore/workspaces`
Search for public workspaces.

### GET `/explore/looking-for-team`
Get projects looking for team members.

---

## Related Documents

- [Features Inventory](../docs/FEATURES_INVENTORY.md)
- [Error Handling](../docs/ERROR_HANDLING.md)
- [Groups Module](../docs/GROUPS_MODULE.md)
- [Onboarding Module](../docs/ONBOARDING_MODULE.md)
- [Workspaces Module](../docs/WORKSPACES_MODULE.md)
- [Projects Module](../docs/PROJECTS_MODULE.md)
- [Tasks Module](../docs/TASKS_MODULE.md)
- [README](../README.md)
