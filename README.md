# Code-Geass Backend

A Node.js/Express backend for an online coding platform featuring code execution, automated judging, and AI-powered programming assistance. Built as an educational project to explore REST API development, authentication, database design, code execution, and GenAI integration.

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control (User/Admin)
- **Problem Management**: CRUD operations for coding problems with automatic slug generation
- **Code Execution**: Compile and run C++ and Python code with custom input (5s timeout)
- **Online Judge**: Automated solution validation with hidden test cases (10s timeout)
- **AI Hint System**: Progressive 3-level hint generation using Groq LLM with prompt injection protection
- **AI Code Review**: Automated code analysis and feedback using Groq LLM
- **Leaderboard**: User ranking system based on solved problems and difficulty-based scoring
- **Security**: Password hashing, input validation, rate limiting, timeout protection, command injection prevention
- **Automatic Cleanup**: Generated source files and binaries are deleted after execution

## Tech Stack

**Backend**: Express.js (Node.js)
**Database**: MongoDB with Mongoose ODM
**Authentication**: JWT with bcrypt password hashing
**Code Execution**: Child process execution (`execFile`) for C++ (g++) and Python 3
**AI Services**: Groq SDK (`openai/gpt-oss-120b` model)
**Libraries**: cors, dotenv, uuid, slugify

## Architecture

```
Frontend (React/Client)
         |
         v
   Express API Server
         |
    ┌────┴─────────────────────────┐
    |    Middleware                |
    |    - CORS                    |
    |    - Body Parser (1MB)       |
    |    - JWT Auth                |
    |    - Role Authorization      |
    |    - Rate Limiting           |
    └────┬─────────────────────────┘
         |
    ┌────┴─────────────────────────┐
    |    Routes & Controllers      |
    |    - Auth (signup/login)     |
    |    - Problems (CRUD)         |
    |    - Code Execution          |
    |    - Judge System            |
    |    - AI Services             |
    |    - Leaderboard             |
    └────┬─────────────────────────┘
         |
    ┌────┴─────────────┬───────────┐
    v                  v           v
 MongoDB          Groq API    Host System
 (Users/          (AI Hint/   (Code Execution:
  Problems)       Review)      /codes, /playground)
```

## Project Structure

```
code-geass-backend/
├── app.js                      # Application entry point
├── package.json                # Dependencies
├── .env                        # Environment variables (gitignored)
├── db/conn.js                  # MongoDB connection
├── models/
│   ├── user.js                 # User schema (email, password, role, score)
│   └── problem.js              # Problem schema (title, slug, difficulty, input, output)
├── middleware/
│   ├── auth.js                 # JWT authentication
│   ├── checkAdmin.js           # Admin role verification
│   ├── rateLimitLogin.js       # Login rate limiter (10 req/min per IP)
│   ├── rateLimitHint.js        # Hint rate limiter (5 req/min per user)
│   ├── rateLimitReview.js      # Review rate limiter (5 req/min per user)
│   └── hintProgression.js      # Progressive hint level tracking
├── routes/
│   ├── userRoutes/             # User endpoints (signup, login, problems, run, check, hints, etc.)
│   └── adminRoutes/            # Admin endpoints (add/edit problems)
├── controllers/
│   ├── userRouteController/    # User request handlers
│   └── adminRouteController/   # Admin request handlers
├── services/
│   ├── aiHintService.js        # Groq-powered hint generation
│   └── aiCodeReviewService.js  # Groq-powered code review
├── compiler/
│   ├── generateFile.js         # Create temp source files (UUID naming)
│   ├── executeCpp.js           # Compile & run C++ (5s timeout)
│   └── executePy.js            # Run Python (5s timeout)
├── judge/
│   ├── executeCpp.js           # Judge C++ submissions (10s timeout)
│   └── executePy.js            # Judge Python submissions (10s timeout)
├── codes/                      # Temporary source files (auto-cleanup)
├── playground/                 # Temporary binaries (auto-cleanup)
└── inputs/                     # Test case input files
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Create new user account |
| POST | `/api/login` | Login and receive JWT token (rate limited: 10 req/min per IP) |

### Authenticated User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get current user information |
| GET | `/api/problem` | Get all problems (without test cases) |
| GET | `/api/problem/:slug` | Get single problem details (without test cases) |
| POST | `/api/run` | Execute code with custom input |
| POST | `/api/check/:slug` | Submit solution for judging |
| GET | `/api/leader-board` | Get user rankings by score |
| POST | `/api/hint/:slug` | Request AI-generated hint (rate limited: 5 req/min, progressive levels) |
| POST | `/api/review/:slug` | Request AI code review (rate limited: 5 req/min) |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/problem` | Create a new problem (requires admin role) |
| PUT | `/admin/problem/:id` | Update existing problem (requires admin role) |

