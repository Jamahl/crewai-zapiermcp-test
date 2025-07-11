crewai.md
# MCP Servers as Tools in CrewAI

> Learn how to integrate MCP servers as tools in your CrewAI agents using the `crewai-tools` library.

## Overview

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) provides a standardized way for AI agents to provide context to LLMs by communicating with external services, known as MCP Servers.
The `crewai-tools` library extends CrewAI's capabilities by allowing you to seamlessly integrate tools from these MCP servers into your agents.
This gives your crews access to a vast ecosystem of functionalities.

We currently support the following transport mechanisms:

* **Stdio**: for local servers (communication via standard input/output between processes on the same machine)
* **Server-Sent Events (SSE)**: for remote servers (unidirectional, real-time data streaming from server to client over HTTP)
* **Streamable HTTP**: for remote servers (flexible, potentially bi-directional communication over HTTP, often utilizing SSE for server-to-client streams)

## Video Tutorial

Watch this video tutorial for a comprehensive guide on MCP integration with CrewAI:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/TpQ45lAZh48" title="CrewAI MCP Integration Guide" frameborder="0" style={{ borderRadius: '10px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />

## Installation

Before you start using MCP with `crewai-tools`, you need to install the `mcp` extra `crewai-tools` dependency with the following command:

```shell
uv pip install 'crewai-tools[mcp]'
```

## Key Concepts & Getting Started

The `MCPServerAdapter` class from `crewai-tools` is the primary way to connect to an MCP server and make its tools available to your CrewAI agents. It supports different transport mechanisms and simplifies connection management.

Using a Python context manager (`with` statement) is the **recommended approach** for `MCPServerAdapter`. It automatically handles starting and stopping the connection to the MCP server.

```python
from crewai import Agent
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters # For Stdio Server

# Example server_params (choose one based on your server type):
# 1. Stdio Server:
server_params=StdioServerParameters(
    command="python3",
    args=["servers/your_server.py"],
    env={"UV_PYTHON": "3.12", **os.environ},
)

# 2. SSE Server:
server_params = {
    "url": "http://localhost:8000/sse",
    "transport": "sse"
}

# 3. Streamable HTTP Server:
server_params = {
    "url": "http://localhost:8001/mcp",
    "transport": "streamable-http"
}

# Example usage (uncomment and adapt once server_params is set):
with MCPServerAdapter(server_params) as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=mcp_tools, # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

This general pattern shows how to integrate tools. For specific examples tailored to each transport, refer to the detailed guides below.

## Filtering Tools

There are two ways to filter tools:

1. Accessing a specific tool using dictionary-style indexing.
2. Pass a list of tool names to the `MCPServerAdapter` constructor.

### Accessing a specific tool using dictionary-style indexing.

```python
with MCPServerAdapter(server_params) as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=[mcp_tools["tool_name"]], # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

### Pass a list of tool names to the `MCPServerAdapter` constructor.

```python
with MCPServerAdapter(server_params, "tool_name") as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=mcp_tools, # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

## Using with CrewBase

To use MCPServer tools within a CrewBase class, use the `mcp_tools` method. Server configurations should be provided via the mcp\_server\_params attribute. You can pass either a single configuration or a list of multiple server configurations.

```python
@CrewBase
class CrewWithMCP:
  # ... define your agents and tasks config file ...

  mcp_server_params = [
    # Streamable HTTP Server
    {
        "url": "http://localhost:8001/mcp",
        "transport": "streamable-http"
    },
    # SSE Server
    {
        "url": "http://localhost:8000/sse",
        "transport": "sse"
    },
    # StdIO Server
    StdioServerParameters(
        command="python3",
        args=["servers/your_stdio_server.py"],
        env={"UV_PYTHON": "3.12", **os.environ},
    )
  ]

  @agent
  def your_agent(self):
      return Agent(config=self.agents_config["your_agent"], tools=self.get_mcp_tools()) # get all available tools

    # ... rest of your crew setup ...
