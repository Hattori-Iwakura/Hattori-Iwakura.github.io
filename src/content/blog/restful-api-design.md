---
title: 'RESTful API Design: Nghệ thuật thiết kế API "đẹp"'
description: 'Hướng dẫn chi tiết về cách thiết kế RESTful API chuẩn chỉnh, dễ sử dụng và dễ bảo trì - từ kinh nghiệm thực tế của một sinh viên năm cuối'
pubDate: 'Dec 25 2025'
heroImage: '../../assets/networking-fundamentals.png'
category: 'Java Backend'
---

## Lời mở đầu

Chào mọi người! Tiếp tục series về lập trình mạng, hôm nay mình muốn chia sẻ về một chủ đề cực kỳ quan trọng trong phát triển web hiện đại: **RESTful API Design**.

Trong quá trình làm dự án Kanji Web (Angular + NestJS), mình đã phải thiết kế hơn 50 API endpoints. Từ những sai lầm ban đầu đến khi refactor lại toàn bộ, mình học được rất nhiều về cách thiết kế API "đẹp", dễ sử dụng và dễ bảo trì.

## 🌐 REST API là gì?

### Định nghĩa

**REST** (Representational State Transfer) là một **architectural style** (phong cách kiến trúc) cho việc thiết kế networked applications.

**RESTful API** là API tuân theo các nguyên tắc của REST.

### Nguyên tắc cốt lõi (REST Constraints)

**1. Client-Server Architecture**
```
Client (Frontend)      ←→      Server (Backend)
   - UI/UX                        - Business Logic
   - Presentation                 - Database
   - User Interaction             - Authentication
```

Tách biệt concerns → Độc lập phát triển

**2. Stateless**
```
Mỗi request phải chứa đầy đủ thông tin

Request 1: GET /users/123 + Auth Token
Request 2: GET /posts + Auth Token
Request 3: DELETE /posts/456 + Auth Token

Server KHÔNG nhớ client từ request trước
```

**3. Cacheable**
```
Response nên chỉ rõ: Có cache được không?

GET /users/123
Response Headers:
  Cache-Control: max-age=3600
  ETag: "abc123"
```

**4. Uniform Interface**
```
API nhất quán, dễ đoán:
- GET /users → Lấy danh sách users
- GET /users/123 → Lấy user có ID 123
- POST /users → Tạo user mới
- PUT /users/123 → Cập nhật user 123
- DELETE /users/123 → Xóa user 123
```

**5. Layered System**
```
Client → Load Balancer → API Gateway → Service → Database

Client không cần biết có bao nhiêu layers
```

**6. Code on Demand** (Optional)
```
Server có thể gửi executable code (JavaScript)
Ít dùng trong practice
```

## 📋 HTTP Methods (Verbs)

### CRUD Operations

| HTTP Method | CRUD | Idempotent | Safe | Mục đích |
|-------------|------|------------|------|----------|
| **GET** | Read | ✅ Yes | ✅ Yes | Lấy dữ liệu |
| **POST** | Create | ❌ No | ❌ No | Tạo mới |
| **PUT** | Update | ✅ Yes | ❌ No | Cập nhật toàn bộ |
| **PATCH** | Update | ❌ No | ❌ No | Cập nhật một phần |
| **DELETE** | Delete | ✅ Yes | ❌ No | Xóa |

### Idempotent nghĩa là gì?

**Idempotent**: Gọi nhiều lần = Gọi 1 lần (kết quả giống nhau)

**Ví dụ:**
```
PUT /users/123 { "name": "John" }
Call 1: name = "John" ✅
Call 2: name = "John" ✅ (Không thay đổi)
Call 3: name = "John" ✅ (Không thay đổi)

POST /users { "name": "John" }
Call 1: Tạo user ID 1 ✅
Call 2: Tạo user ID 2 ❌ (Duplicate!)
Call 3: Tạo user ID 3 ❌ (Duplicate!)
```

### Safe nghĩa là gì?

**Safe**: Không thay đổi server state (read-only)

