<div align="center">
  <img src="public/logo.png" alt="Vector Craft Logo" width="80" />
  <h1>Vector Craft</h1>
  <p><strong>AI-powered SVG vector art generator</strong></p>
  <p>
    <a href="https://art.schoedel.design">Live App</a> ·
    <a href="#features">Features</a> ·
    <a href="#getting-started">Getting Started</a> ·
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

## Overview

Vector Craft turns natural language prompts into production-ready SVG vector graphics. Describe an object, icon, scene, or concept — and receive a downloadable, scalable vector in seconds.

Built with React, TypeScript, and Google's Gemini API. Deployed at **[art.schoedel.design](https://art.schoedel.design)**.

## Features

### 🎨 AI-Powered SVG Generation
Describe anything — *"retro camera"*, *"isometric cityscape"*, *"minimalist wolf logo"* — and receive a high-quality SVG with gradients, proper pathing, and rich detail.

### 🔑 Bring Your Own Key (BYOK)
Every user provides their own [free Gemini API key](https://aistudio.google.com/apikey). Your key stays in your browser's local storage — it's never stored on our servers. This means:
- **Zero cost** to you as a user (free tier is generous)
- **Full privacy** — your key goes directly to Google's API

### 🔐 Google Sign-In
Authenticate with your Google account in one click. Your generation history and settings are tied to your account via Firebase.

### 📂 Spaces
Organize your work into **Spaces** — themed workspaces with custom system prompts and knowledge bases (URLs, files). Every generation within a Space inherits its context, ensuring consistent output for brand work, projects, or stylistic themes.

### 📎 Reference Uploads
Attach images, PDFs, DOCX files, or text files as references. You can also paste a URL for the AI to incorporate into the design. Great for recreating logos, matching brand styles, or converting sketches.

### 🖼️ Generation History
Browse, download, or regenerate any previously created SVG. History is synced to your account in real-time.

### 🎭 Custom Avatars
Choose from 8 DiceBear avatar styles and randomize your seed for a unique profile identity.

### 📊 Rate Limiting
- **Free users**: 5 generations per 72 hours
- **Client users**: 25 generations per 24 hours
- **Admin**: Unlimited

### ⚙️ Admin Panel
Manage client users and seed sample Spaces from a dedicated admin interface.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A [Google Cloud project](https://console.cloud.google.com/) with Firebase (Auth + Firestore) configured
- A free [Gemini API key](https://aistudio.google.com/apikey)

### Local Development

1. **Clone the repo**
   ```
   git clone https://github.com/schoedel-learn/vector_craft.git
   cd vector_craft
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set environment variables**
   ```
   cp .env.example .env.local
   ```
   Fill in `VITE_FIREBASE_API_KEY` with your Firebase API key.

4. **Run the dev server**
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Sign in** with Google and enter your Gemini API key when prompted.

### Production Build

```
npm run build
```

The output goes to `dist/`, which is configured for Firebase Hosting.

### Deploy to Firebase

```
firebase deploy
```

## Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS (CDN), custom design tokens |
| **AI** | Google Gemini API (`gemini-3-flash-preview`) |
| **Auth** | Firebase Authentication (Google provider) |
| **Database** | Cloud Firestore |
| **Hosting** | Firebase Hosting |
| **Avatars** | DiceBear (8 styles) |
| **Animations** | Motion (Framer Motion) |

### Key Design Decisions

- **BYOK (Bring Your Own Key)** — API keys are stored in `localStorage`, never on any server. Each user uses their own free Gemini quota.
- **Client-side only** — No backend server. All AI calls go directly from the browser to Google's API.
- **Firestore security rules** — Granular per-user access control with admin overrides. Users can only read/write their own data.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

## License

Apache-2.0
