zapier-tool-mcp.md

Python Client
Use the Python client to connect to your MCP server (Python MCP Server).

Installation

pip install fastmcp
or with uv


uv pip install fastmcp
Caution: Treat your MCP server URL like a password! It can be used to run tools attached to this server and access your data.

Usage

import asyncio
import json

from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport

# Create the transport with your MCP server URL
server_url = "https://mcp.zapier.com/api/mcp/s/ODM4ZWMwYWUtZjlmOC00Y2M2LWJkMGYtYjNkYTVlNTcxODBkOjFmZjg3ZTA2LWJlNDUtNGY5NS1hYjEzLTljYjliNDMzYWJiYQ==/mcp"
transport = StreamableHttpTransport(server_url)

# Initialize the client with the transport
client = Client(transport=transport)


async def main():
    # Connection is established here
    print("Connecting to MCP server...")
    async with client:
        print(f"Client connected: {client.is_connected()}")

        # Make MCP calls within the context
        print("Fetching available tools...")
        tools = await client.list_tools()

        print(f"Available tools: {json.dumps([t.name for t in tools], indent=2)}")
        # Tools returned would look like:
        # - name: "google_calendar_retrieve_event_by_id"
        #   description: "Finds a specific event by its ID in your calendar."
        #   params: ["event_id","calendarid"]
# - name: "google_calendar_find_event"
        #   description: "Finds an event in your calendar."
        #   params: ["end_time","ordering","calendarid", ...]
# - name: "google_calendar_find_busy_periods_in_calendar"
        #   description: "Finds busy time periods in your calendar for a specific timeframe."
        #   params: ["end_time","calendarid","start_time"]
# - name: "google_calendar_add_attendee_s_to_event"
        #   description: "Invites one or more person to an existing event."
        #   params: ["eventid","attendees","calendarid"]
# - name: "google_calendar_create_calendar"
        #   description: "Creates a new calendar."
        #   params: ["summary","description"]
# - name: "google_calendar_delete_event"
        #   description: "Deletes an event."
        #   params: ["eventid","calendarid","send_notifications"]
# - name: "google_calendar_create_detailed_event"
        #   description: "Create an event by defining each field."
        #   params: ["all_day","colorId","summary", ...]
# - name: "google_calendar_quick_add_event"
        #   description: "Create an event from a piece of text. Google parses the text for date, time, and description info."
        #   params: ["text","attendees","calendarid"]
# - name: "google_calendar_update_event"
        #   description: "Updates an event. Only filled fields are updated."
        #   params: ["all_day","colorId","eventid", ...]
# - name: "google_calendar_api_request_beta"
        #   description: "This is an advanced action which makes a raw HTTP request that includes this integration's authentication."
        #   params: ["url","body","method", ...]
# - name: "gmail_delete_email"
        #   description: "Sends an email message to the trash."
        #   params: ["message_id"]
# - name: "gmail_find_email"
        #   description: "Finds an email message."
        #   params: ["query"]
# - name: "gmail_add_label_to_email"
        #   description: "Add a label to an email message."
        #   params: ["message_id","new_label_ids"]
# - name: "gmail_archive_email"
        #   description: "Archive an email message."
        #   params: ["message_id"]
# - name: "gmail_create_draft"
        #   description: "Create a draft email message."
        #   params: ["cc","to","bcc", ...]
# - name: "gmail_create_draft_reply"
        #   description: "Create a draft reply to an existing email."
        #   params: ["cc","to","bcc", ...]
# - name: "gmail_create_label"
        #   description: "Creates a new label."
        #   params: ["name"]
# - name: "gmail_send_email"
        #   description: "Create and send a new email message."
        #   params: ["cc","to","bcc", ...]
# - name: "gmail_remove_label_from_email"
        #   description: "Remove a label from an email message."
        #   params: ["label_ids","message_id"]
# - name: "gmail_remove_label_from_conversation"
        #   description: "Remove a specified label from all emails within a conversation."
        #   params: ["label_ids","thread_id"]
# - name: "gmail_reply_to_email"
        #   description: "Send a reply to an email message."
        #   params: ["cc","to","bcc", ...]

        # Example: Call a specific tool with parameters
        print("Calling google_calendar_retrieve_event_by_id...")
        result = await client.call_tool(
            "google_calendar_retrieve_event_by_id",
            {
                "instructions": "Execute the Google Calendar: Retrieve Event by ID tool with the following parameters",
                "event_id": "example-string",
                "calendarid": "example-string",
            },
        )

        # Parse the JSON string from the TextContent and print it nicely formatted
        json_result = json.loads(result[0].text)
        print(
            f"\ngoogle_calendar_retrieve_event_by_id result:\n{json.dumps(json_result, indent=2)}"
        )

    # Connection is closed automatically when exiting the context manager
    print("Example completed")


if __name__ == "__main__":
    asyncio.run(main())

--

https://mcp.zapier.com/api/mcp/s/ODM4ZWMwYWUtZjlmOC00Y2M2LWJkMGYtYjNkYTVlNTcxODBkOjFmZjg3ZTA2LWJlNDUtNGY5NS1hYjEzLTljYjliNDMzYWJiYQ==/mcp