- **GET**: Safe ✅ (Chỉ đọc)
- **POST/PUT/DELETE**: Not safe ❌ (Thay đổi data)

## 🎯 Thiết kế URL (Endpoint Design)

### 1. Nguyên tắc cơ bản

**✅ Sử dụng danh từ (nouns), không dùng động từ (verbs)**

```
❌ BAD:
GET /getUsers
POST /createUser
PUT /updateUser/123
DELETE /deleteUser/123

✅ GOOD:
GET /users
POST /users
PUT /users/123
DELETE /users/123
```

**✅ Dùng số nhiều (plural) cho collections**

```
❌ BAD:
GET /user
GET /post
GET /comment

✅ GOOD:
GET /users
GET /posts
GET /comments
```

**✅ Phân cấp resources (Resource Hierarchy)**

```
✅ GOOD:
GET /users/123/posts          → Posts của user 123
GET /users/123/posts/456      → Post 456 của user 123
GET /posts/456/comments       → Comments của post 456
GET /users/123/followers      → Followers của user 123
```

**✅ Dùng hyphens (-), không dùng underscores (_)**

```
❌ BAD:
GET /user_profiles
GET /kanji_collections

✅ GOOD:
GET /user-profiles
GET /kanji-collections
```

**✅ Lowercase toàn bộ**

```
❌ BAD:
GET /Users
GET /Kanji/Search

✅ GOOD:
GET /users
GET /kanji/search
```

### 2. Query Parameters

**Filtering (Lọc):**
```
GET /users?role=admin
GET /users?status=active
GET /posts?author=123&category=tech
```

**Sorting (Sắp xếp):**
```
GET /users?sort=name              → Tăng dần (ascending)
GET /users?sort=-created_at       → Giảm dần (descending)
GET /posts?sort=likes,-date       → Multi-field sort
```

**Pagination (Phân trang):**
```
GET /users?page=2&limit=20
GET /posts?offset=40&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Field Selection (Chọn fields):**
```
GET /users?fields=id,name,email
GET /users/123?fields=name

Response chỉ chứa fields được yêu cầu
→ Giảm bandwidth
```

**Search (Tìm kiếm):**
```
GET /users?search=john
GET /posts?q=javascript
GET /kanji?character=日
```

### 3. Ví dụ từ Kanji Web

**User Management:**
```
GET    /users              → Danh sách users (admin)
GET    /users/:id          → Chi tiết user
PUT    /users/:id          → Cập nhật user
DELETE /users/:id          → Xóa user (admin)
```

**Authentication:**
```
POST   /auth/register      → Đăng ký
POST   /auth/login         → Đăng nhập
POST   /auth/refresh       → Refresh token
POST   /auth/logout        → Đăng xuất
```

**User Profile:**
```
GET    /user-profile                      → Profile của user hiện tại
PUT    /user-profile                      → Cập nhật profile
POST   /user-profile/change-password     → Đổi password
GET    /user-profile/learning-history    → Lịch sử học tập
```

**Kanji:**
```
GET    /kanji/search                      → Tìm kiếm Kanji
GET    /kanji/:character                  → Chi tiết Kanji
POST   /kanji/predict                     → AI nhận diện (đặc biệt)
```

**Kanji Collections:**
```
GET    /kanji-lists                       → Danh sách collections
POST   /kanji-lists                       → Tạo collection mới
GET    /kanji-lists/:id                   → Chi tiết collection
PUT    /kanji-lists/:id                   → Cập nhật collection
DELETE /kanji-lists/:id                   → Xóa collection
POST   /kanji-lists/:id/kanjis           → Thêm Kanji vào list
DELETE /kanji-lists/:id/kanjis/:kanjiId  → Xóa Kanji khỏi list
```

**Quiz:**
```
GET    /quiz                              → Danh sách quiz
POST   /quiz                              → Tạo quiz
GET    /quiz/:id                          → Chi tiết quiz
PUT    /quiz/:id                          → Cập nhật quiz
DELETE /quiz/:id                          → Xóa quiz
POST   /quiz/:id/questions               → Thêm câu hỏi
POST   /quiz/:id/submit                  → Nộp bài
GET    /quiz/results                     → Kết quả quiz
```

**Community:**
```
GET    /community/posts                   → Danh sách posts
POST   /community/posts                   → Tạo post
GET    /community/posts/:id               → Chi tiết post
PUT    /community/posts/:id               → Cập nhật post
DELETE /community/posts/:id               → Xóa post
POST   /community/posts/:id/like         → Like post
GET    /community/posts/:id/comments     → Comments của post
POST   /community/posts/:id/comments     → Tạo comment
```

## 📤 Request & Response Format

### 1. Request Body

**JSON format:**
```json
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure123",
  "displayName": "John Doe"
}
```

**Form Data (File upload):**
```
POST /user-profile/avatar
Content-Type: multipart/form-data

