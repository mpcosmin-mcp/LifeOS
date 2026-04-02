# 🦞 LifeOS — Personal Life Analytics Dashboard

> *"Be the decision maker in your own life, using your own data skills."*

**LifeOS** is a personal analytics system that tracks health, nutrition, finances, psychology, and calendar — all in one unified dashboard. Built by a Data Engineer who spent 7 years building dashboards for others and decided to become the end user of his own life data.

## 🖥️ Live Demo

**[→ Open LifeOS Dashboard](https://mpcosmin-mcp.github.io/LifeOS/)**

*(Running with sample data — your real data stays local)*

## 📊 Modules

| Module | What it tracks |
|--------|---------------|
| **🏥 Health** | Sleep score, HRV, RHR, weight, body fat, steps (Garmin sync) |
| **🍽️ Nutrition** | Meals, macros (P/C/F), water intake, food quality scores |
| **💰 Finance** | Income, expenses, categories, budget tracking, vice spending |
| **🧠 Mind** | Journal entries, mood, psychological triggers, patterns |
| **📅 Calendar** | Events, bills, birthdays, financial forecasting |
| **📋 Overview** | Cross-module synthesis, "1% better" daily insights |

## 🏗️ Architecture

```
Telegram (conversational input)
    → AI Agent (Varutzu — orchestrator)
    → MCP Servers (FastMCP — Python)
    → SQLite DBs (per module)
    → FastAPI (:8000 — data layer)
    → React Dashboard (:8001 — visual layer)
```

**Two interfaces, one truth:**
- **Telegram** — conversational logging & AI analysis
- **React Dashboard** — visual charts, trends, patterns

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite (single-file build)
- **Backend:** FastAPI (Python) + FastMCP servers
- **Database:** SQLite (per module — health.db, spending.db, etc.)
- **AI:** OpenClaw + Anthropic Claude (orchestration + analysis)
- **Sync:** Garmin Connect (daily auto-sync via cron)
- **Hosting:** Self-hosted (Tailscale) + GitHub Pages (static demo)

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/mpcosmin-mcp/LifeOS.git
cd LifeOS

# Install
npm install

# Dev server
npm run dev        # → http://localhost:5173

# Build
npm run build      # → dist/index.html (single file)
```

## 📈 Roadmap

| Phase | Timeline | Status |
|-------|----------|--------|
| **Validate** | Mar-May 2026 | 🔄 50% (daily usage) |
| **Multi-user backend** | May-Jul 2026 | 🔜 |
| **Mobile app (React Native)** | Aug-Oct 2026 | 🔜 |
| **AI agents per module** | Jan-Mar 2027 | 🔜 |
| **Public launch** | Q2 2027 | 🔜 |

## 🧠 Philosophy

- **Data > Feelings** — decisions based on metrics, not vibes
- **Manual-first** — core works without AI (forms, not chat)
- **1% Better Daily** — small compounding improvements
- **Build for use, not show** — validated through daily personal usage

## 📝 License

MIT — use it, fork it, make it yours.

---

*Built with 🦞 by [Cosmin](https://github.com/mpcosmin-mcp) + [Varutzu](https://openclaw.ai) (AI partner)*
