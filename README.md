# CyberSense

CyberSense is a phishing-awareness web app that lets users scan suspicious links, SMS messages, and emails with AI assistance. The frontend sends requests to a serverless function (`/api/analyze`), which calls Google's Gemini API on the server side — so your API key never touches the browser.

This guide is written for someone setting up the project for the very first time. It walks through installing the required software, getting your own Gemini API key, running the project on your computer, and deploying it live with Vercel.

---

## 1. What you'll need (prerequisites)

Before touching the project, install these three things. If you already have them, you can skip ahead — just confirm the versions.

### 1.1 A code editor
Any editor works, but [Visual Studio Code](https://code.visualstudio.com/) is a common free choice. Download and install it for your OS.

### 1.2 Git
Git is the tool used to download ("clone") the project from GitHub and track changes.

- Download it from [git-scm.com](https://git-scm.com/downloads).
- Install with the default options.
- Confirm it worked by opening a terminal (Command Prompt, PowerShell, or macOS/Linux Terminal) and running:
  ```bash
  git --version
  ```
  You should see something like `git version 2.4x.x`.

### 1.3 Node.js (includes npm)
Node.js lets you run JavaScript outside the browser, and npm (Node Package Manager) installs project dependencies like the Vercel CLI.

- Go to [nodejs.org](https://nodejs.org/) and download the **LTS** (Long-Term Support) version — this is the stable, recommended version for most users.
- Install with the default options.
- Confirm it worked:
  ```bash
  node -v
  npm -v
  ```
  Both commands should print version numbers (e.g. `v20.x.x` and `10.x.x`).

### 1.4 A Vercel account
This project is built to run through **Vercel** (a hosting platform for frontend + serverless projects), even for local development, because the frontend calls `/api/analyze`, which only exists as a Vercel serverless function.

- Go to [vercel.com](https://vercel.com/) and sign up (you can sign up with your GitHub account — this is convenient since you'll likely also want a GitHub account for step 2).

### 1.5 A GitHub account (recommended)
Not strictly required to run the project locally, but you'll want this if you plan to deploy your own copy or make changes and save them online.

- Sign up at [github.com](https://github.com/) if you don't already have an account.

---

## 2. Getting the project onto your computer

Open a terminal, navigate to the folder where you want the project to live, then run:

```bash
git clone <repository-url>
cd CYBERSENSE
```

Replace `<repository-url>` with the actual GitHub URL of this repository. If you downloaded the project as a ZIP file instead, just extract it and `cd` into the extracted folder.

### Expected folder structure

Once inside the project, you should see exactly this:

```
CYBERSENSE/
├── .vercel/            (auto-generated later by the Vercel CLI — ignore for now)
├── api/
│   └── analyze.js      # serverless function that talks to Gemini
├── assets/
│   └── logo.jpg
├── .env                # you will create this — holds your secret API key
├── .gitignore
├── index.html           # the entire site — home, scanner, how it works, about, and chat widget all live here as one page
├── new.css              # all styling
├── script.js             # frontend logic
├── vercel.json
└── README.md
```

Unlike some earlier versions of this project, everything is now a **single page**: `index.html` contains the hero/home section, the scanner tool, the "how it works" content, and the "about" content all in one file, navigated via in-page anchors/sections rather than separate HTML files. There is no `scanner.html`, `about.html`, or `how-it-works.html` — if you see those, you're looking at an outdated copy.

If any of the files above are missing, double check the clone/extraction completed successfully.

---

## 3. Getting a Gemini API key and endpoint

The scanner needs an AI backend to analyze text. This project uses Google's **Gemini API**, accessed through its OpenAI-compatible endpoint.

### 3.1 Create your API key

1. Go to **[Google AI Studio](https://aistudio.google.com/)** and sign in with any Google account.
2. In the left sidebar, click **Get API key**.
3. Click **Create API key**.
4. Choose an existing Google Cloud project, or let AI Studio create one for you automatically — you do not need a billing account to get started on the free tier.
5. Click **Create key**. Your key will appear as a string starting with `AIza...`.
6. **Copy it immediately** and save it somewhere safe (like a password manager). You can view it again later in AI Studio, but it's good practice to store it securely right away.

> **Free tier note:** Google AI Studio gives you a free tier with limited requests per minute/day. This is enough for testing and personal projects. If you hit rate limits, you can enable billing on the linked Google Cloud project for higher limits.

> **Security note (2026):** Google now recommends restricting your key (limiting it to the Generative Language API) directly in AI Studio, since unrestricted keys are increasingly blocked. Keys created in AI Studio today are restricted by default — just avoid removing that restriction.

### 3.2 Get the endpoint

This project calls Gemini through Google's OpenAI-compatible endpoint, so your `.env` should use:

```
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

This is a fixed URL provided by Google — you don't need to create or configure it yourself, just copy it as-is.

### 3.3 Confirm the model name

`analyze.js` currently requests a model called `gemini-flash-latest`. Google periodically updates model names (e.g. `gemini-2.5-flash`, `gemini-3.x-flash`). If you get a "model not found" error later, open **Google AI Studio → API Keys/Models** or the [Gemini models documentation](https://ai.google.dev/gemini-api/docs/models) to find the current valid model name, and update it in `api/analyze.js`:

```js
const body = {
  model: 'gemini-flash-latest', // <-- update if this model name is deprecated
  ...
};
```

---

## 4. Setting up your environment variables

The project needs your API key and endpoint available as environment variables, but they must **never** be committed to Git (this is why `.env` is listed in `.gitignore`).

1. In the root of the project folder, create a new file named exactly `.env`.
2. Paste in the following, replacing the placeholder with your real key:

   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
   ```

3. Save the file. Double-check `.env` is listed in `.gitignore` so it never gets pushed to GitHub.

---

## 5. Installing the Vercel CLI and running the project locally

Because the frontend calls `/api/analyze` (a serverless function), opening `index.html` directly in your browser will **not** work — the scanner will fail to reach the AI. You need to run the project through Vercel's local development server, which simulates the serverless environment.

### 5.1 Install the Vercel CLI

In your terminal, from inside the project folder, run:

```bash
npm install -g vercel
```

This installs the `vercel` command globally on your machine. Confirm it worked:

```bash
vercel --version
```

### 5.2 Log in to Vercel

```bash
vercel login
```

This will open a browser window (or ask for your email) so you can authenticate with the account you created in step 1.4.

### 5.3 Run the project locally

From the project root, run:

```bash
vercel dev
```

The first time you run this, it may ask a few setup questions (which Vercel account/project to link — just follow the prompts and accept the defaults for a new project). It will also detect your `.env` file for local environment variables.

Once it's running, open your browser to:

```
http://localhost:3000
```

You should see the CyberSense homepage. Click **Scan now**, paste a test link, message, or email, and confirm you get a result back — this confirms your API key and endpoint are working correctly.

---

## 6. Making changes

- **`index.html`** controls the structure and content of the entire site — home, scanner, how it works, and about all live here as sections in one file.
- **`new.css`** controls all visual styling (colors, layout, animations).
- **`script.js`** controls frontend behavior — tab switching, sending scan requests, and the chat widget.
- **`api/analyze.js`** is the serverless backend — this is the *only* file that knows your API key, and the only place that talks to Gemini.

While `vercel dev` is running, most changes to HTML/CSS/JS are reflected when you refresh the browser. If you change `.env`, stop the server (`Ctrl+C`) and run `vercel dev` again to reload the new values.

---

## 7. Deploying your own live version to Vercel

Once everything works locally, you can put it online for free using Vercel.

### 7.1 Push your project to GitHub (if you haven't already)

If your project isn't already a Git repository connected to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository on [github.com](https://github.com/new), and follow the instructions it gives you to push your local project, which will look like:

```bash
git remote add origin <your-new-repo-url>
git branch -M main
git push -u origin main
```

Since `.env` is in `.gitignore`, your API key will **not** be uploaded — this is intentional and important.

### 7.2 Deploy with the Vercel CLI

From the project root, run:

```bash
vercel
```

Follow the prompts:
- Confirm you want to set up and deploy the project.
- Choose your Vercel account/scope.
- Link it to a new project (accept the default project name or choose your own).
- Accept the default settings for build/output — this is a static + serverless project, so Vercel will detect it automatically.

This creates a **preview deployment** and gives you a URL to test.

### 7.3 Add your environment variables in Vercel

Your `.env` file only works locally — Vercel does not read it in production. You must add the same variables in the Vercel dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) and open your project.
2. Go to **Settings → Environment Variables**.
3. Add:
   - `GEMINI_API_KEY` → your key from step 3.1
   - `GEMINI_ENDPOINT` → `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
4. Save.

### 7.4 Deploy to production

Once your environment variables are set, redeploy so the production build picks them up:

```bash
vercel --prod
```

Vercel will give you a live production URL (something like `your-project-name.vercel.app`). Open it and test the scanner exactly like you did locally — it should now work live on the internet for anyone with the link.

> Alternatively, instead of using the CLI for deployment, you can connect your GitHub repository directly in the Vercel dashboard (**Add New → Project → Import Git Repository**). This gives you automatic deployments every time you push to GitHub, without needing to run `vercel --prod` manually.

---

## 8. Troubleshooting

| Problem | Likely cause |
|---|---|
| Scanning shows "Error contacting AI." | `.env` values missing/incorrect locally, or environment variables not set in Vercel dashboard for production |
| "Server is missing API configuration" | `GEMINI_API_KEY` or `GEMINI_ENDPOINT` not detected — check spelling in `.env` or Vercel settings |
| Scanner works locally but not on the live URL | You forgot step 7.3 (adding env vars in the Vercel dashboard) — local `.env` files are never uploaded |
| "model not found" type error in the response | Update the `model` value in `api/analyze.js` (see section 3.3) |
| Blank page or 404 when opening `index.html` directly | You must run the project through `vercel dev`, not by double-clicking the HTML file |

---

## 9. Notes

- Never commit `.env` or share your API key publicly (e.g. in screenshots, GitHub issues, or chat messages).
- If you suspect a key has leaked, delete it in Google AI Studio and generate a new one immediately.
- Analysis is AI-assisted and may not catch every threat — CyberSense is meant as a first layer of awareness, not a guarantee of safety.