avatar: [binary file]
```

### 2. Response Format

**Successful Response:**
```json
GET /users/123
Status: 200 OK

{
  "data": {
    "id": 123,
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-12-01T10:30:00Z"
  },
  "statusCode": 200,
  "timestamp": "2025-12-25T15:30:00Z"
}
```

**List Response with Pagination:**
```json
GET /users?page=2&limit=10
Status: 200 OK

{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 10,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": true
  },
  "statusCode": 200,
  "timestamp": "2025-12-25T15:30:00Z"
}
```

**Error Response:**
```json
POST /users
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2025-12-25T15:30:00Z"
}
```

## 🔢 HTTP Status Codes

### Success (2xx)

| Code | Name | Khi nào dùng |
|------|------|-------------|
| **200** | OK | GET, PUT, PATCH thành công |
| **201** | Created | POST tạo resource mới thành công |
| **204** | No Content | DELETE thành công (không return data) |

### Client Errors (4xx)

| Code | Name | Khi nào dùng |
|------|------|-------------|
| **400** | Bad Request | Request sai format, validation fail |
| **401** | Unauthorized | Chưa authenticate (chưa login) |
| **403** | Forbidden | Đã login nhưng không có permission |
| **404** | Not Found | Resource không tồn tại |
| **409** | Conflict | Conflict (email đã tồn tại, ...) |
| **422** | Unprocessable Entity | Validation error (chi tiết hơn 400) |
| **429** | Too Many Requests | Rate limit exceeded |

### Server Errors (5xx)

| Code | Name | Khi nào dùng |
|------|------|-------------|
| **500** | Internal Server Error | Lỗi server không xác định |
| **502** | Bad Gateway | Gateway/proxy error |
| **503** | Service Unavailable | Server quá tải hoặc maintenance |

### Ví dụ thực tế

**Successful Operations:**
```
GET /users/123           → 200 OK
POST /users              → 201 Created
PUT /users/123           → 200 OK
DELETE /users/123        → 204 No Content
```

**Client Errors:**
```
GET /users/999           → 404 Not Found
POST /auth/login         → 401 Unauthorized (wrong password)
DELETE /posts/123        → 403 Forbidden (not your post)
POST /users              → 409 Conflict (email exists)
```

**Server Errors:**
```
GET /users               → 500 Internal Server Error (DB crash)
POST /quiz/:id/submit    → 503 Service Unavailable (AI service down)
```

## 🔐 Authentication & Authorization

### 1. JWT (JSON Web Token)

**Flow:**
```
1. Client: POST /auth/login { email, password }
2. Server: Verify → Generate JWT
3. Server: Return { accessToken, refreshToken }
4. Client: Store tokens (localStorage/cookie)
5. Client: GET /users + Header: "Authorization: Bearer <token>"
6. Server: Verify JWT → Process request
```

**JWT Structure:**
```
header.payload.signature

