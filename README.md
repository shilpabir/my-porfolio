# Shilpa Portfolio — Next.js

This is a separate Next.js app based on the existing portfolio's design, copy,
projects, and media. The original Vite app is not modified. The first request
seeds the MongoDB `portfolioContents` collection with the original content;
after that, the database is the source of truth and updates are made in the
admin studio.

## Run locally

1. Install Node.js 20.9+ and start a local MongoDB server.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env.local`.
   Next.js does not load `.env.example` directly. The `.env.local` file must be
   inside this `portfolio-nextjs` folder (next to `package.json`).
4. Set a private `ADMIN_PATH`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env.local`.
   Set `SESSION_SECRET` to a random secret of at least 32 characters (for example,
   generate one with `openssl rand -base64 36`).
5. Keep `MONGODB_URI=mongodb://127.0.0.1:27017/shilpa-portfolio` for local MongoDB,
   or replace it with the MongoDB URL when available.
6. Run `npm run dev`.
7. Open `http://localhost:3000` for the portfolio and
   `http://localhost:3000/admin/<your-ADMIN_PATH>` for the private admin login.

Restart the Next.js dev server after creating or changing `.env.local`. If login
returns “Admin environment is incomplete”, check that the named variable is
present in `portfolio-nextjs/.env.local` and restart the server.

The admin session is signed, stored in an HTTP-only, same-site cookie, and expires
after eight hours. The admin path and credentials are read only from server
environment variables; never commit `.env.local`.

## Manage content

Sign in to add, edit, and remove projects using the project editor. Use
“Edit all portfolio content” to change any other text, links, page sections,
toolkit items, and settings in the same admin interface. Click “Save changes”
to write the updates to MongoDB. Unsupported `javascript:`, `data:`, and
`vbscript:` URLs are rejected.

Project images and videos can use public URLs or files placed in `public/assets/`
(for example, `/assets/my-project.jpg`). The initial assets and visual styles are
copied from the original project.

## Production

Configure the same environment variables with a production MongoDB URL and
strong, unique admin credentials, then run `npm run build` and `npm start`.
Use HTTPS in production so the admin session cookie is marked secure.
