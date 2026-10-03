# Notes

## Requirements
- Node.js 20+
- A Postgres database (i have used neon.tech db)
- Backend `.env: DATABASE_URL=YOUR_DB_URL`
- Frontend `.env : VITE_API_URL=http://localhost:5000`

## How to run

**Backend**
```bash
cd backend
npm install
npx prisma migrate deploy   # runs migrations
npx prisma db seed          # seeds inventory row (20 pairs)
npm run dev                 # starts on port 5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                 # starts on port 5173

Then -> Open http://localhost:5173
```
