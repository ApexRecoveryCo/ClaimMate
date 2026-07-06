# ClaimMate — Super Simple Start Guide

This shows you how to turn on the ClaimMate app on your computer.
Do the steps in order. Don't skip any. Copy-paste is your friend.

---

## What you need first (one-time setup)

You need to install 3 free helper programs. Click each link, download, and install like any normal app.

1. **Node** → https://nodejs.org (click the big "LTS" button)
2. **Docker Desktop** → https://www.docker.com/products/docker-desktop/ (install it, then **open it** — wait until its whale icon stops moving)
3. **Supabase** → open the black "Terminal" app on your computer, then copy-paste this line and press Enter:
   ```
   brew install supabase/tap/supabase
   ```
   *(That line is for a Mac. On Windows, follow: https://supabase.com/docs/guides/cli )*

> **What is the Terminal?** It's a plain window where you type instructions to the computer. On a Mac, press `Cmd + Space`, type `Terminal`, press Enter.

---

## Turn on the app (do this each time)

**Step 1 — Get the app.** Copy-paste these 3 lines into the Terminal, one at a time, pressing Enter after each:
```
git clone https://github.com/ApexRecoveryCo/ClaimMate.git
cd ClaimMate
git checkout claude/claimmate-phase-1-setup-s1gy89
```

**Step 2 — Install its pieces.** Copy-paste this and press Enter (it takes a minute):
```
npm install
```

**Step 3 — Start the engine.** Copy-paste this and press Enter (first time is slow — that's normal):
```
supabase start
```
When it finishes, it prints a list. Find the two lines that say **API URL** and **anon key**. Leave that window open — you'll need them in Step 4.

**Step 4 — Make the settings file.** Copy-paste this and press Enter:
```
cp .env.local.example .env.local
```
Now open the file `.env.local` (it's in the ClaimMate folder). Change these two lines so they match what Step 3 printed:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（paste the anon key here）
```
Save the file.

**Step 5 — Switch it on.** Copy-paste this and press Enter:
```
npm run dev
```
Leave this window open. It keeps the app running.

**Step 6 — Open it.** Open your web browser and go to:
```
http://localhost:3000
```

**Step 7 — Log in.** Click **Log in** and type:
- Email: `demo@claimmate.test`
- Password: `password123`

🎉 You're in! You'll see a pretend insurance claim. Click it to look around.

---

## To turn it off
- Click the `npm run dev` window and press `Ctrl + C`.
- Then type `supabase stop` and press Enter.

## If something breaks
Copy the red error message, paste it to me, and I'll tell you the fix.
