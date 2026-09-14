# SkyBook — Airline Reservation System

Enterprise-style **strictly separated** full-stack app: Node.js/MongoDB backend (MVC + OOP) and vanilla HTML/CSS/JS frontend (fetch only).

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for layer rules and folder structure confirmation.

## Quick Start

```bash
npm install
npm start
```

Open http://localhost:3000

## Demo Accounts

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Passenger | john@example.com | user123 | dashboard-passenger.html |
| Airline Admin | admin@airline.com | admin123 | dashboard-admin.html |
| Agent | agent@airline.com | agent123 | dashboard-agent.html |
| Operations Manager | manager@airline.com | manager123 | dashboard-manager.html |

**Airline Admin** also manages users & roles (no separate system admin).

## API Base

`/api/health` · `/api/users` · `/api/flights` · `/api/bookings` · `/api/payments` · `/api/reports` · `/api/system`

MIT License
