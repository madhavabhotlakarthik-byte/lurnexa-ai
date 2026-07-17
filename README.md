# Lurnexa — Learning, Reimagined by AI Agents

Lurnexa is a full-stack web platform where you type a single learning goal and a team of specialized AI agents (Curriculum, Content, Assessment, Tutor, Media) collaborate to generate a complete, personalized learning experience.

Built with **React 19 + TanStack Start (Vite 7)**, **Tailwind CSS v4**, **Supabase** (Auth / DB / Storage), and the **Lovable AI Gateway** (Gemini 3.5 Flash).

---

## 1. Run the project in VS Code

### Prerequisites
Install these once on your machine:
- **Node.js 20+** — https://nodejs.org
- **Bun** (recommended package manager for this project) — https://bun.sh
  - macOS / Linux: `curl -fsSL https://bun.sh/install | bash`
  - Windows (PowerShell): `powershell -c "irm bun.sh/install.ps1 | iex"`
- **VS Code** — https://code.visualstudio.com
- Recommended VS Code extensions:
  - **ESLint**
  - **Tailwind CSS IntelliSense**
  - **TypeScript and JavaScript Language Features** (built-in)

### Steps

1. **Open the project folder in VS Code**
   - `File → Open Folder…` and select the project root (the folder that contains `package.json`).

2. **Open the integrated terminal**
   - Menu: `Terminal → New Terminal` (or shortcut `` Ctrl + ` `` / `` Cmd + ` ``).

3. **Install dependencies**
   ```bash
   bun install
   ```
   (If you prefer npm: `npm install`.)

4. **Create your `.env` file** in the project root (see the API key section below for what goes inside).

5. **Start the dev server**
   ```bash
   bun run dev
   ```
   (or `npm run dev`)

6. Open the URL printed in the terminal — usually **http://localhost:8080** — in your browser. The app hot-reloads as you edit files.

### Other useful scripts
```bash
bun run build      # Production build
bun run preview    # Preview the production build locally
bun run lint       # Lint the codebase
```

---

## 2. Environment variables and API keys

The project needs the following variables at runtime. Create a file named `.env` in the project root:

```env
# Supabase (frontend / public — safe to expose)
VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
VITE_SUPABASE_PROJECT_ID="YOUR-PROJECT-REF"

# Lovable AI Gateway (server-side — used by the AI agents)
LOVABLE_API_KEY="your-lovable-api-key"
```

### How to change / rotate an API key

**Lovable AI Gateway key (`LOVABLE_API_KEY`)**
1. Open your `.env` file in VS Code.
2. Replace the value of `LOVABLE_API_KEY` with the new key.
3. Save the file.
4. Stop the dev server in the terminal (`Ctrl + C`) and run `bun run dev` again — env changes are only picked up on restart.

**Supabase publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`)**
- Same procedure: edit the value in `.env`, save, restart the dev server.
- You can find this key in your Supabase project settings under **API Keys**.

**If you deploy the app**, set the same variables in your hosting provider's environment variables panel (Vercel, Netlify, Cloudflare, etc.) — do **not** commit `.env` to git.

> Make sure `.env` is listed in `.gitignore` (it already is by default) so your keys never end up on GitHub.

---

## 3. Connect the project to GitHub

You can push this project to a new GitHub repository directly from VS Code.

### One-time setup
- Install **Git** — https://git-scm.com
- Sign in to GitHub inside VS Code: open the **Accounts** icon (bottom-left) → **Sign in with GitHub**.

### Push to a new repo

**Option A — from VS Code (easiest)**
1. Open the **Source Control** panel in VS Code (left sidebar, branch icon, or `Ctrl+Shift+G`).
2. Click **Initialize Repository**.
3. Stage all files (`+` next to *Changes*), type a commit message like `Initial commit`, and click **Commit**.
4. Click **Publish Branch** → choose **Publish to GitHub public/private repository** → pick a name.
   VS Code creates the repo on GitHub and pushes your code in one step.

**Option B — from the terminal**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### Daily workflow
- Edit files in VS Code.
- Open **Source Control**, stage changes, write a commit message, click **Commit**.
- Click **Sync Changes** (or run `git push`) to send them to GitHub.

---

## Project structure (quick tour)

```
src/
  routes/                     # File-based routes (TanStack Router)
    index.tsx                 # Marketing landing page
    auth.tsx                  # Sign in / sign up
    _authenticated/
      create.tsx              # Live agent orchestration
      courses.index.tsx       # Course library
      courses.$id.tsx         # Lesson + quiz + Socratic tutor
      profile.tsx             # User settings
  components/lurnexa/         # Design-system components
  lib/agents.functions.ts     # Multi-agent orchestration (server functions)
  integrations/supabase/      # Auto-generated Supabase client
  styles.css                  # Tailwind v4 + design tokens
```

---

## License
MIT