## Authentication & Authorization

**JWT Authentication**:
- Users receive JWT token on successful login (30-day expiry)
- Token must be included in `Authorization` header for protected routes
- Passwords hashed using bcrypt (10 salt rounds)

**Role-Based Access Control**:
- `user` (default): Can solve problems, execute code, request hints/reviews
- `admin`: Can create/edit problems + all user capabilities

## Problem Management

**Problem Creation Flow**:
1. Admin submits problem with title, description, difficulty, input, and output
2. System generates URL-friendly slug from title (e.g., "Two Sum" → "two-sum")
3. Creates input test case file at `/inputs/{slug}.txt`
4. Problem stored in MongoDB

**Test Case Protection**:
- `input` and `output` fields are **hidden** from public GET endpoints using Mongoose field projection
- Judge system has full internal access to test cases
- Prevents users from viewing expected output before solving

## Code Execution & Judge

### Execution Flow

**Interactive Execution (`/api/run`)**:
```
1. Generate UUID-named temp file (/codes/{uuid}.cpp or .py)
2. [C++] Compile with g++ (10s timeout) → /playground/{uuid}.out
3. Execute with user-provided stdin (5s timeout)
4. Capture stdout
5. Cleanup: Delete source file and binary
6. Return output
```

**Judge System (`/api/check/:slug`)**:
```
1. Lookup problem (with hidden test cases)
2. Generate temp file
3. [C++] Compile (10s timeout)
4. Read test input from /inputs/{slug}.txt
5. Execute with test input via stdin (10s timeout)
6. Compare output with expected output (trimmed)
7. Cleanup: Delete source file and binary
8. Update user score if accepted (first solve only)
9. Return verdict
```

### Supported Languages

| Language | Extension | Compiler/Interpreter | Timeout (Run) | Timeout (Judge) |
|----------|-----------|---------------------|---------------|-----------------|
| C++ | .cpp | g++ | 5 seconds | 10 seconds |
| Python | .py | python3 | 5 seconds | 10 seconds |

### Judge Verdicts

| Verdict | Meaning |
|---------|---------|
| "All Test Case Passed" | Output matches expected (points awarded on first solve) |
| "Failing in Hidden Test Case" | Output does not match |
| Compilation/Runtime Error | Code failed to compile or crashed |
| Timeout | Execution exceeded time limit |

### Scoring System

| Difficulty | Points |
|------------|--------|
| Easy | 10 |
| Medium | 20 |
| Hard | 40 |

Points awarded only on **first successful solve** per problem.

## AI Hint System

**Progressive 3-Level Hints**:

| Level | Description |
|-------|-------------|
| **Level 1** | Conceptual direction, no algorithm names |
| **Level 2** | Specific observation, points to data structures |
| **Level 3** | Algorithmic direction, identifies appropriate technique |

**Hint Progression**:
- First request → Level 1 enforced
- Subsequent requests → Can only request current level + 1
- Cannot skip levels (tracked per user per problem)

**Prompt Injection Protection**:
- User code treated as **untrusted input**
- Wrapped in XML-style tags with explicit instructions to ignore embedded commands
- Prevents "ignore previous instructions" attacks

**Request Format**:
```json
POST /api/hint/:slug
{
  "code": "string",
  "language": "cpp|py",
  "hintLevel": 1|2|3
}
```

**AI Configuration**:
- Provider: Groq SDK
- Model: `openai/gpt-oss-120b`
- Temperature: 0.3, Max tokens: 200

## AI Code Review

Provides automated code analysis focusing on time/space complexity, code quality, edge cases, and best practices.

**Request Format**:
```json
POST /api/review/:slug
{
  "code": "string",
  "language": "cpp|py"
}
```

**AI Configuration**:
- Provider: Groq SDK
- Model: `openai/gpt-oss-120b`
- Temperature: 0.5, Max tokens: 300

## Security Measures

| Security Feature | Implementation |
|------------------|----------------|
| Password Hashing | bcrypt (10 salt rounds) |
| Authentication | JWT (30-day expiry) |
| Command Injection Prevention | `execFile` instead of shell `exec` |
| Input Validation | Email regex, password length, type checks |
| Code Size Limits | 50KB max code, 1MB max request body |
| Rate Limiting | Login (10/min per IP), Hint/Review (5/min per user) |
| Execution Timeouts | 5s (run), 10s (judge) |
| Test Case Protection | Mongoose field projection hides input/output |
| Temporary File Cleanup | Auto-delete after execution (success or failure) |

