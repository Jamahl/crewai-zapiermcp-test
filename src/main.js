import './style.css'

// In-memory chat state (resets on reload)
let messages = [];
let agentThinking = false;

const app = document.querySelector('#app');

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function render() {
  app.innerHTML = `
    <div class="flex flex-col items-center min-h-screen bg-base-100">
      <div class="w-full max-w-2xl flex flex-col flex-1 h-[80vh] my-8 rounded-xl shadow-xl bg-base-200 border border-base-300">
        <div id="chat-area" class="flex-1 overflow-y-auto p-6 space-y-4">
          ${messages.map(m => `
            <div class="chat ${m.role === 'user' ? 'chat-end' : 'chat-start'} items-end">
              <div class="avatar ${m.role === 'user' ? 'hidden sm:inline-block' : 'inline-block'}">
                <div class="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src="${m.role === 'user' ? 'https://api.dicebear.com/7.x/identicon/svg?seed=user' : 'https://api.dicebear.com/7.x/bottts/svg?seed=agent'}" alt="${m.role}" />
                </div>
              </div>
              <div>
                <div class="chat-bubble ${m.role === 'user' ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'} shadow-lg px-5 py-3">
                  ${m.content}
                </div>
                <div class="text-xs text-base-content/60 mt-1 text-right">${formatTime(m.time)}</div>
              </div>
            </div>
          `).join('')}
          ${agentThinking ? `
            <div class="chat chat-start items-end">
              <div class="avatar inline-block">
                <div class="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=agent" alt="agent" />
                </div>
              </div>
              <div>
                <div class="chat-bubble bg-secondary text-secondary-content flex items-center gap-2 shadow-lg px-5 py-3">
                  <span class="loading loading-dots loading-xs"></span>
                  <span class="text-xs text-base-content/60">Thinking...</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        <form id="chat-form" class="p-3 flex gap-2 bg-base-100 border-t rounded-b-xl">
          <div class="flex items-center w-full rounded-xl bg-base-200 border border-base-300 focus-within:ring-2 focus-within:ring-primary">
            <input id="chat-input" class="input input-ghost flex-1 focus:outline-none focus:bg-base-100 bg-base-200 border-0 px-4 py-3 rounded-xl" type="text" placeholder="Type your message..." autocomplete="off" aria-label="Chat input" />
            <button class="btn btn-primary rounded-xl ml-2 px-6 shadow-md" type="submit" tabindex="0" aria-label="Send">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </form>
      </div>
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
      messages.push({ role: 'user', content: text, time: new Date() });
      render();
      input.value = '';
      await agentReply(text);
    };
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
  let agentMsg = '';
  messages.push({ role: 'agent', content: '', time: new Date() });
  render();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    agentMsg += new TextDecoder().decode(value);
    messages[messages.length - 1].content = agentMsg;
    render();
  }

  agentThinking = false;
  render();
}


render();