```

You can filter which tools are available to your agent by passing a list of tool names to the `get_mcp_tools` method.

```python
@agent
def another_agent(self):
    return Agent(
      config=self.agents_config["your_agent"],
      tools=self.get_mcp_tools("tool_1", "tool_2") # get specific tools
    )
```

## Explore MCP Integrations

<CardGroup cols={2}>
  <Card title="Stdio Transport" icon="server" href="/en/mcp/stdio" color="#3B82F6">
    Connect to local MCP servers via standard input/output. Ideal for scripts and local executables.
  </Card>

  <Card title="SSE Transport" icon="wifi" href="/en/mcp/sse" color="#10B981">
    Integrate with remote MCP servers using Server-Sent Events for real-time data streaming.
  </Card>

  <Card title="Streamable HTTP Transport" icon="globe" href="/en/mcp/streamable-http" color="#F59E0B">
    Utilize flexible Streamable HTTP for robust communication with remote MCP servers.
  </Card>

  <Card title="Connecting to Multiple Servers" icon="layer-group" href="/en/mcp/multiple-servers" color="#8B5CF6">
    Aggregate tools from several MCP servers simultaneously using a single adapter.
  </Card>

  <Card title="Security Considerations" icon="lock" href="/en/mcp/security" color="#EF4444">
    Review important security best practices for MCP integration to keep your agents safe.
  </Card>
</CardGroup>

Checkout this repository for full demos and examples of MCP integration with CrewAI! 👇

<Card title="GitHub Repository" icon="github" href="https://github.com/tonykipkemboi/crewai-mcp-demo" target="_blank">
  CrewAI MCP Demo
</Card>

## Staying Safe with MCP

<Warning>
  Always ensure that you trust an MCP Server before using it.
</Warning>

#### Security Warning: DNS Rebinding Attacks

SSE transports can be vulnerable to DNS rebinding attacks if not properly secured.
To prevent this:

1. **Always validate Origin headers** on incoming SSE connections to ensure they come from expected sources
2. **Avoid binding servers to all network interfaces** (0.0.0.0) when running locally - bind only to localhost (127.0.0.1) instead
3. **Implement proper authentication** for all SSE connections

Without these protections, attackers could use DNS rebinding to interact with local MCP servers from remote websites.

For more details, see the [Anthropic's MCP Transport Security docs](https://modelcontextprotocol.io/docs/concepts/transports#security-considerations).

### Limitations

* **Supported Primitives**: Currently, `MCPServerAdapter` primarily supports adapting MCP `tools`.
  Other MCP primitives like `prompts` or `resources` are not directly integrated as CrewAI components through this adapter at this time.
* **Output Handling**: The adapter typically processes the primary text output from an MCP tool (e.g., `.content[0].text`). Complex or multi-modal outputs might require custom handling if not fitting this pattern.

-
# MCP Servers as Tools in CrewAI

> Learn how to integrate MCP servers as tools in your CrewAI agents using the `crewai-tools` library.

## Overview

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) provides a standardized way for AI agents to provide context to LLMs by communicating with external services, known as MCP Servers.
The `crewai-tools` library extends CrewAI's capabilities by allowing you to seamlessly integrate tools from these MCP servers into your agents.
This gives your crews access to a vast ecosystem of functionalities.

We currently support the following transport mechanisms:

* **Stdio**: for local servers (communication via standard input/output between processes on the same machine)
* **Server-Sent Events (SSE)**: for remote servers (unidirectional, real-time data streaming from server to client over HTTP)
* **Streamable HTTP**: for remote servers (flexible, potentially bi-directional communication over HTTP, often utilizing SSE for server-to-client streams)

## Video Tutorial

Watch this video tutorial for a comprehensive guide on MCP integration with CrewAI:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/TpQ45lAZh48" title="CrewAI MCP Integration Guide" frameborder="0" style={{ borderRadius: '10px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />

## Installation

Before you start using MCP with `crewai-tools`, you need to install the `mcp` extra `crewai-tools` dependency with the following command:

```shell
uv pip install 'crewai-tools[mcp]'
```

## Key Concepts & Getting Started

The `MCPServerAdapter` class from `crewai-tools` is the primary way to connect to an MCP server and make its tools available to your CrewAI agents. It supports different transport mechanisms and simplifies connection management.

Using a Python context manager (`with` statement) is the **recommended approach** for `MCPServerAdapter`. It automatically handles starting and stopping the connection to the MCP server.

```python
from crewai import Agent
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters # For Stdio Server

