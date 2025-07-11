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

    # Format history for context (simple concatenation)
    context = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history])

    # Open MCPServerAdapter context and create agent with live tools
    from crewai_tools import MCPServerAdapter
    from src.backend.crew import ZapierCrew
    with MCPServerAdapter(ZapierCrew().mcp_server_params) as mcp_tools:
        from crewai import Agent, Task, Crew
        agent = Agent(
            role="You are a helpful assistant. You are designed to answer questions in a friendly manner and when required, use tools to get information.",
            goal="Help the user with tasks using Zapier and other MCP tools. Have conversations, be a sounding board, act smart. When responding to the user with an email, format is nicely so it's easy to read. If the user is asking you to send an email, use the relevant tool and gather the context from their most recent message and the conversation to correctly capture intent and fulfil the action.",
            backstory="You are an AI assistant who can use Zapier tools (like Gmail, Calendar, etc) via MCP integration.",
            tools=mcp_tools,
            memory=True,
            verbose=True,
            max_iter=3,
        )
        task = Task(
            description=context,
            expected_output="A helpful, concise answer to the user's message.",
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

if __name__ == "__main__":
    uvicorn.run("src.backend.main:app", host="0.0.0.0", port=8000, reload=True)