{
  "sub": "user-id-123",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Best Practices:**
- Access token: Short-lived (15 phút)
- Refresh token: Long-lived (30 ngày)
- Lưu refresh token trong DB để revoke được
- Access token không lưu DB (stateless)

### 2. API Keys

**Khi nào dùng:**
- Server-to-server communication
- Third-party integrations
- Rate limiting by customer

**Example:**
```
GET /api/translate
Header: X-API-Key: abc123xyz789

hoặc

GET /api/translate?apiKey=abc123xyz789
```

### 3. OAuth 2.0

**Social Login:**
```
Login with Google/Facebook/GitHub

1. Client → OAuth Provider: Request authorization
2. User authorize
3. Provider → Client: Authorization code
4. Client → Provider: Exchange code for token
5. Client → Server: Send token
6. Server: Verify with Provider
```

## ⚡ Performance Optimization

### 1. Caching

**HTTP Caching Headers:**
```
GET /kanji/:character
Response:
  Cache-Control: public, max-age=3600
  ETag: "abc123"
  Last-Modified: Mon, 01 Dec 2025 10:00:00 GMT
```

**Next request:**
```
GET /kanji/:character
Request:
  If-None-Match: "abc123"
  If-Modified-Since: Mon, 01 Dec 2025 10:00:00 GMT

Response:
  304 Not Modified (no body → fast!)
```

**Redis Caching:**
```
1. Client: GET /users/123
2. Server: Check Redis cache
   - Hit: Return cached data (fast!)
   - Miss: Query DB → Cache in Redis → Return
3. Set TTL: 1 hour
```

### 2. Pagination

**Offset-based:**
```
GET /posts?offset=20&limit=10

Pros: Đơn giản
Cons: Chậm với offset lớn
```

**Cursor-based:**
```
GET /posts?cursor=abc123&limit=10

Response:
{
  "data": [...],
  "nextCursor": "xyz789"
}

Pros: Performance tốt
Cons: Không thể jump to page
```

### 3. Field Selection

```
GET /users/123?fields=id,name,email

Chỉ return fields cần thiết
→ Giảm bandwidth
→ Faster response
```

### 4. Compression

```
Request:
  Accept-Encoding: gzip, deflate, br

Response:
  Content-Encoding: gzip
  [Compressed JSON]

Giảm 70-80% response size
```

### 5. Rate Limiting

```
Response Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1234567890

Nếu vượt quá:
  Status: 429 Too Many Requests
  Retry-After: 60
```

## 🎨 API Versioning

### 1. URL Versioning (Phổ biến nhất)

```
/api/v1/users
/api/v2/users
/api/v3/users
```

**Pros:**
- Rõ ràng, dễ hiểu
- Dễ route
- Dễ cache

**Cons:**
- URL "xấu" hơn
- Duplicate code

### 2. Header Versioning

```
GET /users
Header: Accept: application/vnd.api+json;version=2
```

**Pros:**
- URL "đẹp"
- RESTful hơn

**Cons:**
- Khó debug
- Khó cache

### 3. Query Parameter

```
GET /users?version=2
```

**Pros:**
- Dễ implement

**Cons:**
- Không chuẩn
- Khó bắt buộc version

**Recommendation:** URL versioning (`/api/v1/`) là best choice cho hầu hết cases

## 🛡️ Security Best Practices

### 1. HTTPS Only

```
Luôn dùng HTTPS (TLS/SSL)
HTTP → Man-in-the-middle attack
```

### 2. Input Validation

```
Validate mọi input:
- Type checking
- Range checking
- Format validation (email, URL, ...)
- SQL injection prevention
- XSS prevention
```

**NestJS Example:**
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
  password: string;

  @IsOptional()
  @MaxLength(50)
  displayName?: string;
}
```

### 3. Rate Limiting

```
Giới hạn requests per IP/user
Prevent brute force, DDoS
```

### 4. CORS Configuration

```
Allow-Origin: https://myapp.com
Allow-Methods: GET, POST, PUT, DELETE
Allow-Headers: Authorization, Content-Type
Allow-Credentials: true
```

### 5. Sensitive Data

```
❌ Never return passwords (even hashed)
❌ Never log sensitive data
✅ Mask credit cards: **** **** **** 1234
✅ Sanitize error messages (don't expose internals)
```

## 📝 Documentation

### 1. OpenAPI/Swagger

**Auto-generate docs:**
```
http://localhost:3000/api

Interactive API testing
Request/Response examples
Schema definitions
```

**NestJS:**
```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserDto] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }
}
```

### 2. Postman Collections

```
Export Postman collection
Share với team
Pre-request scripts
Tests/Assertions
```

### 3. README

```markdown
## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID

## Examples

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure123"}'
```
```

## 🎓 Lessons Learned

### Sai lầm mình đã mắc

**1. Dùng động từ trong URL:**
```
❌ /getUserById/123
❌ /createPost
✅ GET /users/123
✅ POST /posts
```

**2. Không consistent:**
```
❌ /users vs /userList
❌ /kanji vs /kanjis
✅ Luôn dùng plural
```

**3. Over-nesting:**
```
❌ /users/123/posts/456/comments/789/likes
✅ /comments/789/likes (direct access)
```

**4. Không handle errors đúng:**
```
❌ Return 200 OK với error message
✅ Return đúng status code
```

**5. Trả về toàn bộ object:**
```
❌ GET /users → Return user với password hash
✅ Dùng DTOs để filter fields
```

### Best Practices tổng hợp

✅ **Keep it simple** - KISS principle  
✅ **Be consistent** - Naming, format, structure  
✅ **Document everything** - Swagger, README, examples  
✅ **Version your API** - /api/v1/  
✅ **Use proper status codes** - 200, 201, 400, 404, 500  
✅ **Validate input** - Never trust client  
✅ **Paginate large datasets** - offset/cursor pagination  
✅ **Use DTOs** - Data Transfer Objects  
✅ **Log requests** - Debug, monitoring, analytics  
✅ **Test thoroughly** - Unit, integration, E2E tests  

## 🚀 Tools & Technologies

**Backend Frameworks:**
- **NestJS** (TypeScript) - Mình dùng cho Kanji Web
- **Express** (Node.js) - Lightweight, flexible
- **FastAPI** (Python) - Fast, modern
- **Spring Boot** (Java) - Enterprise-grade
- **ASP.NET Core** (C#) - Microsoft ecosystem

**Documentation:**
- **Swagger/OpenAPI** - Auto-generate docs
- **Postman** - API testing & docs
- **Insomnia** - Alternative to Postman

**Testing:**
- **Jest** - Unit testing (NestJS default)
- **Supertest** - E2E API testing
- **Postman** - Manual testing

**Monitoring:**
- **Sentry** - Error tracking
- **Datadog** - APM monitoring
- **ELK Stack** - Logging

## 🎯 Kết luận

RESTful API design là **art + science**. Không có một "cách đúng" duy nhất, nhưng có những best practices đã được kiểm chứng qua thời gian.

**Key Takeaways:**

1. **Think from user's perspective** - API phải easy to use
2. **Consistency is key** - Nhất quán trong naming, structure, error handling
3. **Document properly** - Good docs = happy developers
4. **Plan for scale** - Pagination, caching, rate limiting từ đầu
5. **Security first** - Validation, authentication, HTTPS

**Trong dự án Kanji Web:**
- 50+ endpoints
- Swagger documentation
- JWT authentication
- Input validation với class-validator
- Pagination cho large datasets
- Error handling với global filters

Từ chỗ messy ban đầu, sau vài lần refactor, giờ API của mình đã clean, consistent và dễ maintain!

---

**Resources recommend:**

📚 **Books:**
- RESTful Web APIs (Richardson, Ruby)
- API Design Patterns (Geewax)

🌐 **Reading:**
- Microsoft REST API Guidelines
- Google API Design Guide
- Zalando RESTful API Guidelines

🛠️ **Practice:**
- Build a CRUD API
- Integrate with third-party APIs
- Read popular APIs (GitHub, Stripe, Twilio)

---

*Hi vọng bài viết giúp ích cho các bạn đang học backend development! Nếu có câu hỏi hay muốn share kinh nghiệm, comment bên dưới nhé!* 🚀

**#RESTfulAPI #APIDesign #Backend #WebDevelopment #BestPractices**