# Example server_params (choose one based on your server type):
# 1. Stdio Server:
server_params=StdioServerParameters(
    command="python3",
    args=["servers/your_server.py"],
    env={"UV_PYTHON": "3.12", **os.environ},
)

# 2. SSE Server:
server_params = {
    "url": "http://localhost:8000/sse",
    "transport": "sse"
}

# 3. Streamable HTTP Server:
server_params = {
    "url": "http://localhost:8001/mcp",
    "transport": "streamable-http"
}

# Example usage (uncomment and adapt once server_params is set):
with MCPServerAdapter(server_params) as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=mcp_tools, # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

This general pattern shows how to integrate tools. For specific examples tailored to each transport, refer to the detailed guides below.

## Filtering Tools

There are two ways to filter tools:

1. Accessing a specific tool using dictionary-style indexing.
2. Pass a list of tool names to the `MCPServerAdapter` constructor.

### Accessing a specific tool using dictionary-style indexing.

```python
with MCPServerAdapter(server_params) as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=[mcp_tools["tool_name"]], # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

### Pass a list of tool names to the `MCPServerAdapter` constructor.

```python
with MCPServerAdapter(server_params, "tool_name") as mcp_tools:
    print(f"Available tools: {[tool.name for tool in mcp_tools]}")

    my_agent = Agent(
        role="MCP Tool User",
        goal="Utilize tools from an MCP server.",
        backstory="I can connect to MCP servers and use their tools.",
        tools=mcp_tools, # Pass the loaded tools to your agent
        reasoning=True,
        verbose=True
    )
    # ... rest of your crew setup ...
```

## Using with CrewBase

To use MCPServer tools within a CrewBase class, use the `mcp_tools` method. Server configurations should be provided via the mcp\_server\_params attribute. You can pass either a single configuration or a list of multiple server configurations.

```python
@CrewBase
class CrewWithMCP:
  # ... define your agents and tasks config file ...

  mcp_server_params = [
    # Streamable HTTP Server
    {
        "url": "http://localhost:8001/mcp",
        "transport": "streamable-http"
    },
    # SSE Server
    {
        "url": "http://localhost:8000/sse",
        "transport": "sse"
    },
    # StdIO Server
    StdioServerParameters(
        command="python3",
        args=["servers/your_stdio_server.py"],
        env={"UV_PYTHON": "3.12", **os.environ},
    )
  ]

  @agent
  def your_agent(self):
      return Agent(config=self.agents_config["your_agent"], tools=self.get_mcp_tools()) # get all available tools

    # ... rest of your crew setup ...
```

You can filter which tools are available to your agent by passing a list of tool names to the `get_mcp_tools` method.

```python
@agent
def another_agent(self):
    return Agent(
      config=self.agents_config["your_agent"],
      tools=self.get_mcp_tools("tool_1", "tool_2") # get specific tools
    )