## Setup

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- MongoDB (local or MongoDB Atlas)
- g++ (C++ compiler)
- Python 3
- Groq API Key

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd code-geass-backend
npm install
```

2. **Configure environment variables**:

Create `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/code_geass
JWT_SECRET=your_secure_jwt_secret_here
PORT=5001
```

3. **Start MongoDB**:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

4. **Run the server**:
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server will start at `http://localhost:5001`

## API Usage Examples

### 1. User Registration

**Request**:
```bash
curl -X POST http://localhost:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "securepass123"
  }'
```

**Response**:
```json
"success"
```

**Validation Rules**:
- Name: Required, 1-100 characters
- Email: Required, valid email format, case-insensitive
- Password: Required, minimum 8 characters

### 2. User Login

**Request**:
```bash
curl -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass123"
  }'
```

**Response**:
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1M..."
```

**Note**: Save this JWT token for subsequent authenticated requests.

**Rate Limit**: 10 requests per minute per IP address

### 3. Get User Information

**Request**:
```bash
curl -X GET http://localhost:5001/api/user \
  -H "Authorization: YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Alice",
  "email": "alice@example.com",
  "score": 30,
  "solvedProblems": ["507f191e810c19729de860ea"],
  "role": "user"
}
```

### 4. Get All Problems

**Request**:
```bash
curl -X GET http://localhost:5001/api/problem \
  -H "Authorization: YOUR_JWT_TOKEN"
```

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "action": "Unsolved"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "slug": "reverse-string",
    "title": "Reverse String",
    "difficulty": "Easy",
    "action": "Solved"
  }
]
```

**Note**: `action` field shows "Solved" or "Unsolved" based on user's progress.

### 5. Get Problem Details

**Request**:
```bash
curl -X GET http://localhost:5001/api/problem/two-sum \
  -H "Authorization: YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "slug": "two-sum",
  "title": "Two Sum",
  "difficulty": "Easy",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "__v": 0
}
```

**Security Note**: `input` and `output` fields are **not included** in the response to prevent test case exposure.

### 6. Run Code (Interactive Execution)

**Request**:
```bash
curl -X POST http://localhost:5001/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "lang": "cpp",
    "code": "#include<iostream>\nusing namespace std;\nint main() { int a, b; cin >> a >> b; cout << a + b << endl; return 0; }",
    "input": "5 3"
  }'
```

**Response**:
```json
"8\n"
```

**Python Example**:
```bash
curl -X POST http://localhost:5001/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "lang": "py",
    "code": "a, b = map(int, input().split())\nprint(a + b)",
    "input": "5 3"
  }'
```

**Limits**:
- Code size: Max 50KB
- Execution timeout: 5 seconds
- Request body: Max 1MB

### 7. Submit Solution for Judging

**Request**:
```bash
curl -X POST http://localhost:5001/api/check/two-sum \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "lang": "py",
    "code": "line = input()\nprint(\"[0,1]\")"
  }'
```

**Successful Response**:
```json
"All Test Case Passed"
```

**Failed Response**:
```json
"Failing in Hidden Test Case"
```

**Error Responses**:
```json
// Compilation error (C++)
{
  "error": { ... },
  "stderr": "error: expected ';' before ..."
}

// Runtime error
{
  "error": { ... },
  "stderr": "RuntimeError: ..."
}

// Timeout
{
  "status": "timeout",
  "message": "Execution timed out"
}
```

**Scoring**:
- Points awarded only on **first successful solve**
- Easy: 10 points, Medium: 20 points, Hard: 40 points
- User score updated automatically

### 8. Request AI Hint (Progressive Levels)

**Level 1 Request**:
```bash
curl -X POST http://localhost:5001/api/hint/two-sum \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "code": "for i in range(n): sum += arr[i]",
    "language": "py",
    "hintLevel": 1
  }'
```

**Response**:
```json
"Consider using a data structure that allows for fast lookups to avoid nested loops."
```

**Level 2 Request** (only after getting Level 1):
```bash
curl -X POST http://localhost:5001/api/hint/two-sum \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "code": "for i in range(n): sum += arr[i]",
    "language": "py",
    "hintLevel": 2
  }'
```

**Response**:
```json
"A hash map can store previously seen values and their indices, allowing you to check for complements in O(1) time."
```

**Rate Limit**: 5 requests per minute per user

