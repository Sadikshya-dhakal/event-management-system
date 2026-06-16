# Event Management API

A REST API for managing events with authentication, caching, and background job processing.

**Tech Stack:** Node.js + Express + TypeScript + MongoDB + Redis + BullMQ

---

## **Setup Instructions**

### **1. Clone & Install**
```bash
git clone https://github.com/Sadikshya-dhakal/event-management-system.git
cd event-management-system
npm install
```

### **2. Environment Variables**

Create a `.env` file (copy from `.env.example`):


### **3. Start Redis (Docker)**

**First terminal:**
```bash
docker run -p 6379:6379 redis:7-alpine
```

or with docker-compose:
```bash
docker-compose up
```

### **4. Start Express Server**

**Second terminal:**
```bash
npm start
```

You should see:
```
Redis connected
Server is running on port 5000
```

### **5. Start Background Worker**

**Third terminal:**
```bash
npm run worker
```

You should see:
```
[WORKER] Listening for jobs...
```

---

## **API Endpoints**

### **Authentication**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new user |
| POST | `/api/auth/login` | ❌ | Get JWT token |

### **Events**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | ✅ | Create event (draft) |
| GET | `/api/events` | ❌ | Get published events (cached) |
| GET | `/api/events/:id` | ❌ | Get single event |
| PATCH | `/api/events/:id` | ✅ | Update event (owner only) |
| DELETE | `/api/events/:id` | ✅ | Delete event (owner only) |
| POST | `/api/events/:id/banner` | ✅ | Upload banner image |

---

## **Curl Test Flow**

### **1. Health Check**
```bash
curl http://localhost:5000/api/auth
```

### **2. Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"org@example.com","password":"demo123456"}'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "org@example.com"
  }
}
```

### **3. Login & Save Token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"org@example.com","password":"demo123456"}'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "org@example.com"
  }
}
```

**Copy the token for next requests:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **4. Create Draft Event**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title":"Tech Meetup",
    "description":"Monthly tech community meetup for developers",
    "date":"2026-07-15T18:00:00.000Z",
    "venue":"Hall A, Convention Center",
    "capacity":100,
    "status":"draft"
  }'
```

**Response:**
```json
{
  "message": "Event created",
  "data": {
    "_id": "6a2d06789f43084ee18ebacd",
    "title": "Tech Meetup",
    "status": "draft",
    "organizerId": "507f1f77bcf86cd799439011",
    ...
  }
}
```

**Save the event ID:**
```bash
EVENT_ID="6a2d06789f43084ee18ebacd"
```

### **5. Get Published Events (First - Cache MISS)**
```bash
curl http://localhost:5000/api/events
```

**Terminal log:**
```
[CACHE MISS] events:published
```

**Response:**
```json
{
  "message": "All published events",
  "data": []
}
```

(Empty because our event is still in draft)

### **6. Publish Event (Triggers Background Job)**
```bash
curl -X PATCH http://localhost:5000/api/events/$EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"published"}'
```

**Terminal log (API):**
```
[QUEUE] Job enqueued for event: Tech Meetup
```

**Terminal log (Worker):**
```
[WORKER] Processing: notify-subscribers
[WORKER] Report saved for: Tech Meetup
[WORKER] Job <job-id> done
```

### **7. Get Published Events (Second - Cache HIT)**
```bash
curl http://localhost:5000/api/events
```

**Terminal log:**
```
[CACHE HIT] events:published
```

**Response:**
```json
{
  "message": "All published events",
  "data": [
    {
      "_id": "6a2d06789f43084ee18ebacd",
      "title": "Tech Meetup",
      "status": "published",
      ...
    }
  ]
}
```

### **8. Upload Banner**
```bash
curl -X POST http://localhost:5000/api/events/$EVENT_ID/banner \
  -H "Authorization: Bearer $TOKEN" \
  -F "banner=@./path/to/image.jpg"
