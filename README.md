# 10K Training Tracker

Personal 10K training plan viewer. Single-user, `localStorage`-backed, designed for iPhone home screen install.

---

## Prerequisites

- **Node.js 18+** installed (check with `node --version`). If you don't have it: https://nodejs.org
- **Git** installed.
- A **GitHub** account.
- A **Vercel** account (sign in with GitHub — no separate signup).

---

## 1. Run it locally first (optional but recommended)

From the project folder:

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). You should see the tracker. Once you're happy, stop the dev server (`Ctrl+C`).

---

## 2. Push to GitHub

If you have the GitHub CLI (`gh`):

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create 10K-tracker --private --source=. --remote=origin --push
```

Otherwise, create the repo manually at https://github.com/new (name it `10K-tracker`, set it private, don't add a README/.gitignore — those are already here), then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/10K-tracker.git
git push -u origin main
```

---

## 3. Deploy to Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to the `10K-tracker` repo.
3. Accept all defaults — Vercel auto-detects Vite. Just click **Deploy**.
4. Wait ~30 seconds. You'll get a URL like `https://10k-tracker-xyz.vercel.app`.

---

## 4. Add to iPhone home screen

This is the part that makes it feel like a real app.

1. Open the Vercel URL in **Safari** on your iPhone. *(Chrome won't give you a proper home screen icon — it adds a bookmark instead. Must be Safari.)*
2. Tap the **Share** button (square with up arrow).
3. Scroll down and tap **Add to Home Screen**.
4. The name will auto-fill as "10K". Tap **Add**.
5. A proper app icon appears on your home screen. Tapping it opens the tracker full-screen with no browser chrome — no address bar, no tab bar.

Your done/missed checkmarks are stored in the iPhone's Safari storage and persist across launches.

---

## Data notes

- State lives in `localStorage` under key `workout-status`. It's per-device, per-browser.
- If you install to home screen and then also visit the URL in desktop Safari or Chrome, those are **separate** stores — checkmarks won't sync. This is fine given you said you'll mostly use it on your phone.
- If you ever want to back up your progress, open the site in desktop browser DevTools → Application → Local Storage → copy the `workout-status` value.
- Uninstalling the home screen app **does** clear the data. Pinning it and leaving it alone is safe.

---

## Making changes later

Edit `src/App.jsx` (or any other file), then:

```bash
git add .
git commit -m "Describe the change"
git push
```

Vercel auto-rebuilds within ~30 seconds. Pull-to-refresh on your home screen app to get the new version.

---

## Project layout

```
10K-tracker/
├── public/
│   ├── favicon.svg              ← scalable icon for browser tab
│   ├── apple-touch-icon.png     ← 180x180 iOS home screen icon
│   ├── icon-192.png             ← PWA manifest icon
│   ├── icon-512.png             ← PWA manifest icon
│   └── manifest.webmanifest     ← enables "Add to Home Screen" app behavior
├── src/
│   ├── App.jsx                  ← the tracker UI and plan data (edit here)
│   ├── main.jsx                 ← React entry point
│   └── index.css                ← Tailwind directives + custom styles
├── index.html                   ← PWA meta tags, fonts, app title
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

All the plan data (weeks, workouts, paces) lives in `src/App.jsx` in the `WEEKS` array. When Phase 5 gets written after the 5-mile race, edit weeks 25–30 in that array, commit, push. Done.