**Progression Rules**:
- First request for a problem → Level 1 enforced
- Can only request current level + 1
- Cannot skip levels

### 9. Request AI Code Review

**Request**:
```bash
curl -X POST http://localhost:5001/api/review/two-sum \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "code": "for(int i=0; i<n; i++) { for(int j=i+1; j<n; j++) { if(arr[i] + arr[j] == target) return {i, j}; }}",
    "language": "cpp"
  }'
```

**Response**:
```json
"Your solution has O(n²) time complexity due to the nested loops. Consider using a hash map to achieve O(n) time complexity. Also, ensure you handle edge cases like empty arrays or arrays with fewer than 2 elements."
```

**Rate Limit**: 5 requests per minute per user

### 10. Get Leaderboard

**Request**:
```bash
curl -X GET http://localhost:5001/api/leader-board \
  -H "Authorization: YOUR_JWT_TOKEN"
```

**Response**:
```json
[
  { "name": "Alice", "score": 70, "rank": 1 },
  { "name": "Bob", "score": 50, "rank": 2 },
  { "name": "Charlie", "score": 30, "rank": 3 }
]
```

**Ranking**: Users ranked by total score (descending)

### 11. Admin: Create Problem

**Request** (requires admin role):
```bash
curl -X POST http://localhost:5001/admin/problem \
  -H "Content-Type: application/json" \
  -H "Authorization: ADMIN_JWT_TOKEN" \
  -d '{
    "title": "Array Sum",
    "difficulty": "Easy",
    "description": "Given an array of integers, return the sum of all elements.",
    "input": "5\n1 2 3 4 5",
    "output": "15"
  }'
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "slug": "array-sum",
  "title": "Array Sum",
  "difficulty": "Easy",
  "description": "Given an array of integers, return the sum of all elements.",
  "input": "5\n1 2 3 4 5",
  "output": "15",
  "__v": 0
}
```

**Auto-Generated**:
- `slug`: Created from title ("Array Sum" → "array-sum")
- Input file: Created at `/inputs/array-sum.txt`

### 12. Admin: Edit Problem

**Request** (requires admin role):
```bash
curl -X PUT http://localhost:5001/admin/problem/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: ADMIN_JWT_TOKEN" \
  -d '{
    "title": "Array Sum Updated",
    "difficulty": "Medium",
    "description": "Updated description",
    "input": "5\n1 2 3 4 5",
    "output": "15"
  }'
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "slug": "array-sum-updated",
  "title": "Array Sum Updated",
  "difficulty": "Medium",
  ...
}
```

## Current Limitations

⚠️ **This is an educational project. The following limitations are by design:**

**Security & Isolation**:
- User code executes directly on the host machine without containerization
- No sandboxing (Docker, VMs, or system-level isolation)
- No CPU/memory/disk/network resource limits (only timeout protection)
- File system access possible from user code

**Scalability**:
- Monolithic architecture (single server, not horizontally scalable)
- In-memory rate limiting (resets on server restart)
- Synchronous code execution (blocking)

**Testing & Validation**:
- Single test case per problem
- No partial credit scoring
- No test case visibility for users

**Not suitable for production deployment with untrusted users.**

## Future Improvements (V2)

Potential enhancements for production deployment:

- **Docker Containerization**: Isolate executions in disposable containers
- **Resource Limits**: CPU, memory, disk, network restrictions (cgroups/seccomp)
- **Distributed Judge**: Worker queue system (RabbitMQ/Redis Queue)
- **Persistent Rate Limiting**: Redis-backed rate limiters
- **Multiple Test Cases**: Support multiple test cases with partial scoring
- **Additional Languages**: Java, JavaScript, Go, Rust
- **Monitoring & Logging**: Prometheus, Grafana, structured logging
- **CI/CD Pipeline**: Automated testing and deployment
- **Comprehensive Testing**: Unit, integration, and security tests

## Project Scope

Code-Geass Backend is a **college-level educational project** demonstrating:

✅ RESTful API design and implementation
✅ JWT authentication with role-based access control
✅ Database modeling with MongoDB/Mongoose
✅ Safe code execution and process management
✅ External API integration (Groq AI)
✅ Security best practices (hashing, validation, injection prevention)
✅ Middleware patterns (auth, rate limiting, progression tracking)
✅ Error handling and resource cleanup

**Learning Focus**: Building a full-featured backend API while understanding security trade-offs and acknowledging the additional work required for production deployment.

## Author

**Abhishek Nishad**

---

*This README documents the actual implementation of Code-Geass Backend V1. All endpoints, features, and limitations are based on the current codebase.*
