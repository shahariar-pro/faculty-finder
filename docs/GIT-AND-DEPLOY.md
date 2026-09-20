# Faculty-Finder: VS Code, Git & Vercel guide

Everything below is done from the **VS Code terminal** (open it with `` Ctrl + ` `` on Windows/Linux, `` Cmd + ` `` on Mac).
Lines starting with `#` are just comments, don't type them.

## 0. One-time setup

| You need | Get it from | Check it works |
| --- | --- | --- |
| Node.js 20 or newer (LTS) | nodejs.org | `node -v` |
| Git | git-scm.com | `git --version` |
| VS Code | code.visualstudio.com | — |
| GitHub account | github.com | — |

Tip: after installing Node or Git, **close and reopen VS Code** so the terminal sees them.

## 1. Open and run the project

- Unzip `faculty-finder.zip`
- VS Code → **File → Open Folder…** → pick the `faculty-finder` folder
- Open the terminal, then:

```bash
npm install
npm run dev
```

- Open **http://localhost:5173**
- To test on your phone (same Wi-Fi): `npm run dev -- --host`, then open the **Network** URL it prints on your phone
- Stop the server any time with `Ctrl + C`

## 2. Put in your real data

- Replace **`public/faculty.csv`** with your scraped CSV (keep the name `faculty.csv`)
- The included file is only placeholder sample data
- Save → the page reloads by itself
- Open the browser console (F12) in dev mode to see a short report: which columns matched, rows skipped, duplicates merged
- Column not recognised? Add its name to `src/lib/columns.ts`

## 3. Set your name and university (optional)

- `LICENSE` → replace `[YOUR NAME]`
- `.env` → `VITE_UNIVERSITY_NAME=AIUB` (change if needed)

## 4. First push to GitHub

**a) Tell Git who you are (only once per computer)**

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the same email as your GitHub account.

**b) Make the local repo and first commit**

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: Faculty-Finder"
```

**c) Create an empty repo on GitHub**

- github.com → **+** (top right) → **New repository**
- Name: `faculty-finder`
- Leave **README, .gitignore and license unchecked** (the project already has them)
- Click **Create repository** and copy the URL it shows, like `https://github.com/YOUR-USERNAME/faculty-finder.git`

**d) Connect and push**

```bash
git remote add origin https://github.com/YOUR-USERNAME/faculty-finder.git
git push -u origin main
```

- A browser window (or VS Code popup) will ask you to sign in to GitHub. Approve it.
- Refresh the GitHub page. Your code is there.

**Easier alternative (no commands):** VS Code → **Source Control** icon (left bar, or `Ctrl+Shift+G`) → after you make the first commit click **Publish Branch / Publish to GitHub**.

**If sign-in keeps failing:** install GitHub CLI (cli.github.com), run `gh auth login`, then push again.

## 4b. Everyday workflow

```bash
git status                       # what changed?
git add .                        # stage everything
git commit -m "Describe change"  # save a snapshot
git push                         # send to GitHub
```

- Same thing in the UI: Source Control panel → type message → **Commit** → **Sync Changes**
- Good messages: `Update faculty CSV`, `Fix mobile filter sheet`
- `node_modules/` and `dist/` are ignored automatically. Never commit them.

## 5. Updating the faculty list later

1. Replace `public/faculty.csv`
2. `git add .` → `git commit -m "Update faculty data"` → `git push`
3. Once Vercel is connected, it redeploys by itself in about a minute

## 6. Connect to Vercel (when you're ready)

1. vercel.com → sign up with **Continue with GitHub**
2. **Add New… → Project** → pick the `faculty-finder` repo → **Import**
3. Vercel auto-detects Vite. You can leave everything as is:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

4. (Optional) Open **Environment Variables** and add `VITE_UNIVERSITY_NAME`, `VITE_GITHUB_URL`, etc. See README.
5. Click **Deploy**. You get a link like `faculty-finder.vercel.app`.
6. Every `git push` to `main` now deploys automatically. Other branches get preview links.
7. Custom domain: **Project → Settings → Domains**.

After the first deploy, put your real URL into the `og:url` and `og:image` meta tags in `index.html` so link previews look good when shared on Facebook, Messenger or WhatsApp.

## 7. Common problems

| Problem | Fix |
| --- | --- |
| `git` or `node` "is not recognized" | Restart VS Code (or the whole computer) after installing |
| `npm install` errors | Check `node -v` is 20+ |
| Port 5173 busy | `npm run dev -- --port 3000` |
| `error: failed to push some refs` | `git pull --rebase origin main` then `git push` |
| `remote origin already exists` | `git remote set-url origin <your-repo-url>` |
| "Author identity unknown" | Do step 4a |
| Pushed the wrong thing | Fix it in a new commit and push again |
| Blank page after deploy | Check the build log in Vercel; run `npm run build` locally first |
| Direct link `/faculty/name` gives 404 | `vercel.json` handles this. Make sure it was committed |
| CSV shows old data | Hard refresh (Ctrl+Shift+R). The CSV isn't cached long, but browsers can hold it briefly |

## 8. Quick checklist before you share the link

- [ ] Real CSV in `public/faculty.csv`
- [ ] Search a name, a department, a designation
- [ ] Open a profile on your phone, tap Email and Call
- [ ] Try dark mode
- [ ] Filters open and close on your phone
- [ ] LICENSE name filled in
