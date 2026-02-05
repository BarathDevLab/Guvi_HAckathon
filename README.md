<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🍯 Agentic Honey-Pot

**AI-Powered Scam Detection & Intelligence Extraction System**

[![GUVI Hackathon](https://img.shields.io/badge/GUVI-Hackathon-orange?style=for-the-badge)](https://hackathon.guvi.in)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-AI-purple?style=for-the-badge&logo=google)](https://ai.google.dev)

</div>

---

## 🎯 Overview

Agentic Honey-Pot is an AI-powered system designed to detect scam attempts and extract intelligence from fraudulent conversations. The AI maintains a convincing human persona while covertly gathering critical information such as:

- 💳 **Bank Account Numbers**
- 📱 **UPI IDs**
- 🔗 **Phishing Links**
- 📞 **Phone Numbers**
- 💰 **Crypto Wallet Addresses**
- 📧 **Suspicious Email Addresses**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│              Dashboard + Chat Interface                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ API Calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                │
│                        /api/chat                             │
│   ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│   │  Gemini AI  │   │  PostgreSQL  │   │ GUVI Callback   │  │
│   │  Provider   │   │   Database   │   │   Integration   │  │
│   └─────────────┘   └──────────────┘   └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** database (local or cloud like Neon/Supabase)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/guvi-hackathon.git
cd guvi-hackathon

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment

**Frontend `.env.local`:**

```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=YOUR_SECRET_API_KEY
```

**Backend `server/.env`:**

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:password@host:5432/database
HONEYPOT_SECRET_KEY=YOUR_SECRET_API_KEY
AI_PROVIDER=gemini
```

### 3. Run the Application

```bash
# Terminal 1: Start the backend
cd server
node index.js

# Terminal 2: Start the frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## 📡 API Reference

### POST `/api/chat`

Process incoming scammer messages and generate AI responses.

**Headers:**

```
Content-Type: application/json
x-api-key: YOUR_SECRET_API_KEY
```

**Request Body:**

```json
{
  "sessionId": "unique-session-id",
  "message": {
    "sender": "scammer",
    "text": "Your bank account will be blocked today. Verify immediately.",
    "timestamp": 1770005528731
  },
  "conversationHistory": [],
  "metadata": {
    "channel": "SMS",
    "language": "English",
    "locale": "IN"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "reply": "Oh no, is my account really going to be blocked? What should I do?",
  "conversationHistory": [...]
}
```

---

## 📁 Project Structure

```
guvi-hackathon/
├── App.tsx                 # Main React application
├── index.tsx               # React entry point
├── index.html              # HTML template
├── components/
│   ├── ChatInterface.tsx   # Chat UI component
│   └── Dashboard.tsx       # Intelligence dashboard
├── services/
│   └── honeyPotApi.ts      # Backend API client
├── types.ts                # TypeScript types
├── server/
│   ├── index.js            # Express server & API routes
│   ├── geminiProvider.js   # Gemini AI integration
│   └── db.js               # PostgreSQL connection
└── package.json
```

---

## 🔧 Tech Stack

| Component | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React 19, Vite, TailwindCSS    |
| Backend   | Node.js, Express 5             |
| AI        | Google Gemini (gemma-3-27b-it) |
| Database  | PostgreSQL                     |
| Styling   | TailwindCSS 4                  |

---

## 🤖 AI Behavior

The AI agent follows a sophisticated behavior pattern:

1. **Analyze** - Detect fraud indicators (urgency, threats, prize claims)
2. **Detect** - Flag conversation as scam if fraudulent intent found
3. **Bait** - Use natural human persona to extract information
4. **Extract** - Capture payment details, links, and contact info

The agent maintains a convincing persona (e.g., "confused senior citizen") to keep scammers engaged while gathering intelligence.

---

## 📝 License

MIT License - Built for GUVI Hackathon

---

<div align="center">
  <b>Made with ❤️ for GUVI Hackathon 2026</b>
</div>
