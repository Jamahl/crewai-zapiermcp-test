"""
crew.py
CrewAI agent and crew definition with Zapier MCP integration.
Follows best practices from crewai.md and crew1.md.
"""
import os
from crewai import Agent, Crew, Process, llm
from crewai.project import CrewBase
from crewai_tools import MCPServerAdapter

# Zapier MCP server URL (should be stored in env in production)
ZAPIER_MCP_URL = "https://mcp.zapier.com/api/mcp/s/ODM4ZWMwYWUtZjlmOC00Y2M2LWJkMGYtYjNkYTVlNTcxODBkOjFmZjg3ZTA2LWJlNDUtNGY5NS1hYjEzLTljYjliNDMzYWJiYQ==/mcp"

class ZapierCrew:
    """
    CrewBase subclass for CrewAI agent with Zapier MCP tools.
    """
    @property
    def mcp_server_params(self):
        return {
            "url": ZAPIER_MCP_URL,
            "transport": "streamable-http"
        }

    def get_mcp_tools(self):
        """
        Returns all available Zapier MCP tools from the server.
        """
        with MCPServerAdapter(self.mcp_server_params) as mcp_tools:
            return list(mcp_tools)

    def __init__(self):
        self.agent = Agent(
            role="You are a helpful assistant. You are designed to answer questions in a friendly manner and when required, use tools to get information.",
            goal="Help the user with tasks using Zapier and other MCP tools. Have conversations, be a sounding board, act smart. When responding to the user with an email, format is nicely so it's easy to read. If the user is asking you to send an email, use the relevant tool and gather the context from their most recent message and the conversation to correctly capture intent and fulfil the action.",
            backstory="You are an AI assistant who can use Zapier tools (like Gmail, Calendar, etc) via MCP integration.",
            tools=self.get_mcp_tools(),
            memory=True,
            verbose=True,
            max_iter=3,
        )