```

**Response:**
```json
{
  "message": "Banner uploaded",
  "bannerPath": "uploads/1686841234567-987654321.jpg"
}
```

### **9. Verify Event with Banner**
```bash
curl http://localhost:5000/api/events/$EVENT_ID
```

**Response:**
```json
{
  "message": "Event found",
  "data": {
    "_id": "6a2d06789f43084ee18ebacd",
    "title": "Tech Meetup",
    "bannerPath": "uploads/1686841234567-987654321.jpg",
    ...
  }
}
```

### **10. Unauthorized Request (Should Fail)**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Unauthorized Event"}'
```

**Response:**
```json
{
  "message": "No token provided"
}
```

---

## **Key Features Explained**

### **1. Authentication (JWT)**
- Register creates user with bcrypt-hashed password
- Login returns JWT token valid for 7 days
- Protected routes check token in `Authorization: Bearer <token>` header
- Only authenticated users can create/edit/delete events

### **2. Caching (Redis)**
- GET `/api/events` caches published events for 60 seconds
- **CACHE HIT**: Returns instantly from Redis (~5ms)
- **CACHE MISS**: Queries MongoDB (~500ms)
- Cache invalidates when event is created/updated/deleted/published
- **Why not cache:** Draft events (personalized to organizer) and event details page (less frequently accessed)

