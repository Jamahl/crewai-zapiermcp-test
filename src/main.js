import './style.css'
import { marked } from 'marked';
import { loadConfig, saveConfig, resetConfig, defaultConfig } from './adminConfig.js';

// Custom markdown renderer for agent output with DaisyUI mockup-code for code blocks
function renderAgentMarkdown(md) {
  const renderer = new marked.Renderer();
  renderer.code = (code, infostring = '') => {
    if (typeof code === 'object' && code !== null) {
      // New marked versions pass an object { text, lang } as first arg
      if ('text' in code) {
        infostring = code.lang || infostring;
        code = code.text;
      } else {
        code = JSON.stringify(code);
      }
    }
    // DaisyUI mockup-code expects each line in its own <pre> with data-prefix,
    // wrapped by a container having the `mockup-code` class.
    // We also attach an id for the copy-to-clipboard button.
    const id = 'code-' + Math.random().toString(36).slice(2);
    const escaped = escapeHTML(String(code));

    return `
      <div class="relative">
        <div class="mockup-code w-full text-xs font-mono bg-base-300/80 rounded-xl border border-base-200" id="${id}">
          <pre data-prefix="~"><code class="text-black">${escaped}</code></pre>
        </div>
        <button class="absolute top-2 right-2 btn btn-xs btn-ghost opacity-0 hover:opacity-100 transition" onclick="navigator.clipboard.writeText(document.getElementById('${id}').innerText)">Copy</button>
      </div>`;
  };
  const rawHtml = marked.parse(md, { renderer });
  // Wrap every anchor in a DaisyUI badge
  return rawHtml.replace(/<a ([^>]+)>(.*?)<\/a>/g, (_m, attrs, inner) =>
    `<span class="kbd"><a ${attrs}>${inner}</a></span>`
  );
}

// Escape HTML utility
function escapeHTML(str) {
  str = String(str || "");
  return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','\"':'&quot;'}[tag]));
}

// Render user markdown, supporting ```code``` blocks while still escaping
function renderUserMarkdown(text) {
  const escaped = escapeHTML(text);
  // Convert triple-backtick fenced blocks into DaisyUI mockup-code blocks
  return escaped.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const id = 'user-code-' + Math.random().toString(36).slice(2);
    return `\n<div class="relative">\n  <div class="mockup-code w-full text-xs font-mono bg-base-300/80 rounded-xl border border-base-200" id="${id}">\n    <pre data-prefix="~"><code class="text-black">${code.trim()}</code></pre>\n  </div>\n  <button class="absolute top-2 right-2 btn btn-xs btn-ghost opacity-0 hover:opacity-100 transition" onclick="navigator.clipboard.writeText(document.getElementById('${id}').innerText)">Copy</button>\n</div>\n`; 
  });
}


// In-memory chat state (resets on reload)
let messages = [];
let agentThinking = false;

const app = document.querySelector('#app');

// Admin config state
let adminConfig = loadConfig();

