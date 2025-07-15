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
  // DaisyUI dropdown for admin config
  const providerOptions = `
    <option value="openai" ${adminConfig.llmProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
    <option value="openrouter" ${adminConfig.llmProvider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
  `;
  // Only show/edit the model name, not the prefix
  const MODEL_OPTIONS = {
  openai: [
    'gpt-4.5-preview', 'gpt-4.1', 'gpt-4o', 'o1', 'o3', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'o1-mini', 'o3-mini'
  ],
  openrouter: [
    'moonshotai/kimi-k2:free', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'google/gemma-3n-e2b-it:free', 'tngtech/deepseek-r1t2-chimera:free', 'moonshotai/kimi-dev-72b:free',
    'deepseek/deepseek-r1-0528-qwen3-8b:free', 'mistralai/devstral-small-2505:free',
    'moonshotai/kimi-vl-a3b-thinking:free', 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', 'rekaai/reka-flash-3:free'
  ],
  groq: [
    'llama-3.1-8b-instant', 'meta-llama/llama-guard-4-12b', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'mistral-saba-24b'
  ]
};
let modelPrefix = adminConfig.llmProvider === 'openrouter' ? 'openrouter/' : adminConfig.llmProvider === 'groq' ? 'groq/' : 'openai/';
let strippedModel = adminConfig.llmModel;
if (strippedModel.startsWith('openai/')) strippedModel = strippedModel.slice('openai/'.length);
if (strippedModel.startsWith('openrouter/')) strippedModel = strippedModel.slice('openrouter/'.length);
if (strippedModel.startsWith('groq/')) strippedModel = strippedModel.slice('groq/'.length);
  // Config summary for user safety (DaisyUI card, no blue background)
  const configSummary = `
    <div class="card shadow-sm border border-base-300 mb-4 w-full" aria-live="polite">
      <div class="card-body p-4 flex flex-col gap-2 text-xs">
        <div class="font-bold text-base-content/80 mb-1 text-sm">Current Config</div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <div><span class="font-semibold">Provider:</span> ${adminConfig.llmProvider}</div>
          <div><span class="font-semibold">Model:</span> ${adminConfig.llmModel}</div>
          <div><span class="font-semibold">Role:</span> ${adminConfig.agentPrompt.role}</div>
          <div><span class="font-semibold">Goal:</span> ${adminConfig.agentPrompt.goal}</div>
          <div><span class="font-semibold">Backstory:</span> ${adminConfig.agentPrompt.backstory}</div>
          <div><span class="font-semibold">Task Desc:</span> ${(adminConfig.taskDescription || '').slice(0, 50)}${(adminConfig.taskDescription||'').length>50?'...':''}</div>
          <div><span class="font-semibold">Expected Output:</span> ${(adminConfig.expectedOutput || '').slice(0, 50)}${(adminConfig.expectedOutput||'').length>50?'...':''}</div>
          <div class="col-span-2"><span class="font-semibold">Attributes:</span> memory: ${adminConfig.modelAttributes.memory ? 'on' : 'off'}, cache: ${adminConfig.modelAttributes.cache ? 'on' : 'off'}, max_iter: ${adminConfig.modelAttributes.max_iter}, respect_context_window: ${adminConfig.modelAttributes.respect_context_window ? 'on' : 'off'}</div>
        </div>
      </div>
    </div>
  `;
  return `
    <div class="dropdown dropdown-bottom mb-4 w-full flex justify-center">
      <label tabindex="0" class="btn btn-sm btn-outline btn-primary rounded-xl" aria-label="Admin Panel" aria-haspopup="true">Admin Panel ⚙️</label>
      <div tabindex="0" class="dropdown-content z-[1] card card-compact p-6 shadow-lg bg-base-200 border border-base-300 rounded-xl w-[50vw] min-w-[600px] max-w-3xl">
        ${configSummary}
        <form id="admin-config-form" class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div class="flex flex-col gap-3">
            <div class="mb-1"><span class="badge badge-primary badge-lg">Agent Prompt</span></div>
            <label for="admin-role" class="label label-text font-semibold">Role</label>
            <input class="input input-bordered input-sm" type="text" id="admin-role" placeholder="Role" value="${adminConfig.agentPrompt.role}" aria-label="Role" tabindex="0" />
            <label for="admin-goal" class="label label-text font-semibold">Goal</label>
            <input class="input input-bordered input-sm" type="text" id="admin-goal" placeholder="Goal" value="${adminConfig.agentPrompt.goal}" aria-label="Goal" tabindex="0" />
            <label for="admin-backstory" class="label label-text font-semibold">Backstory</label>
            <textarea class="textarea textarea-bordered textarea-sm" id="admin-backstory" placeholder="Backstory" aria-label="Backstory" tabindex="0">${adminConfig.agentPrompt.backstory}</textarea>
          </div>
          <div class="flex flex-col gap-3">
            <div class="mb-1"><span class="badge badge-secondary badge-lg">LLM Provider & Model</span></div>
            <div class="flex gap-4 items-center mt-1 mb-2" role="radiogroup" aria-label="LLM Provider">
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="admin-llm-provider" id="admin-llm-provider-openai" class="radio radio-neutral" value="openai" ${adminConfig.llmProvider === 'openai' ? 'checked' : ''} tabindex="0" aria-label="OpenAI" />
    <span class="label-text">OpenAI</span>
  </label>
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="admin-llm-provider" id="admin-llm-provider-openrouter" class="radio radio-neutral" value="openrouter" ${adminConfig.llmProvider === 'openrouter' ? 'checked' : ''} tabindex="0" aria-label="OpenRouter" />
    <span class="label-text">OpenRouter</span>
  </label>
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="admin-llm-provider" id="admin-llm-provider-groq" class="radio radio-neutral" value="groq" ${adminConfig.llmProvider === 'groq' ? 'checked' : ''} tabindex="0" aria-label="Groq" />
    <span class="label-text">Groq</span>
  </label>
</div>
            <div class="flex items-center gap-2 mt-1">
  <span id="admin-llm-model-prefix" class="text-xs text-base-content/60">${modelPrefix}</span>
  <input class="input input-bordered input-sm flex-1" type="text" id="admin-llm-model" placeholder="Model name (e.g. gpt-4.1-nano or mistralai/mistral-small-3.2-24b-instruct)" value="${strippedModel}" aria-label="LLM Model" tabindex="0" />
</div>
<ul class="menu bg-base-200 rounded-box w-56 mt-2" id="admin-model-menu">
  ${MODEL_OPTIONS[adminConfig.llmProvider].map(opt => `
    <li><a class="${strippedModel === opt ? 'active bg-primary text-primary-content' : ''}" data-model="${opt}">${opt}</a></li>
  `).join('')}
</ul>
            <div class="text-xs text-base-content/60 mt-2 admin-provider-endpoint">Endpoint: ${modelPrefix}${adminConfig.llmModel.replace(modelPrefix, '')} (${adminConfig.llmProvider === 'openrouter' ? 'https://openrouter.ai/api/v1' : adminConfig.llmProvider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'})</div>
            <div class="mb-1 mt-2"><span class="badge badge-accent badge-lg">Model Attributes</span></div>
            <div class="form-control flex flex-row gap-2 items-center">
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Memory</span>
                <input type="checkbox" id="admin-memory" class="toggle toggle-primary" ${adminConfig.modelAttributes.memory ? 'checked' : ''} tabindex="0" aria-label="Memory" />
              </label>
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Cache</span>
                <input type="checkbox" id="admin-cache" class="toggle toggle-primary" ${adminConfig.modelAttributes.cache ? 'checked' : ''} tabindex="0" aria-label="Cache" />
              </label>
            </div>
            <div class="form-control flex flex-row gap-2 items-center">
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Respect Context Window</span>
                <input type="checkbox" id="admin-respect-context" class="toggle toggle-primary" ${adminConfig.modelAttributes.respect_context_window ? 'checked' : ''} tabindex="0" aria-label="Respect Context Window" />
              </label>
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Max Iter</span>
                <input type="number" id="admin-max-iter" class="input input-bordered input-xs w-16" value="${adminConfig.modelAttributes.max_iter}" min="1" max="100" tabindex="0" aria-label="Max Iter" />
              </label>
            </div>
            <div class="mb-1 mt-2"><span class="badge badge-info badge-lg">Task Settings</span></div>
            <label for="admin-task-desc" class="label label-text font-semibold">Task Description</label>
            <textarea class="textarea textarea-bordered textarea-sm" id="admin-task-desc" placeholder="Task Description" aria-label="Task Description" tabindex="0" rows="2">${adminConfig.taskDescription || ''}</textarea>
            <label for="admin-expected-output" class="label label-text font-semibold">Expected Output</label>
            <div class="relative">
              <textarea class="textarea textarea-bordered textarea-sm" id="admin-expected-output" placeholder="Expected Output" aria-label="Expected Output" tabindex="0" rows="3" style="resize:vertical; max-height:120px; overflow:auto;">${adminConfig.expectedOutput || ''}</textarea>
              <button type="button" id="toggle-expected-output" class="btn btn-xs btn-outline absolute right-2 bottom-2 z-10">Show More</button>
            </div>
          </div>
          <div class="col-span-2 flex gap-2 mt-3">
            <button type="submit" class="btn btn-primary btn-sm rounded-xl flex-1" tabindex="0" aria-label="Save">Save</button>
            <button id="admin-reset" type="button" class="btn btn-outline btn-sm rounded-xl flex-1" tabindex="0" aria-label="Reset to Default">Reset to Default</button>
          </div>
          </form>
        </form>
      </div>
    </div>
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
  // Live prefix update logic for provider radio buttons
  const providerRadios = document.querySelectorAll('input[name="admin-llm-provider"]');
  const modelInput = document.getElementById('admin-llm-model');
  const prefixSpan = document.getElementById('admin-llm-model-prefix');
  const endpointDiv = document.querySelector('.admin-provider-endpoint');
  if (providerRadios && modelInput && prefixSpan && endpointDiv) {
    providerRadios.forEach(radio => {
      radio.addEventListener('change', e => {
        const provider = e.target.value;
        let prefix = provider === 'openrouter' ? 'openrouter/' : 'openai/';
        prefixSpan.textContent = prefix;
        // Remove any prefix from model input value
        let val = modelInput.value;
        if (val.startsWith('openai/')) val = val.slice('openai/'.length);
        if (val.startsWith('openrouter/')) val = val.slice('openrouter/'.length);
        modelInput.value = val;
        // Update endpoint display below
        endpointDiv.textContent = `Endpoint: ${provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'}`;
        // Update config and re-render UI so endpoint and all UI updates
        adminConfig.llmProvider = provider;
        adminConfig.llmModel = prefix + val;
        saveConfig(adminConfig);
      });
    });
  }
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
  const providerRadio = document.querySelector('input[name="admin-llm-provider"]:checked');
  const provider = providerRadio ? providerRadio.value : 'openai';
  const modelInput = document.getElementById('admin-llm-model');
  const modelName = modelInput ? modelInput.value : '';
  const prefix = provider === 'openrouter' ? 'openrouter/' : 'openai/';
  adminConfig = {
    agentPrompt: {
      role: document.getElementById('admin-role')?.value || '',
      goal: document.getElementById('admin-goal')?.value || '',
      backstory: document.getElementById('admin-backstory')?.value || ''
    },
    llmProvider: provider,
    llmModel: prefix + modelName,
    modelAttributes: {
      memory: document.getElementById('admin-memory')?.checked || false,
      cache: document.getElementById('admin-cache')?.checked || false,
      max_iter: parseInt(document.getElementById('admin-max-iter')?.value, 10) || 10,
      respect_context_window: document.getElementById('admin-respect-context')?.checked || false
    },
    taskDescription: document.getElementById('admin-task-desc')?.value || '',
    expectedOutput: document.getElementById('admin-expected-output')?.value || ''
  };
  saveConfig(adminConfig);

  // Collapse the admin panel modal/dropdown BEFORE render
  const dropdown = document.querySelector('.dropdown');
  if (dropdown) {
    // Only click the label if dropdown is open (aria-expanded=true or dropdown-content visible)
    const label = dropdown.querySelector('label[tabindex="0"]');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    if (label && dropdownContent && dropdownContent.offsetParent !== null) {
      label.blur(); // Remove focus to collapse dropdown
      // Fallback: focus chat input if present, else document.body
      setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.focus();
        } else {
          document.body.focus();
        }
      }, 10);
    }
  }

  // Show DaisyUI toast notification (inject into document.body, not app)
  showToast('Settings saved!');
  return false;
};
    document.getElementById('admin-reset').onclick = () => {
      resetConfig();
      adminConfig = loadConfig();
      render();
    };
  }

  // Attach click handler for model menu
  const modelMenu = document.getElementById('admin-model-menu');
  if (modelMenu) {
    modelMenu.querySelectorAll('a[data-model]').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        const selectedModel = a.getAttribute('data-model');
        const modelPrefix = adminConfig.llmProvider === 'openrouter' ? 'openrouter/' : adminConfig.llmProvider === 'groq' ? 'groq/' : 'openai/';
        document.getElementById('admin-llm-model').value = selectedModel;
        adminConfig.llmModel = modelPrefix + selectedModel;
        saveConfig(adminConfig);
        showToast('Model updated!');
        // Visually update selection
        modelMenu.querySelectorAll('a[data-model]').forEach(x => x.classList.remove('active', 'bg-primary', 'text-primary-content'));
        a.classList.add('active', 'bg-primary', 'text-primary-content');
      };
    });
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

function showToast(message) {
  // Use DaisyUI .toast markup
  let toastContainer = document.querySelector('.toast.toast-top.toast-end');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast toast-top toast-end';
    document.body.appendChild(toastContainer);
  }
  // Remove any existing toasts (only show one at a time)
  while (toastContainer.firstChild) toastContainer.removeChild(toastContainer.firstChild);
  const toast = document.createElement('div');
  toast.className = 'alert alert-success';
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 1800);
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
