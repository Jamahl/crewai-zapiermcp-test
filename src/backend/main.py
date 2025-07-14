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
import os
import asyncio
from crewai import LLM, Agent, Task, Crew
from crewai_tools import EXASearchTool, ScrapeWebsiteTool
from dotenv import load_dotenv
import agentops
from crewai_tools import MCPServerAdapter
from datetime import datetime
from src.backend.crew import ZapierCrew
import time
from mem0 import MemoryClient

# Initialize mem0 MemoryClient using API key from environment
mem0_api_key = os.getenv("MEM0_API_KEY")
mem0_client = MemoryClient()

load_dotenv()

app = FastAPI(title="CrewAI Zapier MCP Chat API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Session store: maps session_id to {agent, history}
sessions = {}

# Function to store user preferences (conversation history) in mem0

def store_user_preferences(user_id: str, conversation: list):
    """Store user preferences from conversation history using mem0"""
    mem0_client.add(conversation, user_id=user_id)

AGENTOPS_API_KEY = os.getenv("AGENTOPS_API_KEY") 
agentops.init(
    api_key=AGENTOPS_API_KEY,
    default_tags=['crewai']
)

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_message = data.get("message")
    session_id = data.get("session_id")
    if not user_message or not session_id:
        return JSONResponse({"error": "No message or session_id provided."}, status_code=400)

    # Retrieve or create session with history and agent
    if session_id not in sessions:
        sessions[session_id] = {"history": [], "agent": None}
    history = sessions[session_id]["history"]
    agent = sessions[session_id]["agent"]

    # Add user message to history
    history.append({"role": "user", "content": user_message})

    # Format history for context (with timestamp for each message)
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
    
    # Context trimming to reduce token usage
    def get_trimmed_context(history, max_recent_messages=3):
        """Keep only the most recent messages in full detail, summarize older ones"""
        if len(history) <= max_recent_messages:
            # For short conversations, include everything
            return f"Current time: {now_str}\n" + "\n".join([format_msg(msg) for msg in history])
        
        # Keep recent messages in full detail
        recent_messages = history[-max_recent_messages:]
        recent_context = "\n".join([format_msg(msg) for msg in recent_messages])
        
        # Summarize older messages
        older_messages = history[:-max_recent_messages]
        summary = f"Previous conversation summary ({len(older_messages)} messages):\n"
        
        # Group by role for more concise summary
        user_topics = [msg['content'].split('?')[0][:30] + '...' if '?' in msg['content'] else msg['content'][:30] + '...' 
                      for msg in older_messages if msg['role'] == 'user']
        agent_responses = [msg['content'][:20] + '...' for msg in older_messages if msg['role'] == 'agent']
        
        if user_topics:
            summary += f"- User asked about: {', '.join(user_topics[-3:])}\n"
        if agent_responses:
            summary += f"- Assistant provided information on these topics\n"
            
        return f"Current time: {now_str}\n{summary}\n\nRecent conversation:\n{recent_context}"
    
    # Get optimized context with trimmed history
    context = get_trimmed_context(history, max_recent_messages=3)

    # Open MCPServerAdapter context and create or reuse agent with live tools
    max_retries = 3
    backoff_seconds = 2
    last_exception = None
    admin_config = data.get("admin_config", {})
    # Defaults if keys missing
    agent_prompt = admin_config.get("agentPrompt", {})
    llm_provider = admin_config.get("llmProvider", "openai")
    llm_model = admin_config.get("llmModel", "openai/gpt-4.1-nano")
    model_attrs = admin_config.get("modelAttributes", {})

    for attempt in range(max_retries):
        try:
            with MCPServerAdapter(ZapierCrew().mcp_server_params) as mcp_tools:
                # LLM creation
                if llm_provider == "openrouter":
                    crew_llm = LLM(model=llm_model, base_url="https://openrouter.ai/api/v1")
                else:
                    crew_llm = LLM(model=llm_model)
                # Always create a new agent with the latest config for every request
                agent = Agent(
                    role=agent_prompt.get("role", "Fraya: Concise AI assistant with web search, manual code execution, Zapier, and other tools. Fraya's job is to fulfil the user request to the best of her ability."),
                    goal=agent_prompt.get("goal", "Help users with tasks by providing clear, direct answers using available tools. Find the answer and present it elegantly to the user. Sometimes using your own tools like code execution is faster than using external tools."),
                    backstory=agent_prompt.get("backstory", "AI assistant with access to web search, integrations, and other tools. "),
                    llm=crew_llm,
                    tools=[EXASearchTool(), ScrapeWebsiteTool()] + list(mcp_tools),
                    verbose=True,
                    allow_delegation=False,
                    memory=model_attrs.get("memory", True),
                    cache=model_attrs.get("cache", True),
                    respect_context_window=model_attrs.get("respect_context_window", True),
                    allow_code_execution=True,
                    inject_date=True,
                    max_iter=model_attrs.get("max_iter", 2),
                )
                # Store the new agent in the session (for possible future use, always overwritten)
                sessions[session_id]["agent"] = agent
                
                task = Task(
                    description=f"Respond to the user helpfully, take into account any context. Respond to the previous conversation if it makes sense, be smart. You are concise. \n\nIf the user provides a URL, use the ScrapeWebsiteTool to scrape and summarize the website content.\n\nContext: {context}.",
                    expected_output="""
A clear, concise, and well-structured response that directly answers the user's query. 
- Links should be hyperlinked so the user can click on them. For emails, every heading should be on a new line. Always prioritize utility and readability
- Respond in plain text unless the task explicitly requires code, markdown, or rich formatting.
- Never return reasoning, background info, or summaries unless the user explicitly asks.
- If using tool output (e.g. EXA, Zapier), clean and summarize it into a human-friendly format.
- The response should feel like it was written by a precise, intelligent executive assistant with excellent formatting skills.
- When outputting a link, always use the format: [descriptive text](https://example.com). Never output empty links like []() or ]()).
- If you do not have a valid URL, do not output a link at all.
- If you receive a tool result with a title and URL, always output it as a clickable markdown link.
- Example (correct): [Modern Pearl Necklace](https://www.example.com/modern-pearl-necklace)
- Example (incorrect): ]()) or []()
- Few-shot Example: If the tool returns Title: 'Kiri & Belle', URL: 'https://kiriandbelle.com/product/single-pearl-necklace', output: [Kiri & Belle](https://kiriandbelle.com/product/single-pearl-necklace)
- Never mix code and explanation in the same code block. Always leave a blank line between commentary and code. If you provide multiple code snippets, separate each with its own code block and commentary.
- Explanations and commentary are markdown, outside code blocks.
- Code goes inside triple backtick blocks with the language specified.
- No comments or headings inside code blocks.
- Leave a blank line before and after code blocks.

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
                chat_crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    verbose=True,
                    memory=True,
                    memory_config={
                        "provider": "mem0",
                        "config": {"user_id": session_id},
                    }
                )
                result = chat_crew.kickoff()

                # Use the agent's raw markdown output without modification so that the
                # frontend receives exactly what CrewAI produced.
                result_str = str(result)

                # Add agent response to history
                history.append({"role": "agent", "content": result_str})

                async def agent_stream():
                    """Stream the full result string in fixed-size chunks to preserve all
                    whitespace (including newlines) so that the frontend receives the
                    complete, correctly-formatted markdown. Splitting on whitespace (the
                    previous implementation) removed newlines and therefore broke markdown
                    bullet lists and paragraphs, which appeared as truncated or malformed
                    output in the UI.
                    """
                    chunk_size = 64  # Number of characters per streamed chunk
                    for i in range(0, len(result_str), chunk_size):
                        # Yield a chunk of the result string to preserve markdown formatting and whitespace
                        yield result_str[i : i + chunk_size]
                        # Slight delay between chunks to simulate streaming and avoid overwhelming the frontend
                        await asyncio.sleep(0.02)

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
