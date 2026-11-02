# One-Day Guide: SPA Booking System (SIA, Independent Track)

## Read this first

1. **90 of 100 points are individual**: Git commits (30), live code defense (25), explaining your MVC/joins (20), Q&A (15). A small slice that you fully understand beats a big one you cannot explain.
2. Your course checklist says every submitted line must be **your own work (no AI-generated code, tutorial code, or templates)**. This starter was generated for you, so before you rely on it, **ask your instructor if a starter is allowed**. If it is not, use it only as study material and write your own versions. Either way, you will be asked to explain lines and make a live change, so type your slice yourself and understand it.
3. The grader looks at Git history: commit **from your own computer and your own GitHub account**, in small steps, through branches and pull requests, merged with **"Create a merge commit"** (never squash). No editing in the GitHub web editor.

## What the project must have (from your Final_Project.docx, 6 members)

- Node.js MVC backend (`models/`, `controllers/`, `routes/`) + separate frontend using JSON
- At least **16 tables**, 6 join reports (INNER, LEFT/RIGHT and FULL OUTER each used at least once), 6 complete resources (GET, POST, PUT/PATCH, DELETE)
- 1 major feature (ours: **automatic scheduling conflict detection** + booking workflow), split between 2 owners
- Correct status codes (200, 201, 400, 401/403, 404, 500), consistent JSON, loading and error feedback in the frontend
- Each member: ≥2 tables, 1 complete resource, 1 join report, 1 screen
- Repo needs: README with roster + ownership matrix, SQL script, ER diagram, endpoint list, `.env.example`

## Timeline for ONE day (about 12 hours; adjust the clock to your start)

| Time | Everyone | Goal |
|---|---|---|
| 0:00–0:45 | **Setup** (Step 1–3 below) | App runs on every laptop |
| 0:45–1:30 | **Learn the pattern**: trace one request through the `branches` files | Everyone can explain Route → Controller → Model → DB |
| 1:30–2:00 | **First commit + PR** (Step 4) | Every member has a commit and one PR |
| 2:00–5:30 | **Backend of your slice**: Model → Controller → Route, test with Thunder Client | Your endpoints return correct JSON and status codes |
| 5:30–7:30 | **Frontend screen** for your slice | Screen uses all your endpoints, shows loading + errors |
| 7:30–9:00 | **Join report + unique feature wiring** (C+D+E must connect) | Booking create returns 409 on conflict |
| 9:00–10:00 | **Merge everything**, fix bugs, seed demo data | Full demo works from login to report |
| 10:00–11:30 | **Rehearse defense**, finish README, draw ER diagram | Each member explains their slice without notes |
| last 30 min | Final `git pull`, run check, push, verify on GitHub | Everything is on `main` |

**Commit rhythm:** one commit each time something small works (model done, controller done, route done, screen done, bug fixed). Aim for **8–12 commits each**. Run `git shortlog -sne --no-merges HEAD` at hour 6; for 6 members, anyone under 8% of commits is a red flag.

**If you run out of time, cut in this order:** styling → reviews → payments → promotions extras. **Never cut:** your per-member minimum, the three join types, the unique feature with its edge case.

---

## Step 1: Install tools (all 6 members)

1. **Node.js 24 LTS** from nodejs.org (we need 22.13 or newer). Check: open a terminal and run `node --version`.
2. **Git** from git-scm.com. **VS Code** from code.visualstudio.com.
3. In VS Code, install the extension **Thunder Client** (for testing the API).
4. A **GitHub account** each.

Set your Git identity (use the SAME email as your GitHub account, or your commits will not count as yours):

```
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
git config user.email
```

## Step 2: One person (the "Repo Keeper", suggest Member A) creates the repo

1. On GitHub: New repository → name `spa-booking-sia` → **Public** → no README.
2. Unzip the starter, open a terminal inside the `spa-booking-sia` folder:
   ```
   git init
   git add .
   git commit -m "chore: add project starter"
   git branch -M main
   git remote add origin https://github.com/<keeper-username>/spa-booking-sia.git
   git push -u origin main
   ```
3. GitHub → Settings → Collaborators → add the other 5 members.
4. GitHub → Settings → Branches → add a rule for `main`: **Require a pull request before merging**.

## Step 3: Everyone clones and runs it

```
git clone https://github.com/<keeper-username>/spa-booking-sia.git
cd spa-booking-sia/backend
npm install
copy .env.example .env        (Mac/Linux: cp .env.example .env)
npm run setup
npm run dev
```

Open **http://localhost:3000** → log in with `admin@spa.test` / `admin123` → you should see the Branches screen.

Every member has their **own local database file** (`spa.db`, not committed). The schema and sample data live in `schema.sql` and `seed.sql`, so everyone gets the same data by running `npm run setup`. If you change a table, edit `schema.sql`, commit it, tell the team, and everyone re-runs `npm run setup`.

Errors? `npm: command not found` → reinstall Node and reopen the terminal. `Missing JWT_SECRET` → you skipped the `.env` copy.

