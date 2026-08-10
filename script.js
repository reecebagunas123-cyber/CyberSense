document.addEventListener('DOMContentLoaded', () => {

  // === SPA Router ===
  // Maps a URL path to the section it shows and the tab title to display.
  const routes = {
    '/':             { section: 'page-home',         title: 'CyberSense | Home' },
    '/scanner':      { section: 'page-scanner',       title: 'CyberSense | Scanner' },
    '/how-it-works': { section: 'page-how-it-works',  title: 'CyberSense | How It Works' },
    '/about':        { section: 'page-about',         title: 'CyberSense | About' },
  };

  function resolveRoute(path) {
    return routes[path] || routes['/'];
  }

  function renderRoute(path, { pushHistory = true } = {}) {
    const route = resolveRoute(path);

    // Show only the matching section, hide the rest.
    document.querySelectorAll('.page-section').forEach((sectionEl) => {
      sectionEl.classList.toggle('is-active', sectionEl.id === route.section);
    });

    // Reflect the current route in the nav.
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('is-active-link', link.dataset.route === path);
    });

    document.title = route.title;

    if (pushHistory) {
      history.pushState({ path }, '', path);
    }

    // Jump to the top of the freshly shown section (it's a page switch,
    // not a scroll-based transition).
    window.scrollTo(0, 0);
  }

  // Intercept clicks on any internal nav link so it swaps sections instead
  // of doing a full page reload.
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return; // let external/other links behave normally
      e.preventDefault();
      if (href === location.pathname) return; // already there
      renderRoute(href);
    });
  });

  // Handle browser Back/Forward buttons.
  window.addEventListener('popstate', () => {
    renderRoute(location.pathname, { pushHistory: false });
  });

  // Initial render based on whatever URL the page was loaded with
  // (deep links like /about or /scanner work on first load too).
  renderRoute(location.pathname, { pushHistory: false });

  // === Scroll-reveal (IntersectionObserver, no scroll listeners) ===
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // === Scanner tabs ===
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const tabId = btn.dataset.tab;
      tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
          content.classList.remove('hidden');
          content.classList.add('flex');
        } else {
          content.classList.add('hidden');
          content.classList.remove('flex');
        }
      });
    });
  });

  // === AI check (now calls our own serverless function, not Gemini directly) ===
  async function checkWithGemini(inputText, type = "text") {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText, type }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("API error:", errData);
        return "Error contacting AI.";
      }

      const data = await res.json();
      return data?.result || "No response from AI.";
    } catch (err) {
      console.error(err);
      return "Error contacting AI.";
    }
  }

  function showResultBox(container, type, message) {
    container.classList.remove('hidden', 'result-loading', 'result-safe', 'result-scam', 'result-warn');
    container.classList.add('result-box');
    container.innerHTML = `<h3 class="font-semibold mb-1 font-tech text-xs uppercase tracking-wider">Analysis result</h3><p>${message}</p>`;
    if (type === 'loading') container.classList.add('result-loading');
    if (type === 'warning') container.classList.add('result-warn');
    if (type === 'scam') container.classList.add('result-scam');
    if (type === 'safe') container.classList.add('result-safe');
  }

  // === Link scan ===
  const linkInput = document.getElementById('link-input');
  const scanLinkBtn = document.getElementById('scan-link-btn');
  const linkResult = document.getElementById('link-result');

  async function handleLinkScan() {
    const url = linkInput.value.trim();
    if (!url) return showResultBox(linkResult, 'warning', 'Please enter a URL to scan.');
    showResultBox(linkResult, 'loading', 'Analyzing with AI...');
    const res = await checkWithGemini(url, "URL");
    if (res.toUpperCase().includes("SCAM")) showResultBox(linkResult, 'scam', res);
    else showResultBox(linkResult, 'safe', res);
  }

  scanLinkBtn.addEventListener('click', handleLinkScan);
  linkInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleLinkScan();
  });

  // === Text (SMS) scan ===
  const textInput = document.getElementById('text-input');
  const scanTextBtn = document.getElementById('scan-text-btn');
  const textResult = document.getElementById('text-result');

  async function handleTextScan() {
    const msg = textInput.value.trim();
    if (!msg) return showResultBox(textResult, 'warning', 'Please enter a message to scan.');
    showResultBox(textResult, 'loading', 'Analyzing with AI...');
    const res = await checkWithGemini(msg, "SMS");
    if (res.toUpperCase().includes("SCAM")) showResultBox(textResult, 'scam', res);
    else showResultBox(textResult, 'safe', res);
  }

  scanTextBtn.addEventListener('click', handleTextScan);
  textInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleTextScan();
  });

  // === Email scan ===
  const emailInput = document.getElementById('email-input');
  const scanEmailBtn = document.getElementById('scan-email-btn');
  const emailResult = document.getElementById('email-result');

  async function handleEmailScan() {
    const msg = emailInput.value.trim();
    if (!msg) return showResultBox(emailResult, 'warning', 'Please enter an email to scan.');
    showResultBox(emailResult, 'loading', 'Analyzing with AI...');
    const res = await checkWithGemini(msg, "Email");
    if (res.toUpperCase().includes("SCAM")) showResultBox(emailResult, 'scam', res);
    else showResultBox(emailResult, 'safe', res);
  }

  scanEmailBtn.addEventListener('click', handleEmailScan);
  emailInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEmailScan();
    }
  });

  // === Chat widget ===
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatPanel = document.getElementById('chat-panel');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatBox = document.getElementById('chat-box');
  let chatOpened = false;

  function openChat() {
    chatPanel.classList.add('is-open');
    chatToggleBtn.setAttribute('aria-expanded', 'true');
    chatToggleBtn.classList.remove('fab-pulse');
    if (!chatOpened) {
      showWelcomeMessage();
      chatOpened = true;
    }
  }

  function closeChat() {
    chatPanel.classList.remove('is-open');
    chatToggleBtn.setAttribute('aria-expanded', 'false');
  }

  chatToggleBtn.addEventListener('click', () => {
    if (chatPanel.classList.contains('is-open')) closeChat();
    else openChat();
  });
  chatCloseBtn.addEventListener('click', closeChat);

  // Stop drawing attention to the FAB after a while if the user hasn't opened it
  setTimeout(() => chatToggleBtn.classList.remove('fab-pulse'), 9000);

  function addMessage(role, text, typing = false) {
    const msg = document.createElement('div');
    msg.className = (role === 'user' ? 'msg-user' : 'msg-bot') + (typing ? ' typing-dots' : '');
    msg.innerHTML = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  function showWelcomeMessage() {
    chatBox.innerHTML = '';
    addMessage('assistant', 'Hello! I’m CyberSense Assistant. I can help you spot scams, understand phishing tricks, or give online safety tips. What would you like to know today?');
  }

  async function handleChatSend() {
    const q = chatInput.value.trim();
    if (!q) return;

    addMessage('user', q);
    chatInput.value = '';

    const typingMsg = addMessage('assistant', 'Typing...', true);

    const res = await checkWithGemini(q, "Chat");

    typingMsg.classList.remove('typing-dots');
    typingMsg.innerHTML = res;
  }

  chatSendBtn.addEventListener('click', handleChatSend);
  chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  });
});

// === Mobile menu ===
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    const nowHidden = mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex', !nowHidden);
    mobileMenuBtn.setAttribute('aria-expanded', String(!nowHidden));
    mobileMenuBtn.innerHTML = nowHidden
      ? '<i class="fa-solid fa-bars text-xl"></i>'
      : '<i class="fa-solid fa-xmark text-xl"></i>';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars text-xl"></i>';
    });
  });
}