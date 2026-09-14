# Architecture — Strict Separation Confirmed

## Rule Compliance Checklist

| Rule | Status |
|------|--------|
| No frontend JS in backend | ✅ |
| No database queries in frontend | ✅ (fetch API only) |
| No HTML in backend | ✅ |
| Controllers / Services / Routes in separate files | ✅ |
| Each layer independent | ✅ |
| MVC on backend | ✅ |
| ES6 classes in backend only | ✅ |
| Role-based dashboard redirect | ✅ |
| JWT on every protected API | ✅ |

---

## Folder Structure

```
Airline/
├── backend/                          # NODE.JS ONLY — NO HTML
│   ├── server.js                     # Bootstrap only (Express + route mounting)
│   ├── config/
│   │   ├── database.js               # MongoDB connection
│   │   └── roles.js                  # Role constants (backend authority)
│   ├── models/                       # Mongoose schemas ONLY
│   │   ├── User.js
│   │   ├── Flight.js
│   │   └── Booking.js
│   ├── classes/                      # Domain ES6 classes (entities)
│   │   ├── User.js
│   │   ├── Flight.js
│   │   ├── Booking.js
│   │   └── Payment.js
│   ├── services/                     # Business logic ONLY
│   │   ├── UserService.js
│   │   ├── FlightService.js
│   │   ├── BookingService.js
│   │   ├── PaymentService.js
│   │   ├── ReportService.js
│   │   ├── SystemAdminService.js
│   │   ├── SetupService.js
│   │   └── HealthService.js
│   ├── controllers/                  # Request/response ONLY
│   │   ├── UserController.js
│   │   ├── FlightController.js
│   │   ├── BookingController.js
│   │   ├── PaymentController.js
│   │   ├── ReportController.js
│   │   ├── SystemAdminController.js
│   │   ├── SetupController.js
│   │   └── HealthController.js
│   ├── routes/                       # API endpoints ONLY
│   │   ├── userRoutes.js
│   │   ├── flightRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── systemRoutes.js
│   │   ├── setupRoutes.js
│   │   └── healthRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT + role protection
│   └── seed/                         # CLI scripts (not UI)
│       ├── ensureData.js
│       └── seedData.js
│
└── frontend/                         # UI ONLY — NO MONGOOSE, NO BUSINESS RULES
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── core/
    │   │   ├── api-client.js         # fetch() calls ONLY
    │   │   ├── session.js            # Token storage + redirect
    │   │   ├── roles-config.js       # UI dashboard paths ONLY
    │   │   └── ui.js                 # DOM display helpers
    │   └── pages/                    # Page-specific UI logic
    │       ├── landing.js
    │       ├── login.js
    │       ├── register.js
    │       ├── flights.js
    │       ├── booking.js
    │       ├── payment.js
    │       ├── passenger-dashboard.js
    │       ├── admin-dashboard.js
    │       ├── agent-dashboard.js
    │       └── manager-dashboard.js
    ├── index.html                    # Landing + public search
    ├── login.html
    ├── register.html
    ├── dashboard-passenger.html
    ├── dashboard-admin.html
    ├── dashboard-agent.html
    ├── dashboard-manager.html
    ├── flights.html
    ├── booking.html
    └── payment.html
```

---

## Layer Responsibilities

### Backend
- **Models**: Schema + DB structure
- **Services**: All business rules (booking, payment, reports, roles)
- **Controllers**: Parse request → call service → JSON response
- **Routes**: Map HTTP verbs to controller methods
- **Middleware**: JWT verify + role authorize

### Frontend
- **HTML**: Structure only
- **CSS**: Styling only
- **api-client.js**: HTTP requests only
- **session.js**: localStorage + redirect from API `dashboard` field
- **pages/*.js**: Render API data into DOM

---

## Role → Dashboard Map

| Role | Dashboard | Capabilities |
|------|-----------|--------------|
| `passenger` | dashboard-passenger.html | Search, book, seats, history |
| `admin` | dashboard-admin.html | Manage flights, bookings, users & roles |
| `agent` | dashboard-agent.html | Book for others, modify, cancel |
| `manager` | dashboard-manager.html | Analytics only |

**Note:** User & role management is handled by **Airline Admin** (`admin`), not a separate system admin role.

---

## Auth Flow

1. User submits login form (frontend)
2. `POST /api/users/login` (backend UserController → UserService)
3. Response: `{ token, user, dashboard }`
4. Frontend `Session.save()` + `Session.redirectAfterLogin()`
5. All API calls send `Authorization: Bearer <token>`
6. `authMiddleware` validates JWT + role on protected routes

---

## No Mixing Verification

- ❌ Removed: inline `<script>` business logic from HTML
- ❌ Removed: Mongoose calls from `setupRoutes.js` (moved to SetupService)
- ❌ Removed: FlightModel from `server.js` (moved to HealthService)
- ❌ Removed: duplicate `dashboard.html`, `admin.html`, legacy `js/*.js` at root
