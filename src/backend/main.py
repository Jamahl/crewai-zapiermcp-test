"""
main.py
FastAPI app to expose CrewAI Zapier MCP agent as a chat endpoint.
Follows best practices from crewai.md and crew1.md.
"""
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.backend.crew import ZapierCrew
import asyncio
from crewai_tools import EXASearchTool

app = FastAPI(title="CrewAI Zapier MCP Chat API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

from crewai_tools import MCPServerAdapter

# Session store: maps session_id to {crew, history}
sessions = {}

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_message = data.get("message")
    session_id = data.get("session_id")
    if not user_message or not session_id:
        return JSONResponse({"error": "No message or session_id provided."}, status_code=400)

    # Retrieve or create session history only (not agent/crew)
    if session_id not in sessions:
        sessions[session_id] = {"history": []}
    history = sessions[session_id]["history"]

    # Add user message to history
    history.append({"role": "user", "content": user_message})

    # Format history for context (with timestamp for each message)
    from datetime import datetime
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    def format_msg(msg):
        ts = msg.get('time')
        if not ts:
            ts = now_str
        elif isinstance(ts, datetime):
            ts = ts.strftime('%Y-%m-%d %H:%M')
        else:
            try:
                ts = datetime.fromisoformat(str(ts)).strftime('%Y-%m-%d %H:%M')
            except Exception:
                ts = str(ts)
        return f"[{ts}] {msg['role'].capitalize()}: {msg['content']}"
    context = f"Current time: {now_str}\n" + "\n".join([format_msg(msg) for msg in history])

    # Open MCPServerAdapter context and create agent with live tools
    from crewai_tools import MCPServerAdapter
    from src.backend.crew import ZapierCrew
    import time
    max_retries = 3
    backoff_seconds = 2
    last_exception = None
    for attempt in range(max_retries):
        try:
            with MCPServerAdapter(ZapierCrew().mcp_server_params) as mcp_tools:
                from crewai import Agent, Task, Crew
                agent = Agent(
                    role="You are Fraya, a highly capable, concise, and helpful AI assistant.\n\nCore behavior:\n- Be direct and to the point — never verbose.\n- Use bullet points, headings, and code blocks where helpful.\n- Format all responses cleanly, especially emails and structured data.\n- For date and time questions, always prefer the code execution tool — it is more reliable.\n- Use tools when necessary, including EXA for web search and Zapier MCP tools (Gmail, Calendar, etc).\n- Never invent information. Only respond when confident or after verifying via tools.\n- Answer general knowledge questions when possible. Ask clarifying questions only when needed.\n\nTone:\n- Friendly but efficient.\n- Prioritize clarity, usefulness, and speed.\n\nYour job is to get the user's task done well — whether it's finding an answer, writing something, formatting an email, or using a tool.",
                    goal="Help the user complete tasks through conversation and tools (Zapier, EXA, and code execution). Format emails and messages clearly. Act as a smart, trusted assistant: a sounding board, researcher, and executor. Use EXA for up-to-date information, Zapier for user productivity tasks, and code execution for time/date reliability. Interpret user requests intelligently using both their latest message and prior context.",
                    backstory="Fraya was built by a team focused on blending precision, utility, and speed. Trained to act as a next-gen executive assistant, Fraya integrates with powerful tools like Zapier, EXA, and CrewAI to get real-world tasks done. Whether it’s managing calendars, writing emails, or researching answers live, Fraya always aims to be exact, helpful, and never misleading. When handling time-sensitive queries, Fraya always uses the code execution tool to ensure reliable and accurate date/time calculations. Above all, Fraya respects truth, relevance, and formatting clarity.",
                    tools=[EXASearchTool()] + list(mcp_tools),
                    memory=True,
                    verbose=True,
                    max_iter=3,
                    allow_code_execution=True,
                    inject_date=True,
                )
                task = Task(
                    description="Respond to the user helpfully, take into account any context.\n\n" + context,
                    expected_output = """
A clear, concise, and well-structured response that directly answers the user's query. For emails, every heading should be on a new line. Always prioritize utility and readability:

- Use bullet points, headings, or sections when appropriate.
- Format emails, dates, and times in user-friendly, professional formats. Every Heading should be on a new line.
- Avoid unnecessary elaboration or explanation.
- Respond in plain text unless the task explicitly requires code, markdown, or rich formatting.
- Never return reasoning, background info, or summaries unless the user explicitly asks.
- If using tool output (e.g. EXA, Zapier), clean and summarize it into a human-friendly format.
- The response should feel like it was written by a precise, intelligent executive assistant with excellent formatting skills.

If your answer includes code, always provide a short markdown explanation above or below the code block. Commentary must be in markdown, and code must be in a separate code block. Never mix code and explanation in the same code block. Always leave a blank line between commentary and code. If you provide multiple code snippets, separate each with its own code block and commentary.

Strict formatting rules:
- All explanations, requirements, and commentary must be outside code blocks as markdown text or lists.
- Code must always be in a markdown code block (triple backticks, with the language specified if possible).
- Never include commentary, requirements, or headings inside a code block.
- Always leave a blank line before and after code blocks.

Example output format:

Here is a Python script that does X:

```python
# code here
```

- Explanation: This script does Y and Z.

If you provide installation instructions, use a separate code block for shell commands:

```bash
pip install somepackage
```

Never mix code and explanation in the same code block.
""",
                    agent=agent
                )
                chat_crew = Crew(agents=[agent], tasks=[task], verbose=True)
                result = chat_crew.kickoff()

                # Add agent response to history
                history.append({"role": "agent", "content": str(result)})

                async def agent_stream():
                    for token in str(result).split():
                        yield token + " "
                        await asyncio.sleep(0.04)

                return StreamingResponse(agent_stream(), media_type="text/plain")
        except (TimeoutError, RuntimeError) as e:
            last_exception = e
            if attempt < max_retries - 1:
                time.sleep(backoff_seconds)
                continue
            else:
                # All retries failed, raise the last error as normal
                raise last_exception

if __name__ == "__main__":
    uvicorn.run("src.backend.main:app", host="0.0.0.0", port=8000, reload=True)
