# CrewAI Chat Agent with MCP Tool Integration

A modern, full-stack chat MVP that lets users interact with a powerful CrewAI agent ("Fraya")—featuring real-time streaming, tool usage via Zapier MCP, web search, markdown rendering, and a beautiful DaisyUI/Tailwind frontend.

---

## Features

- **Conversational AI**: Chat with Fraya, a concise, professional, and tool-savvy CrewAI agent.
- **MCP Tool Integration**: Use Zapier MCP (Gmail, Calendar, etc.) and EXASearchTool for web search and productivity tasks.
- **Real-Time Streaming**: See agent responses stream in real time, including tool usage status.
- **Markdown & Code Rendering**: Agent responses support markdown, code blocks, and rich formatting.
- **Proactive Suggestions**: Agent offers contextual quick actions (e.g., "Schedule this?").
- **Beautiful UI**: Retro DaisyUI theme, chat bubbles, avatars, and accessible design.
- **Session Memory**: Conversation context is preserved in-browser (per session).

---

## Project Structure

```
/ (root)
├── src/
│   ├── backend/
│   │   ├── main.py         # FastAPI backend, CrewAI agent orchestration
│   │   ├── crew.py         # ZapierCrew and MCP tool integration helpers
│   │   └── ...
│   ├── main.js             # Frontend logic (streaming, rendering, state)
│   └── ...
├── Frontend.md, crew1.md   # UI and CrewAI design docs
├── package.json            # Frontend dependencies
├── pyproject.toml          # Backend dependencies
├── tailwind.config.js      # Tailwind/DaisyUI config
└── README.md               # (You are here)
```

---

## Getting Started

### 1. Prerequisites
- **Python 3.10+** (recommend venv)
- **Node.js 18+**
- **OpenAI API Key** (for LLM)
- **EXA API Key** (for web search)
- **Zapier MCP credentials** (for tool integration)

### 2. Backend Setup
```bash
# In project root
cd src/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # or use pyproject.toml/uv
# Set environment variables for OPENAI_API_KEY, EXA_API_KEY, etc.
uvicorn main:app --reload --port 8001
```

### 3. Frontend Setup
```bash
# In project root
npm install
npm run dev
# Visit http://localhost:5173
```

---

## Usage
- Type a message to Fraya in the chat UI.
- Agent will respond in real time, streaming markdown and tool status.
- When the agent offers suggestions, click a button to send a follow-up instantly.
- All chat context is session-based (browser memory).

---

## Architecture
- **Backend**: FastAPI, CrewAI agent instantiated per request, tools loaded via MCPServerAdapter context, robust retry logic for tool timeouts.
- **Frontend**: Vite, Vanilla JS, DaisyUI/Tailwind, custom markdown renderer, streaming via NDJSON.
- **Tooling**: EXASearchTool for web, Zapier MCP for productivity (Gmail, Calendar, etc.).

---

## Environment Variables
- `OPENAI_API_KEY` (backend)
- `EXA_API_KEY` (backend)
- `ZAPIER_MCP_URL` (backend, see crew.py)

---

## References
- [CrewAI Docs](https://docs.crewai.com)
- [Zapier MCP](https://platform.zapier.com/docs/mcp/)
- [DaisyUI](https://daisyui.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

## Credits
- Built by Jamahl McMurran & Cascade AI
- Powered by CrewAI, Zapier MCP, EXA, OpenAI, DaisyUI

---

## License
MIT
