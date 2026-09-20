# Faculty-Finder
🔗 **Live site:** [aiubfaculty.vercel.app](https://aiubfaculty.vercel.app)

A fast, mobile-first faculty directory. Drop in a CSV, deploy to Vercel or Netlify, done.

**Search → discover → filter → open profile → contact.** No backend, no database, no API keys.

## Features

- **Instant search** by name, department or designation (partial words, any case, accents ignored, typo-tolerant fallback, matches highlighted)
- **Filters** for department, designation and faculty type — sidebar on desktop, bottom sheet on phones
- **Quick department chips** on mobile and a dedicated **Departments** page
- **Faculty cards** with one-tap Email, Call and Copy email
- **Profile drawer** (bottom sheet on phones) with education, research interests, office, links, *Copy link* and *Save contact* (.vcf)
- Shareable URLs: `/?q=sara&dept=English` and `/faculty/sara-khan`
- Light theme by default, hand-tuned dark theme, remembered between visits
- Keyboard friendly: press `/` (or `Ctrl/Cmd + K`) to search, `Esc` to close
- Accessible: semantic HTML, visible focus, focus trap in dialogs, live result counts, reduced-motion support
- Tolerant data layer: messy CSVs won't crash the app (see below)


## Admin panel — updating the faculty data

Go to **`/admin`** on your deployed site (or `http://localhost:5173/admin` during dev).

| Step | What to do |
| --- | --- |
| 1 | Log in with the admin password (default: `admin1234` — change it!) |
| 2 | Drop your new CSV or JSON from the AIUB website onto the upload zone |
| 3 | Review the preview — column mapping, record count, sample rows |
| 4 | **Apply to this device** → stores the data in *your* browser; useful for previewing before deploying |
| 5 | **Download as faculty.json** → saves the processed file; replace `public/faculty.json` in the repo, `git push`, done |

Vercel redeploys in ~60 seconds after a push. Everyone sees the new data.

**Changing the admin password:**
Set `VITE_ADMIN_PASSWORD=your-strong-password` in `.env.local` or in Vercel's *Project → Settings → Environment Variables*, then redeploy.

## Quick start

You need **Node.js 20+** and **npm**.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To try it on your phone (same Wi-Fi): `npm run dev -- --host` and open the "Network" URL it prints.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests (CSV parser, normalizer, search) |
| `npm run typecheck` | TypeScript check only |

## Updating the faculty data

The app reads **`public/faculty.csv`** in the browser. To update the directory:

1. Replace `public/faculty.csv` with your new file (UTF-8; comma, semicolon or tab separated).
2. Commit and push. Vercel/Netlify redeploy automatically.

> The file that ships with the project contains **placeholder sample rows** (`@example.edu`) so you can see the UI. Replace it with your real CSV.

### Column names

Headers are matched loosely (case, spaces and punctuation are ignored), so `Email Address`, `email_address` and `EMAIL` all work. Recognised columns:

| Field | Accepted header names (examples) |
| --- | --- |
| Name *(required)* | Name, Full Name, Faculty Name, or First Name + Last Name |
| Department | Department, Dept |
| Designation | Designation, Position, Rank, Job Title, Title |
| Faculty type | Faculty Type, Employment Type, Type |
| Email | Email, Email Address, Mail |
| Phone | Phone, Mobile, Contact Number |
| Office | Office, Room, Cabin, Location |
| Profile link | Profile URL, Profile, Website, Link |
| Photo | Image URL, Photo, Picture, Avatar |
| Education | Education, Qualification |
| Research | Research Interests, Research Area, Expertise |

- Any **other columns** are kept and shown as extra rows in the profile.
- Only fields that exist are displayed. Nothing is invented.
- Lists (education, research) can be separated with `;` or `|`.
- Missing a header name? Add it to `src/lib/columns.ts` — it's one line.

### What the normalizer cleans up

Extra whitespace · ALL CAPS / all lowercase names, departments and designations · inconsistent department spellings (grouped into one) · duplicate people (merged by email, or name + department) · invalid emails · `N/A`, `-` and other placeholders · invalid or unsafe URLs · rows without a name (skipped) · broken photos (initials avatar is shown instead).

Relative image/profile links from a scraped CSV (like `/uploads/a.jpg`) work if you set `VITE_ASSET_BASE_URL` (see below).

In dev mode, the browser console prints a short report of what was matched and skipped.

## Configuration (environment variables)

All optional. Defaults live in `.env`; override in `.env.local` or in your host's dashboard (Vercel: *Project → Settings → Environment Variables*). Rebuild after changing them.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_UNIVERSITY_NAME` | `AIUB` | Shown in hero text, page title and footer |
| `VITE_GITHUB_URL` | *(empty)* | Shows a GitHub link when set |
| `VITE_CSV_URL` | `/faculty.csv` | Where to load the CSV from |
| `VITE_ASSET_BASE_URL` | *(empty)* | Base URL for relative image/profile links in the CSV |

## Deploy

**Vercel** — *Add New → Project → import your GitHub repo.* Vercel detects Vite automatically (build `npm run build`, output `dist`). `vercel.json` already handles clean URLs like `/faculty/sara-khan`.

**Netlify** — *Add new site → Import from Git.* `netlify.toml` has the build settings and SPA redirect.

After your first deploy, add your real URL to the `og:url` / `og:image` tags in `index.html` (see the TODO comment) for nicer link previews.

## Project structure

```
public/
  faculty.csv          <- your data
src/
  data/loadFaculty.ts  <- fetch CSV -> parse -> normalize
  lib/
    csv.ts             <- dependency-free CSV parser
    columns.ts         <- header aliases (edit to support new column names)
    normalize.ts       <- cleaning, dedupe, slugs
    search.ts          <- search scoring, typo tolerance, filters, facets
    text.ts            <- folding, highlighting, small helpers
    url.ts / contact.ts
  hooks/               <- data loading, theme, routing
  components/          <- UI (cards, filters, profile sheet, states ...)
  styles/              <- tokens.css (colours/type), base.css, components.css
  types/faculty.ts     <- the Faculty model
```

Data flows one way: `CSV → parser → normalizer → Faculty[] → search/filter → UI`. The UI never touches raw CSV.

## Customising the look

Colours, fonts and radii are CSS variables in `src/styles/tokens.css`. Each department automatically gets its own colour (avatar tint and dot) derived from its name.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small, focused pull requests are very welcome.

## Data note

Faculty details are compiled from the university's public website and may go out of date. Always confirm with the department. If you host a public fork, make sure you're comfortable publishing the data in your CSV.

## License

MIT (placeholder) — see [LICENSE](LICENSE). Replace `[YOUR NAME]` with yours.