## Step 4: Your first commit (everyone, together, 30 minutes)

Do this to learn the Git loop that will earn you the 30 Git points.

```
git checkout -b feature/<yourname>-first-commit
```
1. Open `README.md`, fill **your row** in the roster and ownership matrix.
2. Save, then:
   ```
   git add README.md
   git commit -m "docs: add <yourname> to ownership matrix"
   git push -u origin feature/<yourname>-first-commit
   ```
3. On GitHub click **Compare & pull request** → create it.
4. A teammate (not you) reviews it and clicks **Create a merge commit** (not "Squash", not "Rebase").
5. Back in your terminal: `git checkout main` then `git pull`.

The README table is shared, so a few small merge conflicts are normal here. Pull `main` first, fix the conflict in VS Code, commit again.

**Daily Git loop for the rest of the day:**
```
git checkout main && git pull                 (start from the latest)
git checkout -b feature/<yourname>-<thing>    (one branch per small task)
... write code ...
git add <your files>
git commit -m "feat: add services model"
git push -u origin feature/<yourname>-<thing>
→ open PR on GitHub → someone else reviews → merge commit
```
Commit prefixes: `feat:` new thing, `fix:` bug, `docs:` text, `refactor:` cleanup. Reviewer rotation: A→B→C→D→E→F→A.

## Step 5: Understand the pattern before you write code

A request travels like this (this is the 2-minute explanation everyone must be able to give):

```
Screen (branches.html)  →  fetch('/api/branches')            [frontend/js/api.js]
   → Route       routes/branches.routes.js      "GET /  → which controller function?"
   → Middleware  middleware/auth.js             "is there a valid token? (401)  right role? (403)"
   → Controller  controllers/branches.controller.js   "clean the input, call the model, choose the status code"
   → Model       models/branches.model.js       "validate, run SQL"
   → Database    database/spa.db
   ← JSON back:  { success, message, data }     → the screen draws the table
```

Read the `branches` files **in this order**: model → controller → routes → `branches.html`. Then open `users.model.js`: `findByEmail` contains an `INNER JOIN` you can study.

**Status codes you must be able to explain:** 200 OK, 201 Created, 400 bad input (validation), 401 not logged in, 403 logged in but not allowed, 404 not found, 409 conflict (our double-booking), 500 server bug.

## Step 6: Build your slice

Open `docs/SLICE_CARDS.md` and find your letter. Work in this order, committing after each:

1. `models/<name>.model.js`: `validate`, `findAll`, `findById`, `create`, `update`, `remove`
2. `controllers/<name>.controller.js`: sanitize input, call model, return the right status code
3. `routes/<name>.routes.js`: connect URLs. It loads automatically, no other file to edit.
4. **Test in Thunder Client** before touching the frontend: first `POST /api/auth/login`, copy the `token`, then add the header `Authorization: Bearer <token>` to your other requests.
5. Frontend screen `frontend/<name>.html` (copy `branches.html` as your *model* of how it works, then change fields). Add loading text and an error box (already in the helper functions).
6. Your join report endpoint + a small table on your screen.
7. Add your link to `frontend/js/nav.js` if it is not there.

Test every endpoint for: success, missing field (400), wrong id (404), not logged in (401), wrong role (403).

## Step 7: Integration (hour 7.5–9)

- **C ↔ D:** C calls `Availability.checkConflicts(...)`; D's real version replaces the stub. Agree on the function signature (it is written in `availability.model.js`).
- **C ↔ E:** when C creates a booking, a `booking_status_history` row is written (E can provide a helper). E's workflow endpoint changes the status.
- **F** reads everything: seed realistic data so the dashboard is not empty.

## Step 8: Prepare the demo and defense

Demo script (12 minutes, every member drives their own part):
1. Log in → create a booking (C) → show it saved.
2. Unique feature: try to double-book the therapist → **409**. Show the tricky edge case: therapist free at 11:00 but the room is blocked until 11:15 (D).
3. Change booking status through the workflow, show the history and an alert (E).
4. Show the join reports: INNER (A/C), LEFT (B/D), RIGHT (F), FULL OUTER (E).
5. Open the browser Network tab for one screen to show the API call.
6. Finish with the ER diagram and the MVC folder structure (1 minute).

Defense prep for each person (5 minutes of walking through your code + 5 minutes of Q&A):
- Pick a file you wrote and explain it line by line, out loud, to a teammate.
- Practise a live change: add a field, change a join, return a different status code.
- Be ready for `git blame`: "who wrote this line?"
- Know the schema and why each of your tables exists.
- Know why you used your join type (what rows would be missing with a different type).

## Final checklist

- [ ] README: roster + ownership matrix filled, how to run
- [ ] `schema.sql` + `seed.sql` committed, ER diagram added in `docs/`
- [ ] Endpoint list in README
- [ ] `.env.example` committed, no real `.env`
- [ ] Everyone has commits on their own account and at least one PR merged and one reviewed
- [ ] Everything merged into `main` and pushed before the deadline