```

## Explore MCP Integrations

<CardGroup cols={2}>
  <Card title="Stdio Transport" icon="server" href="/en/mcp/stdio" color="#3B82F6">
    Connect to local MCP servers via standard input/output. Ideal for scripts and local executables.
  </Card>

  <Card title="SSE Transport" icon="wifi" href="/en/mcp/sse" color="#10B981">
    Integrate with remote MCP servers using Server-Sent Events for real-time data streaming.
  </Card>

  <Card title="Streamable HTTP Transport" icon="globe" href="/en/mcp/streamable-http" color="#F59E0B">
    Utilize flexible Streamable HTTP for robust communication with remote MCP servers.
  </Card>

  <Card title="Connecting to Multiple Servers" icon="layer-group" href="/en/mcp/multiple-servers" color="#8B5CF6">
    Aggregate tools from several MCP servers simultaneously using a single adapter.
  </Card>

  <Card title="Security Considerations" icon="lock" href="/en/mcp/security" color="#EF4444">
    Review important security best practices for MCP integration to keep your agents safe.
  </Card>
</CardGroup>

Checkout this repository for full demos and examples of MCP integration with CrewAI! 👇

<Card title="GitHub Repository" icon="github" href="https://github.com/tonykipkemboi/crewai-mcp-demo" target="_blank">
  CrewAI MCP Demo
</Card>

## Staying Safe with MCP

<Warning>
  Always ensure that you trust an MCP Server before using it.
</Warning>

#### Security Warning: DNS Rebinding Attacks

SSE transports can be vulnerable to DNS rebinding attacks if not properly secured.
To prevent this:

1. **Always validate Origin headers** on incoming SSE connections to ensure they come from expected sources
2. **Avoid binding servers to all network interfaces** (0.0.0.0) when running locally - bind only to localhost (127.0.0.1) instead
3. **Implement proper authentication** for all SSE connections

Without these protections, attackers could use DNS rebinding to interact with local MCP servers from remote websites.

For more details, see the [Anthropic's MCP Transport Security docs](https://modelcontextprotocol.io/docs/concepts/transports#security-considerations).

### Limitations

* **Supported Primitives**: Currently, `MCPServerAdapter` primarily supports adapting MCP `tools`.
  Other MCP primitives like `prompts` or `resources` are not directly integrated as CrewAI components through this adapter at this time.
* **Output Handling**: The adapter typically processes the primary text output from an MCP tool (e.g., `.content[0].text`). Complex or multi-modal outputs might require custom handling if not fitting this pattern.

--
# Connecting to Multiple MCP Servers

> Learn how to use MCPServerAdapter in CrewAI to connect to multiple MCP servers simultaneously and aggregate their tools.

## Overview

`MCPServerAdapter` in `crewai-tools` allows you to connect to multiple MCP servers concurrently. This is useful when your agents need to access tools distributed across different services or environments. The adapter aggregates tools from all specified servers, making them available to your CrewAI agents.

## Configuration

To connect to multiple servers, you provide a list of server parameter dictionaries to `MCPServerAdapter`. Each dictionary in the list should define the parameters for one MCP server.

Supported transport types for each server in the list include `stdio`, `sse`, and `streamable-http`.

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters # Needed for Stdio example

# Define parameters for multiple MCP servers
server_params_list = [
    # Streamable HTTP Server
    {
        "url": "http://localhost:8001/mcp", 
        "transport": "streamable-http"
    },
    # SSE Server
    {
        "url": "http://localhost:8000/sse",
        "transport": "sse"
    },
    # StdIO Server
    StdioServerParameters(
        command="python3",
        args=["servers/your_stdio_server.py"],
        env={"UV_PYTHON": "3.12", **os.environ},
    )
]

try:
    with MCPServerAdapter(server_params_list) as aggregated_tools:
        print(f"Available aggregated tools: {[tool.name for tool in aggregated_tools]}")

        multi_server_agent = Agent(
            role="Versatile Assistant",
            goal="Utilize tools from local Stdio, remote SSE, and remote HTTP MCP servers.",
            backstory="An AI agent capable of leveraging a diverse set of tools from multiple sources.",
            tools=aggregated_tools, # All tools are available here
            verbose=True,
        )

        ... # Your other agent, tasks, and crew code here

except Exception as e:
    print(f"Error connecting to or using multiple MCP servers (Managed): {e}")
    print("Ensure all MCP servers are running and accessible with correct configurations.")

```

## Connection Management

When using the context manager (`with` statement), `MCPServerAdapter` handles the lifecycle (start and stop) of all connections to the configured MCP servers. This simplifies resource management and ensures that all connections are properly closed when the context is exited.
