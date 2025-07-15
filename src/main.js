import './style.css'
import { marked } from 'marked';

// Custom markdown renderer for agent output with DaisyUI mockup-code for code blocks
function renderAgentMarkdown(md) {
  const renderer = new marked.Renderer();
  renderer.code = (code, infostring) => {
    // Improved code block: scroll, monospace, copy button
    const escaped = escapeHTML(code);
    const id = 'code-' + Math.random().toString(36).slice(2);
    return `
      <div class="relative group">
        <pre class="mockup-code text-xs p-2 overflow-x-auto font-mono bg-base-300/80 rounded-xl border border-base-200"><code id="${id}">${escaped}</code></pre>
        <button class="absolute top-2 right-2 btn btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition" onclick="navigator.clipboard.writeText(document.getElementById('${id}').innerText)">Copy</button>
      </div>
    `;
  };
  const rawHtml = marked.parse(md, { renderer });
  // Wrap every anchor in a DaisyUI badge
  return rawHtml.replace(/<a ([^>]+)>(.*?)<\/a>/g, (_m, attrs, inner) =>
    `<span class="kbd"><a ${attrs}>${inner}</a></span>`
  );
}

// Escape HTML utility for user messages
function escapeHTML(str) {
  str = String(str || "");
  return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','\"':'&quot;'}[tag]));
}


// In-memory chat state (resets on reload)
let conversations = [
  {
    id: crypto.randomUUID(),
    title: 'Welcome!',
    summary: 'An example conversation',
    messages: [
      { role: 'agent', content: 'Welcome to CrewAI! How can I help you?', time: new Date() }
    ]
  }
];
let activeConversationId = conversations[0].id;
let agentThinking = false;

const app = document.querySelector('#app');
const sidebar = document.querySelector('.drawer-side ul.menu');

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function render() {
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  app.innerHTML = `
    <div class="flex flex-col h-full w-full max-w-4xl mx-auto">
      <div id="chat-area" class="flex-1 overflow-y-auto p-4 space-y-4">
        ${activeConversation.messages.map(m => `
          <div class="chat ${m.role === 'user' ? 'chat-end' : 'chat-start'} items-start">
            <div class="chat-image avatar ${m.role === 'user' ? 'hidden sm:inline-block' : 'inline-block'}">
              <div class="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src="${m.role === 'user' ? 'https://i.ibb.co/rKStJNDy/jamahlpic.jpg' : 'https://api.dicebear.com/7.x/bottts/svg?seed=agent'}" alt="${m.role}" />
              </div>
            </div>
            <div class="chat-header">
              ${m.role === 'user' ? 'You' : 'Agent'}
              <time class="text-xs opacity-50">${formatTime(m.time)}</time>
            </div>
            <div class="chat-bubble ${m.role === 'user' ? 'chat-bubble-primary' : ''}">${m.role === 'agent' ? renderAgentMarkdown(m.content) : escapeHTML(m.content)}</div>
          </div>
        `).join('')}
        ${agentThinking ? `
          <div class="chat chat-start items-start">
            <div class="chat-image avatar">
              <div class="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=agent" alt="agent" />
              </div>
            </div>
            <div class="chat-bubble">
              <span class="loading loading-dots loading-md"></span>
            </div>
          </div>
        ` : ''}
      </div>
      <form id="chat-form" class="p-4 bg-base-100">
        <div class="join w-full">
          <input id="chat-input" class="input input-bordered join-item flex-1" type="text" placeholder="Type your message..." autocomplete="off" aria-label="Chat input" />
          <button class="btn btn-primary join-item" type="submit" aria-label="Send">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  `;

  // Scroll to bottom
  const chatArea = document.getElementById('chat-area');
  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

  // Focus input
  const input = document.getElementById('chat-input');
  if (input) input.focus();

  // Attach form handler
  const form = document.getElementById('chat-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      const activeConversation = conversations.find(c => c.id === activeConversationId);
      activeConversation.messages.push({ role: 'user', content: text, time: new Date() });

      // If this is the first user message, generate title and summary
      if (activeConversation.messages.filter(m => m.role === 'user').length === 1) {
        generateTitleAndSummary(activeConversation.id, text);
      }

      render();
      input.value = '';
      await agentReply(text);
    };
  }

  // Render sidebar
  sidebar.innerHTML = `
    <li>
      <button class="btn btn-primary btn-block" id="new-chat-button">New Conversation</button>
    </li>
    <li class="menu-title">Recent</li>
    ${conversations.map(c => `
      <li class="${c.id === activeConversationId ? 'bordered' : ''}">
        <a href="#" onclick="switchConversation('${c.id}')">
          <div class="flex flex-col">
            <span class="font-bold">${c.title}</span>
            <span class="text-xs text-base-content/60">${c.summary}</span>
          </div>
        </a>
      </li>
    `).join('')}
    <div class="divider"></div>
    <li>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('admin-modal').showModal()">Admin Config</button>
    </li>
  `;

  // Attach sidebar handlers
  document.getElementById('new-chat-button').onclick = () => {
    const newConversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      summary: 'A new conversation',
      messages: []
    };
    conversations.push(newConversation);
    activeConversationId = newConversation.id;
    render();
  };
}

function switchConversation(id) {
  activeConversationId = id;
  render();
}

async function generateTitleAndSummary(conversationId, userMessage) {
  // In a real app, you'd call the backend here.
  // For now, we'll just use the first user message.
  const conversation = conversations.find(c => c.id === conversationId);
  if (conversation) {
    conversation.title = userMessage.substring(0, 20) + (userMessage.length > 20 ? '...' : '');
    conversation.summary = userMessage.substring(0, 40) + (userMessage.length > 40 ? '...' : '');
  }
}

// Real streaming agent response from FastAPI backend
// Session ID for persistent chat context
if (!localStorage.getItem('session_id')) {
  localStorage.setItem('session_id', crypto.randomUUID());
}
const session_id = localStorage.getItem('session_id');

async function agentReply(userMessage) {
  agentThinking = true;
  render();

  const response = await fetch('http://localhost:8001/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, session_id })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let agentMsg = '';

  // Keep showing "Thinking..." bubble while streaming; don't push final message yet
  render();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    agentMsg += decoder.decode(value, { stream: true });
  }
  // Flush remaining bytes
  agentMsg += decoder.decode();
  console.debug('Full agent message received:', agentMsg);

  // Replace thinking indicator with final agent message
  agentThinking = false;
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  activeConversation.messages.push({ role: 'agent', content: agentMsg, time: new Date() });
  render();
}

window.switchConversation = switchConversation;
render();
