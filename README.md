# CrewAI Chat Agent with MCP Tool Integration

A modern, full-stack chat MVP that lets users interact with a powerful CrewAI agent ("Fraya")—featuring real-time streaming, tool usage via Zapier MCP, web search, markdown rendering, and a beautiful DaisyUI/Tailwind frontend.

---

## Features

- **Conversational AI**: Chat with Fraya, a concise, professional, and tool-savvy CrewAI agent.
- **Multi-Provider LLM Support**: Choose between OpenAI, OpenRouter, and Groq for language models, with dynamic model selection.
- **MCP Tool Integration**: Use Zapier MCP (Gmail, Calendar, etc.) and EXASearchTool for web search and productivity tasks.
- **Real-Time Streaming**: See agent responses stream in real time, including tool usage status.
- **Markdown & Code Rendering**: Agent responses support markdown, code blocks, and rich formatting.
- **Proactive Suggestions**: Agent offers contextual quick actions (e.g., "Schedule this?").
- **Beautiful UI**: Retro DaisyUI theme, chat bubbles, avatars, and accessible design.
- **Session Memory**: Conversation context is preserved in-browser (per session).
- **Admin Panel for Provider/Model Selection**: Easily switch LLM provider and model using a DaisyUI-powered menu in the admin panel.

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
- **OpenRouter API Key** (for OpenRouter LLMs)
- **Groq API Key** (for Groq LLMs)
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

### Admin Panel: Provider & Model Selection
- Open the admin panel to select your preferred LLM provider (OpenAI, OpenRouter, or Groq).
- Model options update dynamically for each provider using a DaisyUI menu:

#### OpenAI Models
- gpt-4.5-preview, gpt-4.1, gpt-4o, o1, o3, gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini, o1-mini, o3-mini

#### OpenRouter Models
- moonshotai/kimi-k2:free, cognitivecomputations/dolphin-mistral-24b-venice-edition:free, google/gemma-3n-e2b-it:free, tngtech/deepseek-r1t2-chimera:free, moonshotai/kimi-dev-72b:free, deepseek/deepseek-r1-0528-qwen3-8b:free, mistralai/devstral-small-2505:free, moonshotai/kimi-vl-a3b-thinking:free, nvidia/llama-3.1-nemotron-ultra-253b-v1:free, rekaai/reka-flash-3:free

#### Groq Models
- llama-3.1-8b-instant, meta-llama/llama-guard-4-12b, meta-llama/llama-4-maverick-17b-128e-instruct, mistral-saba-24b

- Selecting a model from the menu updates the input and persists your choice for the session.
- You can also enter a custom model name manually.
- The backend receives the model string as-is and routes to the correct provider and endpoint.

---

## Architecture
- **Backend**: FastAPI, CrewAI agent instantiated per request, tools loaded via MCPServerAdapter context, robust retry logic for tool timeouts.
- **Frontend**: Vite, Vanilla JS, DaisyUI/Tailwind, custom markdown renderer, streaming via NDJSON.
- **Tooling**: EXASearchTool for web, Zapier MCP for productivity (Gmail, Calendar, etc.).

---

## Environment Variables
- `OPENAI_API_KEY` (backend)
- `OPENROUTER_API_KEY` (backend)
- `GROQ_API_KEY` (backend)
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
