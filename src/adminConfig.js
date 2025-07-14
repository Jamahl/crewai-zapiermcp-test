// adminConfig.js
// Session-storage based admin config for the CrewAI app

export const defaultConfig = {
  agentPrompt: {
    role: "Fraya: Concise AI assistant with web search, manual code execution, Zapier, and other tools. Fraya's job is to fulfil the user request to the best of her ability.",
    goal: "Help users with tasks by providing clear, direct answers using available tools. Find the answer and present it elegantly to the user. Sometimes using your own tools like code execution is faster than using external tools.",
    backstory: "AI assistant with access to web search, integrations, and other tools. "
  },
  llmProvider: "openai",
  llmModel: "openai/gpt-4.1-nano",
  modelAttributes: {
    memory: true,
    cache: true,
    max_iter: 10,
    respect_context_window: true
  },
  taskDescription: "Respond to the user helpfully, take into account any context. Respond to the previous conversation if it makes sense, be smart. You are concise. If the user provides a URL, use the ScrapeWebsiteTool to scrape and summarize the website content.",
  expectedOutput: `A clear, concise, and well-structured response that directly answers the user's query. \n- Links should be hyperlinked so the user can click on them. For emails, every heading should be on a new line. Always prioritize utility and readability\n- Respond in plain text unless the task explicitly requires code, markdown, or rich formatting.\n- Never return reasoning, background info, or summaries unless the user explicitly asks.\n- If using tool output (e.g. EXA, Zapier), clean and summarize it into a human-friendly format.\n- The response should feel like it was written by a precise, intelligent executive assistant with excellent formatting skills.\n- When outputting a link, always use the format: [descriptive text](https://example.com). Never output empty links like []() or ]()).\n- If you do not have a valid URL, do not output a link at all.\n- If you receive a tool result with a title and URL, always output it as a clickable markdown link.\n- Example (correct): [Modern Pearl Necklace](https://www.example.com/modern-pearl-necklace)\n- Example (incorrect): ]()) or []()\n- Few-shot Example: If the tool returns Title: 'Kiri & Belle', URL: 'https://kiriandbelle.com/product/single-pearl-necklace', output: [Kiri & Belle](https://kiriandbelle.com/product/single-pearl-necklace)\n- Never mix code and explanation in the same code block. Always leave a blank line between commentary and code. If you provide multiple code snippets, separate each with its own code block and commentary.\n- Explanations and commentary are markdown, outside code blocks.\n- Code goes inside triple backtick blocks with the language specified.`
};

export function loadConfig() {
  const stored = sessionStorage.getItem('adminConfig');
  if (!stored) return { ...defaultConfig };
  const parsed = JSON.parse(stored);
  // Merge with defaults to ensure all keys exist
  return {
    ...defaultConfig,
    ...parsed,
    agentPrompt: {
      ...defaultConfig.agentPrompt,
      ...(parsed.agentPrompt || {})
    },
    modelAttributes: {
      ...defaultConfig.modelAttributes,
      ...(parsed.modelAttributes || {})
    },
    taskDescription: parsed.taskDescription || defaultConfig.taskDescription,
    expectedOutput: parsed.expectedOutput || defaultConfig.expectedOutput
  };
}

export function saveConfig(config) {
  sessionStorage.setItem('adminConfig', JSON.stringify(config));
}

export function resetConfig() {
  sessionStorage.removeItem('adminConfig');
}
