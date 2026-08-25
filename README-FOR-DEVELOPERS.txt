PERI PROTOCOL - FULL APP SOURCE (for a developer)
==================================================

This is the complete source code of the "Peri Protocol" web app - a
perimenopause companion built from the book "Perimenopause Protocol Deluxe"
by Knox Ray (EPUB) and its Companion Tracker (PDF).

WHAT'S INSIDE
-------------
- Frontend:  Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
             Single-route SPA at src/app/page.tsx with 6 views
             (Today, Chapters, Tracker, Doctor, Labs, Toolkit).
- Backend:   Next.js API routes under src/app/api/
             /api/entries, /api/weekly, /api/doctor-visits, /api/labs
             (full CRUD, input validation, upserts).
- Database:  Prisma ORM + PostgreSQL (already configured for free hosts
             like Neon/Supabase — see DEPLOY below).
             Models: DailyEntry, WeeklyNote, DoctorVisit, LabResult.
- Content:   src/data/content.json - the full book parsed into structured
             JSON (19 chapters, 254 KB). Book images in public/book/.

RUN IT LOCALLY
-------------
Requirements: Node.js 20+ (or Bun 1.1+)
  1) Create a free Postgres database at neon.com and copy its connection
     string into a .env file as DATABASE_URL (see .env.example).
  2) npm install                (also runs "prisma generate" automatically)
  3) npx prisma db push         (creates the tables in your Neon database)
  4) npm run dev                (http://localhost:3000)

DEPLOY (free tier options)
--------------------------
- Vercel:  push this folder to a GitHub repo, "Import Project" on vercel.com.
           Add an environment variable DATABASE_URL set to your Neon (or
           Supabase) connection string in Project > Settings > Environment
           Variables, then Deploy. The schema already targets PostgreSQL,
           so no code changes are needed - just run
           "npx prisma db push" once (from your own computer, with the same
           DATABASE_URL in a local .env file) to create the tables before
           first use.
- Railway / Render / Fly.io: same idea - add the DATABASE_URL environment
  variable and deploy.

NOTES FOR THE DEVELOPER
-----------------------
- src/components/app/ contains all views + shared components.
- Content pipeline (if the book is ever updated): scripts/parse_epub.py
  rebuilds src/data/content.json from the EPUB.
- A no-server single-file version also exists (Peri-Protocol-Companion.html)
  that runs offline with localStorage - useful for sharing via WhatsApp.
- The app is single-profile (no auth). Add NextAuth.js if multi-user is needed.
- Keep the medical disclaimers and Safety Gates visible - that is a core
  requirement of this project.