### **3. Background Jobs (BullMQ)**
- When event status changes to "published", job is enqueued
- Worker processes job asynchronously (doesn't block API)
- Simulates 5-second processing time
- Generates report file: `exports/report-{eventId}.json`
- Useful for: sending notifications, generating reports, heavy computations

### **4. File Uploads (Multer)**
- Accepts: JPG, PNG, WebP (max 5MB)
- Saves to: `uploads/` directory
- Generates unique filename to avoid collisions
- Stores path in MongoDB

### **5. Validation (Zod)**
- Validates all inputs before processing
- Returns 400 with field errors if invalid
- Type-safe schema definitions

---

## **Folder Structure (DDD)**

```
event-management-system/
├─ src/
│  ├─ index.ts                    # Entry point
│  ├─ app.ts                      # Express app setup
│  ├─ worker.ts                   # Background job worker
│  ├─ environment.ts              # .env variables
│  │
│  ├─ controllers/
│  │  ├─ auth.controller.ts       # Register, login
│  │  └─ event.controller.ts      # CRUD, banner upload
│  │
│  ├─ models/
│  │  ├─ user.model.ts            # User schema
│  │  └─ event.model.ts           # Event schema
│  │
│  ├─ routes/
│  │  ├─ auth.route.ts            # Auth routes
│  │  ├─ event.route.ts           # Event routes
│  │  └─ user.route.ts            # User routes
│  │
│  ├─ services/
│  │  ├─ db.ts                    # MongoDB connection
│  │  ├─ redis.ts                 # Redis client
│  │  ├─ cache.service.ts         # Cache operations
│  │  └─ event.queue.ts           # BullMQ queue
│  │
│  ├─ utils/
│  │  ├─ validate.ts              # Zod validation middleware
│  │  ├─ requireAuth.ts           # JWT auth middleware
│  │  ├─ upload.ts                # Multer config
│  │  ├─ event.schema.ts          # Zod schemas
│  │  ├─ toObjectId.ts            # MongoDB ID helper
│  │  └─ bcrypt.ts                # Password hashing
│  │
│  └─ uploads/                    # Banner images stored here
│
├─ exports/                       # Job output files
├─ .env                          # (Don't commit - local only)
├─ .env.example                  # (Commit this)
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## **Design Choices**

### **What I Chose NOT to Cache**

1. **Draft Events**
   - Each organizer sees their own draft events
   - Data is personalized per user
   - Changes frequently during creation
   - Caching would require user-specific keys (complex invalidation)
   - Solution: Only cache published events (same for all users)

2. **Single Event Details** (`GET /events/:id`)
   - Less frequently accessed than event list
   - Small dataset (one event)
   - MongoDB is fast enough for single lookups
   - Caching single items requires complex invalidation patterns

3. **User Profile Data**
   - Highly personalized
   - Security-sensitive
   - Changes often
   - No benefit from shared cache

### **Why These Decisions?**

**Caching formula:** Cache = Frequently accessed + Stable data + Shared across users

✅ Published events list: Fits all criteria → Cache it
❌ Draft events: Personalized + Unstable → Don't cache
❌ Single event: Lower frequency → Don't cache

---

## **Testing**

### **Run All Tests**
```bash
npm test
```

### **Manual Testing with Curl**
See "Curl Test Flow" section above.

---

## **Troubleshooting**

| Problem | Solution |
|---------|----------|
| `Cannot POST /api/events` | Use PATCH for update, not POST |
| `Invalid eventId` | Event ID must be 24-char MongoDB ObjectId |
| `"data and hash arguments required"` | Password not saved in DB - re-register |
| `Redis connection failed` | Run `docker run -p 6379:6379 redis:7-alpine` |
| `MONGODB_URI error` | Verify MongoDB is running locally |

---

## **Submission Checklist**

- ✅ Fresh `event-management-system` repo (not Todo API)
- ✅ README with setup & curl flow (this file)
- ✅ `.env.example` with no real secrets
- ✅ Register/login work; duplicate email → 409
- ✅ Only authenticated users can create/edit/delete
- ✅ GET `/events` shows only published events (cached)
- ✅ Second GET shows [CACHE HIT] in logs
- ✅ Publishing event triggers background job
- ✅ Worker logs job completion & writes output file
- ✅ Banner upload saves file & path in DB
- ✅ Documented one design choice (what not to cache)

---

## **Presentation Notes**

**5-8 minute demo covers:**

1. **Register + Login** (1 min)
   - Show curl register
   - Show login returns token
   - Explain JWT expiry (7 days)

2. **Create Event** (1 min)
   - Show creating draft event
   - Explain `organizerId` automatically set
   - Show event is NOT in published list

3. **Publish Event** (2 min)
   - Show cache MISS on first GET
   - Update event to "published"
   - Show cache MISS is gone, job is enqueued
   - Show second GET returns CACHE HIT
   - Show worker logs processing & generating report file

4. **Banner Upload** (1 min)
   - Show uploading image with Multer
   - Show file saved in `uploads/`
   - Show path stored in MongoDB

5. **Design Choice** (1 min)
   - Explain why draft events aren't cached
   - Explain user-specific data caching complexity
   - Show how cache invalidation works

---

## **Questions You May Be Asked**

### **On Authentication**
- *Q: Why JWT instead of sessions?*
  - A: Stateless, scalable, good for REST APIs, no server-side storage needed

- *Q: Why bcrypt over plain text?*
  - A: One-way hash, password can't be recovered even if DB is leaked, salt prevents rainbow table attacks

- *Q: What if token expires?*
  - A: User must login again to get new token

### **On Caching**
- *Q: Why cache only published events?*
  - A: They're public, same for everyone, don't change often

- *Q: What happens when event is updated?*
  - A: Cache is invalidated (deleted), next GET will fetch fresh data from MongoDB

- *Q: Why use Redis instead of in-memory?*
  - A: Redis is external, shared across multiple server instances, survives restart

### **On Background Jobs**
- *Q: Why use BullMQ?*
  - A: Process long tasks without blocking API response, retry failed jobs, persistent queue

- *Q: What if worker crashes?*
  - A: Job stays in Redis queue, worker restart picks it up again

- *Q: Why 5-second delay?*
  - A: Simulate real work like sending emails, generating PDFs, API calls to external services

---

## **Next Steps (Beyond Capstone)**

- Add ticket/registration system
- Add event categories/filtering
- Add pagination to event list
- Add search functionality
- Add email notifications
- Add analytics/dashboard
- Deploy to production (AWS/Heroku)

---

**Good luck with your presentation!** 🚀