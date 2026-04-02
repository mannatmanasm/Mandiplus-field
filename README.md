# MandiPlus Field PWA

Standalone field-facing Progressive Web App for:
- Survey agents
- Meeting team members

This app connects to the shared `Mandi-plus` backend and works alongside the admin dashboard in `MandiPlus-frontend-new-1`.

## Environment

Create `.env.local` with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Run

```bash
npm install
npm run dev
```

Default entry points:
- `/login`
- `/field`

## Notes

- Uses the existing backend OTP auth endpoints.
- Uses the shared `field-operations` backend module for leads, meetings, and feedback.
- Designed to scale from mobile screens to laptop/desktop screens.
