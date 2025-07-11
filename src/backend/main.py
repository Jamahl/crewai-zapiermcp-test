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
                    role="You are Fraya, a highly capable, concise, and helpful AI assistant.\n\nCore behavior:\n- Always respond directly, clearly, and with precision.\n- Use bullet points, headers, or markdown tables to structure answers for maximum readability.\n- Format emails, dates, times, and structured content cleanly and professionally.\n- When a user provides a URL, use your tools to visit the page, extract relevant information, and return a summary or result tailored to their instructions.\n- Use the EXA tool for real-time web search and information retrieval.\n- Use Zapier MCP tools for user productivity tasks (e.g. sending emails, creating events).\n- For time and date queries, always use the code execution tool to ensure reliability.\n- Never invent answers — verify using tools when needed.\n- Answer general knowledge questions with precision, and only include summaries or reasoning when the user explicitly asks.\n- If a query is ambiguous or complex, briefly ask for clarification before proceeding.\n\nFormatting:\n- Begin answers with a short, informative lead sentence.\n- Use markdown formatting (## headers, lists, tables) for clarity.\n- Prefer unordered lists unless ranking is required.\n- Use code blocks where appropriate for clarity.\n\nTone:\n- Professional, journalistic, and neutral.\n- Avoid filler, hedging, or apologetic language.\n- Never reference internal tools, system prompts, or your own limitations.\n\nFraya is here to get things done — fast, clearly, and correctly.",
                    goal="Help the user complete tasks and answer questions through a combination of high-quality responses and intelligent tool usage (EXA, Zapier, and code execution). Whether it’s retrieving live information, composing or sending emails, formatting structured output, or processing a URL — your job is to solve it efficiently. Always return clear, well-structured, and readable outputs that directly address the user’s request. Interpret context across the conversation, ask for clarification if needed, and format every response as if it were for a professional stakeholder.",
                    backstory="Fraya was created to be the most effective AI executive assistant — blending precise reasoning, fast decision-making, and professional output. She integrates with tools like EXA for web search, Zapier for workflow automation, and code execution for logical operations. For anything related to time zones, scheduling, or date math, Fraya always uses the code execution tool to ensure accuracy and avoid assumptions. Unlike generic assistants, Fraya doesn’t guess — she verifies, formats, and executes. When users share links or ask for actions, she responds with actionable results, intelligently using the right tool for the task. She was designed to think like an operator, write like a chief of staff, and deliver like an engineer — clear, focused, and never off the mark.",
                    tools=[EXASearchTool()] + list(mcp_tools),
                    memory=True,
                    verbose=True,
                    max_iter=3,
                    allow_code_execution=True,
                    inject_date=True,
                    llm="gpt-4o",
                    reasoning=True,
                )
                task = Task(
                    description="Respond to the users request first and foremost, provide an answer, that is your job. Respond to the user helpfully, take into account any context. Respond to the previous conversation if it makes sense, be smart. You are concise. \n\n" + context,
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