function renderAdminPanel() {
  const providerOptions = `
    <option value="openai" ${adminConfig.llmProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
    <option value="openrouter" ${adminConfig.llmProvider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
  `;
  let modelPrefix = adminConfig.llmProvider === 'openrouter' ? 'openrouter/' : 'openai/';
  let strippedModel = adminConfig.llmModel.startsWith(modelPrefix) ? adminConfig.llmModel.slice(modelPrefix.length) : adminConfig.llmModel;

  return `
    <div class="text-center mb-4">
      <button class="btn btn-sm btn-outline btn-primary rounded-xl" onclick="admin_modal.showModal()">Admin Panel ⚙️</button>
    </div>
    <dialog id="admin_modal" class="modal">
      <div class="modal-box w-11/12 max-w-5xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 class="font-bold text-lg mb-4">Admin Configuration</h3>
        <form id="admin-config-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Left Column -->
          <div class="flex flex-col gap-4">
            <div class="card bg-base-200 p-4 rounded-lg">
              <h4 class="font-bold text-md mb-2">Agent Prompt</h4>
              <div class="form-control">
                <label class="label"><span class="label-text">Role</span></label>
                <input type="text" id="admin-role" class="input input-bordered input-sm" value="${adminConfig.agentPrompt.role}">
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Goal</span></label>
                <input type="text" id="admin-goal" class="input input-bordered input-sm" value="${adminConfig.agentPrompt.goal}">
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Backstory</span></label>
                <textarea id="admin-backstory" class="textarea textarea-bordered textarea-sm">${adminConfig.agentPrompt.backstory}</textarea>
              </div>
            </div>
            <div class="card bg-base-200 p-4 rounded-lg">
              <h4 class="font-bold text-md mb-2">Task Settings</h4>
              <div class="form-control">
                <label class="label"><span class="label-text">Task Description</span></label>
                <textarea id="admin-task-desc" class="textarea textarea-bordered textarea-sm" rows="3">${adminConfig.taskDescription || ''}</textarea>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Expected Output</span></label>
                <div class="relative">
                  <textarea id="admin-expected-output" class="textarea textarea-bordered textarea-sm w-full" rows="3" style="resize:vertical; max-height:120px; overflow:auto;">${adminConfig.expectedOutput || ''}</textarea>
                  <button type="button" id="toggle-expected-output" class="btn btn-xs btn-outline absolute right-2 bottom-2 z-10">Show More</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="flex flex-col gap-4">
            <div class="card bg-base-200 p-4 rounded-lg">
              <h4 class="font-bold text-md mb-2">LLM Provider & Model</h4>
              <div class="form-control">
                <label class="label"><span class="label-text">Provider</span></label>
                <select id="admin-llm-provider" class="select select-bordered select-sm">
                  ${providerOptions}
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Model</span></label>
                <div class="flex items-center gap-2">
                  <span>${modelPrefix}</span>
                  <input type="text" id="admin-llm-model" class="input input-bordered input-sm flex-1" value="${strippedModel}">
                </div>
              </div>
            </div>
            <div class="card bg-base-200 p-4 rounded-lg">
              <h4 class="font-bold text-md mb-2">Model Attributes</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label cursor-pointer"><span class="label-text">Memory</span><input type="checkbox" id="admin-memory" class="toggle toggle-primary" ${adminConfig.modelAttributes.memory ? 'checked' : ''}></label>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer"><span class="label-text">Cache</span><input type="checkbox" id="admin-cache" class="toggle toggle-primary" ${adminConfig.modelAttributes.cache ? 'checked' : ''}></label>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer"><span class="label-text">Respect Context</span><input type="checkbox" id="admin-respect-context" class="toggle toggle-primary" ${adminConfig.modelAttributes.respect_context_window ? 'checked' : ''}></label>
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Max Iter</span></label>
                  <input type="number" id="admin-max-iter" class="input input-bordered input-xs w-24" value="${adminConfig.modelAttributes.max_iter}">
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-2 mt-4 flex justify-end gap-2">
            <button type="button" class="btn" onclick="admin_modal.close()">Close</button>
            <button type="button" id="admin-reset" class="btn btn-outline">Reset to Default</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}


function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function render() {
  // Render admin panel above chat UI
  app.innerHTML = `
    ${renderAdminPanel()}
    <div class="flex flex-col items-center min-h-screen bg-base-100">
      <div class="w-full max-w-2xl flex flex-col flex-1 h-[80vh] my-8 rounded-xl shadow-xl bg-base-200 border border-base-300">
        <div id="chat-area" class="flex-1 overflow-y-auto p-6 space-y-6">
          ${messages.map(m => `
            <div class="chat ${m.role === 'user' ? 'chat-end' : 'chat-start'} items-end relative">
              <div class="avatar ${m.role === 'user' ? 'hidden sm:inline-block' : 'inline-block'}">
                <div class="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src="${m.role === 'user' ? 'https://i.ibb.co/rKStJNDy/jamahlpic.jpg' : 'https://api.dicebear.com/7.x/bottts/svg?seed=agent'}" alt="${m.role}" />
                </div>
              </div>
              <div class="relative">
                <div class="chat-bubble ${m.role === 'user' ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'} shadow-xl px-6 py-4 rounded-2xl rounded-br-md rounded-bl-md">
                  ${m.role === 'agent' ? renderAgentMarkdown(m.content) : renderUserMarkdown(m.content)}
                </div>
                <div class="absolute ${m.role === 'user' ? 'right-2' : 'left-2'} -bottom-2 w-0 h-0 border-t-8 border-t-transparent ${m.role === 'user' ? 'border-l-8 border-l-primary' : 'border-r-8 border-r-secondary'}"></div>
                <div class="text-xs text-base-content/60 mt-2 text-right">${formatTime(m.time)}</div>
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

  // Attach admin config form handler
  const adminForm = document.getElementById('admin-config-form');
  if (adminForm) {
    // Expand/collapse expected output textarea
    const expectedOutput = document.getElementById('admin-expected-output');
    const toggleBtn = document.getElementById('toggle-expected-output');
    if (toggleBtn && expectedOutput) {
      let expanded = false;
      toggleBtn.onclick = () => {
        expanded = !expanded;
        if (expanded) {
          expectedOutput.rows = 12;
          expectedOutput.style.maxHeight = '400px';
          toggleBtn.textContent = 'Show Less';
        } else {
          expectedOutput.rows = 3;
          expectedOutput.style.maxHeight = '120px';
          toggleBtn.textContent = 'Show More';
        }
      };
    }

    adminForm.onsubmit = (e) => {
      e.preventDefault();
      const provider = document.getElementById('admin-llm-provider').value;
      const modelName = document.getElementById('admin-llm-model').value;
      const prefix = provider === 'openrouter' ? 'openrouter/' : 'openai/';

      adminConfig = {
        agentPrompt: {
          role: document.getElementById('admin-role').value,
          goal: document.getElementById('admin-goal').value,
          backstory: document.getElementById('admin-backstory').value
        },
        llmProvider: provider,
        llmModel: prefix + modelName,
        modelAttributes: {
          memory: document.getElementById('admin-memory').checked,
          cache: document.getElementById('admin-cache').checked,
          max_iter: parseInt(document.getElementById('admin-max-iter').value, 10) || 10,
          respect_context_window: document.getElementById('admin-respect-context').checked
        },
        taskDescription: document.getElementById('admin-task-desc').value,
        expectedOutput: document.getElementById('admin-expected-output').value
      };

      saveConfig(adminConfig);
      document.getElementById('admin_modal').close();
      render(); // Re-render to reflect changes if needed, though modal is closed
      return false; // Prevent form submission
    };

    document.getElementById('admin-reset').onclick = () => {
      if (confirm('Are you sure you want to reset all settings to their default values?')) {
        resetConfig();
        adminConfig = loadConfig();
        document.getElementById('admin_modal').close();
        render();
      }
    };
  }
  // Attach form handler for chat
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
    body: JSON.stringify({ message: userMessage, session_id, admin_config: adminConfig })
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
  messages.push({ role: 'agent', content: agentMsg, time: new Date() });
  render();
}


render();
