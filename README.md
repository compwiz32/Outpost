# Bookmark archive

Self-hosted replacement for Pinboard. Static front end (`index.html`,
`add.html`) backed by Netlify Functions + Netlify Blobs — no external
database, no server to manage.

**[Try the live demo →](https://outpost-bookmarks.netlify.app/)**
Real bookmark data, fully interactive — add or edit anything, no
account or token needed. It resets to a baseline every 6 hours, so
don't be shy. (Deletes and bulk-restore still require a token, so it
can't be wiped entirely — see "running a public demo" below for how
this works.)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/compwiz32/Outpost)

Click the button (after updating the URL above with your fork's path),
or follow the manual steps below — either way you'll end up with your
own copy running on your own Netlify account, backed by your own
private data store. Nothing here is shared between deployments.

## Features

- **Archive** (`index.html`) — two-column layout: bookmarks on the left
  (sorted A-Z by title), a sticky tag sidebar on the right (sorted A-Z,
  with its own filter box to narrow the chip list). Full-text search
  across title/notes (press `/` anywhere to focus it, `Esc` to clear).
  Click a tag chip to filter the list to that tag.
- **Add** (`add.html`) — opened by the bookmarklet or the "+ add" link.
  Tags are a chip input: typing shows autocomplete suggestions from your
  existing tags; anything that doesn't match becomes a new tag when you
  press Enter/comma or submit.
- **Edit** — every row in the archive has an `edit` link that reopens
  `add.html` pre-filled with that bookmark's data (`/add.html?id=...`)
  and updates it in place on save, instead of creating a duplicate.
- **Delete** — every row has a `delete` button (confirms, then removes
  it from the live store immediately).
- **Import** (`import.html`) — upload a Netscape Bookmark HTML file
  (the standard browser export format) or a JSON file in this
  project's format; merges by default (skips URLs already present) or
  can replace the whole store for restoring backups.
- **Export** — JSON, CSV, or TXT, covering everything regardless of
  active search/filter.

## Files

- `public/index.html` — the archive: search, tag sidebar, edit/delete
- `public/add.html` — the add/edit form the bookmarklet and "edit" links open
- `public/import.html` — bulk import from Netscape Bookmark HTML or JSON
- `netlify/functions/_store.js` — shared Netlify Blobs + auth helpers
- `netlify/functions/list.js` — public read endpoint
- `netlify/functions/add.js` — token-protected add/update — matches an existing bookmark by `id` (editing) or `url` (re-adding), updating it in place instead of creating a duplicate
- `netlify/functions/delete.js` — token-protected delete
- `netlify/functions/seed.js` — token-protected bulk import/restore
- `netlify/functions/config.js` — public endpoint exposing whether `DEMO_MODE` is on
- `netlify/functions/reset-demo.js` — scheduled function that resets a demo deployment (see below)
- `netlify/functions/set-baseline.js` — token-protected: snapshots the current live bookmarks as the reset target
- `Convert-PinboardExport.ps1` — one-time migration from your old Pinboard export
- `bookmarklet.txt` — the browser bookmarklet source
- `netlify.toml` — tells Netlify to publish `public/` and build functions from `netlify/functions/`
- `LICENSE` — MIT

`netlify.toml` only publishes the `public/` folder, so the migration
script, your raw Pinboard export, and this README never end up served on
the live site.

## Deploy

1. Push this whole folder to a GitHub repo (private is fine).
2. Netlify → **Add new site → Import an existing project → Deploy with
   GitHub** → pick the repo. Leave build command blank — `netlify.toml`
   handles the functions setup. Netlify runs `npm install` automatically
   because of `package.json`.
3. Once deployed, note your site URL (e.g. `https://your-site-name.netlify.app`).

## Set your write token

This becomes your personal password for adding/editing/deleting
bookmarks — any sufficiently long random string works. Pick whichever
of these is easiest:

**PowerShell (Windows)**

```powershell
-join ((48..57)+(97..122)|Get-Random -Count 32|%{[char]$_})
```

**macOS / Linux (bash/zsh)**

```bash
openssl rand -hex 24
```

**Node.js** (already required by this project, so it's always available)

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

**Python**

```bash
python3 -c "import secrets; print(secrets.token_hex(24))"
```

**No terminal handy?** Your password manager's generator (1Password,
Bitwarden, etc.) works fine — set it to 32+ characters, letters and
numbers only (skip symbols, since this gets pasted into an HTTP
header). Or just mash the keyboard for 30+ random characters; length
and unpredictability matter more than the exact method.

Once you have one:

1. Netlify dashboard → **Site settings → Environment variables** → add
   `ADD_TOKEN` = that value → redeploy (or it applies on next deploy).
2. Keep the token somewhere you can get to it — you'll paste it once into
   `add.html` (it saves to that browser's `localStorage` after) and once
   when running the migration below.

## Migrate your existing bookmarks

**Easiest: the in-app importer.** Go to `/import.html` (or click "import"
in the archive header), pick a file, and upload. It accepts two formats:

- A **Netscape Bookmark HTML** file — the standard export format from
  Chrome, Firefox, Safari, and Edge (usually "Export bookmarks..." in
  your browser's bookmark manager).
- A **JSON** file already shaped like this project's own data —
  `[{title, url, notes, tags, date}, ...]` — which is exactly what the
  archive's own "export" button produces, or what
  `Convert-PinboardExport.ps1` (below) outputs.

By default it **merges**: anything already in your archive (matched by
URL) is left alone, only new bookmarks get added. There's also a
clearly-marked "replace everything" option for restoring a full backup
instead.

**Coming from [Pinboard](https://pinboard.in) specifically:** Pinboard's
own export format (Settings → Backup) doesn't match either format
above, so run it through `Convert-PinboardExport.ps1` first to reshape
it, then feed the result into `/import.html` same as any other JSON
file:

```powershell
.\Convert-PinboardExport.ps1 -ExportPath .\pinboard_export.json -OutputPath .\seed.json
```

It's PowerShell, but not Windows-only —
[PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
runs the same on macOS and Linux (`pwsh` instead of `powershell`).

**Scripting/automation instead of the UI:** the `seed` endpoint just
needs a JSON array of `{id, title, url, domain, notes, tags, date}`
objects POSTed with your token — this is what `/import.html` does under
the hood, and what the "replace everything" option maps to directly:

```powershell
$token = "paste-your-ADD_TOKEN-here"
$site  = "https://your-site.netlify.app"
$body  = Get-Content .\seed.json -Raw
Invoke-RestMethod -Uri "$site/.netlify/functions/seed" -Method Post `
  -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
```

This particular call **overwrites the whole store** with exactly what's
in the file — there's no merge option at the raw API level, only in
`/import.html`'s UI.

## Install the bookmarklet

1. Open `bookmarklet.txt`, replace `YOUR-SITE` with your actual Netlify
   site name.
2. Show your browser's bookmarks bar, create a new bookmark, name it
   something like "+ Add", and paste the edited `javascript:...` line in
   as the URL/location.
3. On any page you want to save: click the bookmarklet → a small popup
   opens pre-filled with that page's URL and title → add tags/notes →
   Save. First time, it'll ask for your token and remember it on that
   device from then on.

On mobile (iOS Safari and Chrome both support bookmarklets, just added a
little differently than desktop — happy to walk through that separately
if it's fiddly): add the archive itself (`index.html`) to your home
screen for quick browsing, and add the bookmarklet via the Share sheet's
"Add Bookmark" if your browser exposes it, or by editing an existing
bookmark's URL in the browser's bookmark manager.

## Ongoing use

No more export/rebuild/push cycle — add, edit, and delete all write
straight to the live store via Netlify Blobs, and `index.html` always
reflects current data on load. Add via the bookmarklet or "+ add";
edit or delete any entry directly from its row in the archive.

## Optional: running a public demo

If you want a second deployment that lets visitors try adding
bookmarks without your token, set the `DEMO_MODE` environment variable
to `true` on that site (leave it unset on your real deployment):

- `add.js` skips the token check when `DEMO_MODE` is set, so anyone
  can add or edit a bookmark. `delete.js` and `seed.js` are
  unaffected — visitors can't delete anything or wipe/replace the
  whole store, token still required for those.
- `public/add.html` and `public/index.html` both check a small public
  `/.netlify/functions/config` endpoint to detect demo mode and show a
  banner / skip the token prompt accordingly.
- `netlify/functions/reset-demo.js` is a
  [Netlify Scheduled Function](https://docs.netlify.com/functions/scheduled-functions/)
  (`config.schedule` in the file — defaults to every 6 hours) that
  restores the store to a baseline, undoing anything visitors added or
  changed. **The baseline lives in that site's own Netlify Blobs store,
  not in git** — deliberately, so a demo can hold real bookmark data
  without any of it ever touching the repo (public or private). Seed
  the demo with whatever data you want visible (via `/import.html` or
  `seed`), then call `set-baseline` once to lock that in as the reset
  target:

  ```powershell
  $token = "your-demo-sites-ADD_TOKEN"
  $site  = "https://your-demo-site.netlify.app"
  Invoke-RestMethod -Uri "$site/.netlify/functions/set-baseline" -Method Post `
    -Headers @{ Authorization = "Bearer $token" }
  ```

  Until you've done this once, `reset-demo.js` finds no baseline and
  skips the reset entirely rather than wiping the store to empty.

## Security notes

- `add`, `delete`, and `seed` all require `Authorization: Bearer
  <ADD_TOKEN>` and reject non-`http(s)` URLs; the token is compared in
  constant time to avoid timing attacks. The one exception is `add` on a
  deployment with `DEMO_MODE` set — see "running a public demo" above.
- `list` (reading the archive) is **not** authenticated — anyone with
  the site URL can view your full bookmark list. This was a deliberate
  call to keep things simple for a single-user tool; revisit with
  Basic Auth (a Netlify Edge Function) if that stops being acceptable.
- Because writes are gated by a custom header (not a cookie), they're
  not exploitable via classic CSRF from another site.

## License

MIT — see `LICENSE`. Use it, fork it, change it.
