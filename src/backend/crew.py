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


