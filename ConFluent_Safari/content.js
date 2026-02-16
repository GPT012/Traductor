// ===================================
// AUTO TRANSLATOR v2.1 - CROSS-BROWSER
// Chrome + Safari Support
// Universal Support: Ctrl+A+Ctrl+V + Generic Detection
// + Configurable Delay & Language
// + Premium Minimalist Design
// + Anti-Zombie & High Fidelity Events
// + Self-Healing on Tab Switch
// + Rapid (Instant) & Pro (Sentence) Modes
// + Conversation Mode (Incoming Translation)
// + Safari Clipboard Fallback
// ===================================

(function () {
  'use strict';

  // === PREVENTION DOUBLONS ===
  if (window.hasAutoTranslatorRunning) return;
  window.hasAutoTranslatorRunning = true;

  console.log('%c🌐 Translator v2.1 (Cross-Browser)', 'background: #000; color: white; padding: 6px 12px; border-radius: 999px;');

  // === STATE ===
  let isEnabled = true;
  let typingTimer = null;
  let originalText = '';
  let lastTranslated = '';
  let isTranslating = false;
  let isDeleting = false;
  let lastInputTime = 0;

  // Conversation Mode State
  let observer = null;
  let processedNodes = new WeakSet();

  // Default Config
  let settings = {
    delay: 1000,
    targetLang: 'en',
    triggerMode: 'timer',
    conversationMode: false,
    myLang: 'fr'
  };

  // === CSS (PREMIUM DESIGN) ===
  const style = document.createElement('style');
  style.id = 'tr-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    @keyframes tr-fade-in { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes tr-pulse-ring { 0% { transform: scale(0.33); } 80%, 100% { opacity: 0; } }
    @keyframes tr-spin { to { transform: rotate(360deg); } }
    
    #tr-badge {
      all: initial !important;
      position: fixed !important;
      bottom: 30px !important;
      right: 30px !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 10px 16px !important;
      background: rgba(15, 23, 42, 0.85) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 999px !important;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.1), 
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: rgba(255, 255, 255, 0.9) !important;
      z-index: 2147483647 !important;
      cursor: pointer !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      animation: tr-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
      user-select: none !important;
      letter-spacing: -0.01em !important;
    }
    
    #tr-badge:hover { 
      transform: translateY(-2px) !important; 
      background: rgba(15, 23, 42, 0.95) !important;
      box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.2), 
        0 4px 6px -2px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
    }
    
    #tr-badge:active { transform: translateY(0) scale(0.98) !important; }

    /* LED Status Indicator */
    #tr-indicator {
      position: relative !important;
      width: 8px !important;
      height: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #tr-dot {
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      background: #94a3b8 !important; /* Default Off */
      transition: all 0.3s ease !important;
    }

    #tr-ring {
      position: absolute !important;
      width: 24px !important;
      height: 24px !important;
      border-radius: 50% !important;
      border: 1px solid transparent !important;
      opacity: 0 !important;
    }

    /* States */
    #tr-badge.state-on #tr-dot { background: #10b981 !important; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4) !important; }
    #tr-badge.state-off #tr-dot { background: #475569 !important; box-shadow: none !important; }
    
    #tr-badge.state-typing #tr-dot { background: #6366f1 !important; }
    #tr-badge.state-typing #tr-ring { 
      border-color: #6366f1 !important;
      animation: tr-pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite !important;
    }

    #tr-badge.state-working #tr-dot { 
      background: transparent !important;
      border: 2px solid rgba(99, 102, 241, 0.3) !important;
      border-top-color: #6366f1 !important;
      border-radius: 50% !important;
      width: 10px !important;
      height: 10px !important;
      animation: tr-spin 0.8s linear infinite !important;
      box-shadow: none !important;
    }

    #tr-badge.state-done #tr-dot { background: #10b981 !important; transform: scale(1.2) !important; }
    #tr-badge.state-error #tr-dot { background: #ef4444 !important; }

    #tr-text {
      opacity: 0.9 !important;
      white-space: nowrap !important;
      max-width: 150px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    
    #tr-sub {
      font-size: 10px !important;
      color: rgba(255,255,255,0.5) !important;
      margin-left: -6px !important;
      font-weight: 400 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
    }
  `;

  // === BADGE ===
  const oldBadge = document.getElementById('tr-badge');
  if (oldBadge) oldBadge.remove();

  const badge = document.createElement('div');
  badge.id = 'tr-badge';
  badge.innerHTML = `
    <div id="tr-indicator"><div id="tr-ring"></div><div id="tr-dot"></div></div>
    <span id="tr-text">Ready</span>
    <span id="tr-sub">${settings.targetLang.toUpperCase()}</span>
  `;

  function updateBadgeUI(state, text) {
    if (!badge || !badge.isConnected) return;
    badge.classList.remove('state-on', 'state-off', 'state-typing', 'state-working', 'state-done', 'state-error');
    badge.classList.add(`state-${state}`);

    const textEl = badge.querySelector('#tr-text');
    const subEl = badge.querySelector('#tr-sub');
    if (subEl) subEl.textContent = settings.targetLang.toUpperCase();
    if (text) {
      if (textEl) textEl.textContent = text;
      if (state === 'done') setTimeout(() => { if (textEl) textEl.textContent = 'Ready'; }, 2000);
    } else {
      if (!textEl) return;
      if (state === 'off') textEl.textContent = 'Disabled';
      else if (state === 'on') textEl.textContent = 'Ready';
      else if (state === 'typing') textEl.textContent = 'Typing...';
      else if (state === 'waiting') textEl.textContent = 'Waiting...';
      else if (state === 'working') textEl.textContent = 'Translating...';
    }
  }

  function toggle() {
    isEnabled = !isEnabled;
    updateBadgeUI(isEnabled ? 'on' : 'off');
    chrome.storage.local.set({ enabled: isEnabled });
  }

  badge.onclick = (e) => { if (e.detail === 1) toggle(); };
  badge.ondblclick = (e) => { e.preventDefault(); };

  // === HELPERS ===
  function find() {
    const a = document.activeElement;
    if (!a) return null;
    if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') return a;
    if (a.isContentEditable) return a;
    if (a.getAttribute('role') === 'textbox' || a.getAttribute('role') === 'searchbox') return a;
    return a.closest('[data-slate-editor="true"]') || a.closest('[contenteditable="true"]') || a.closest('[role="textbox"]');
  }

  function getText(el) {
    if (!el) return '';
    try {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value;
      return el.innerText || el.textContent || '';
    } catch (e) { return ''; }
  }

  // === HIGH FIDELITY SIMULATION ===
  function createKeyEvent(type, key, code, keyCode) {
    return new KeyboardEvent(type, {
      key: key, code: code, keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true, composed: true, ctrlKey: true, metaKey: true, view: window
    });
  }

  // Safari-safe clipboard write with fallback
  async function safeClipboardWrite(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // Safari blocks clipboard in non-secure or non-user-gesture contexts
    }
    // Fallback: use textarea + execCommand (works on Safari)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function autoCtrlACtrlV(el, newText) {
    try {
      await safeClipboardWrite(newText);
      el.focus();
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { try { el.select(); } catch (e) { } }
      else { try { const s = window.getSelection(), r = document.createRange(); r.selectNodeContents(el); s.removeAllRanges(); s.addRange(r); } catch (e) { } }

      el.dispatchEvent(createKeyEvent('keydown', 'a', 'KeyA', 65));
      el.dispatchEvent(createKeyEvent('keypress', 'a', 'KeyA', 65));
      el.dispatchEvent(createKeyEvent('keyup', 'a', 'KeyA', 65));

      await new Promise(r => setTimeout(r, 50));

      el.dispatchEvent(createKeyEvent('keydown', 'v', 'KeyV', 86));
      el.dispatchEvent(createKeyEvent('keypress', 'v', 'KeyV', 86));

      const dt = new DataTransfer(); dt.setData('text/plain', newText);
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, composed: true, clipboardData: dt, view: window }));

      el.dispatchEvent(createKeyEvent('keyup', 'v', 'KeyV', 86));

      await new Promise(r => setTimeout(r, 50));
      if (getText(el).trim() !== newText.trim()) {
        if (el.tagName === 'TEXTAREA') { (Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set || function (v) { this.value = v }).call(el, newText); }
        else if (el.tagName === 'INPUT') { (Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set || function (v) { this.value = v }).call(el, newText); }
        else { (Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')?.set || function (v) { this.innerText = v }).call(el, newText); }
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: newText, composed: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (err) { console.error('AutoPaste Warning:', err); }
  }

  // === TRANSLATION LOGIC ===
  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && e.key.length === 1) lastInputTime = Date.now();
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
      isDeleting = true; clearTimeout(typingTimer);
    }
  }, true);

  function translate(el, text, ignoreGuard = false) {
    if (isTranslating || !text || text.length < 2 || text === lastTranslated) return;
    // Don't check guard if explicit trigger (Pro Mode)
    if (!ignoreGuard && Date.now() - lastInputTime < 50) return;

    isTranslating = true;
    updateBadgeUI('working');

    try {
      chrome.runtime.sendMessage({ action: 'translate', text, targetLang: settings.targetLang }, async (res) => {
        try {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes('context invalidated')) { destroy(); return; }
            updateBadgeUI('error'); setTimeout(() => updateBadgeUI('on'), 2000); return;
          }
          if (res?.translation && res.translation.toLowerCase() !== text.toLowerCase()) {
            // Check guard again unless ignored
            if (ignoreGuard || (getText(el) === text && Date.now() - lastInputTime > 50)) {
              await autoCtrlACtrlV(el, res.translation); // Paste triggers input events, must be ignored by isTranslating=true
              originalText = res.translation;
              lastTranslated = res.translation;
              updateBadgeUI('done', res.translation);
            } else updateBadgeUI('on');
          } else updateBadgeUI('on');
        } finally {
          isTranslating = false; // Release lock only after paste completes
        }
      });
    } catch (e) { isTranslating = false; destroy(); }
  }

  function handleInput(e) {
    if (!isEnabled || isTranslating) return;
    lastInputTime = Date.now();
    const el = find();
    if (!el) return;
    const currentText = getText(el).trim();

    if (isDeleting) { isDeleting = false; originalText = currentText; return; }
    if (currentText.length < originalText.length) { originalText = currentText; clearTimeout(typingTimer); return; }
    if (currentText.length === 0) { originalText = ''; lastTranslated = ''; clearTimeout(typingTimer); return; }

    if (currentText !== lastTranslated && currentText.length >= 2) {
      updateBadgeUI('typing');
      clearTimeout(typingTimer);

      const mode = settings.triggerMode || 'timer';

      if (mode === 'pro') {
        // PRO MODE: Trigger only on sentence end
        const lastChar = currentText.slice(-1);
        if (['.', '!', '?', '\n'].includes(lastChar)) {
          console.log('Pro Mode Trigger: Sentence End detected');
          updateBadgeUI('waiting');
          translate(el, currentText, true);
        }
      }
      else if (mode === 'rapid') {
        // RAPID MODE (v2): Word-by-Word
        const lastChar = currentText.slice(-1);
        if ([' ', '.', ',', '!', '?', '\n'].includes(lastChar)) {
          typingTimer = setTimeout(() => {
            updateBadgeUI('waiting');
            translate(el, currentText, true); // Instant trigger + Ignore guard
          }, 50);
        } else {
          typingTimer = setTimeout(() => {
            updateBadgeUI('waiting');
            translate(el, currentText);
          }, 1000);
        }
      }
      else {
        // TIMER MODE
        typingTimer = setTimeout(() => {
          updateBadgeUI('waiting');
          translate(el, currentText);
        }, settings.delay);
      }
    }
  }

  // === CONVERSATION MODE (INCOMING) ===
  function startConversationMode() {
    if (observer) observer.disconnect();
    processedNodes = new WeakSet();

    console.log('🗣️ Conversation Mode STARTED: Reading in', settings.myLang);
    updateBadgeUI('on'); // Re-init badge state

    observer = new MutationObserver(mutations => {
      if (!isEnabled || !settings.conversationMode) return;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            walkAndTranslate(node);
          });
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopConversationMode() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    processedNodes = new WeakSet();
    console.log('🗣️ Conversation Mode STOPPED');
  }

  // === PAGE TRANSLATION STATE ===
  let pageTranslationTotal = 0;
  let pageTranslationPending = 0;

  function updatePageTranslationUI() {
    if (pageTranslationPending > 0) {
      updateBadgeUI('working', `Translating... ${Math.max(0, pageTranslationTotal - pageTranslationPending)}/${pageTranslationTotal}`);
    } else if (pageTranslationTotal > 0) {
      updateBadgeUI('done', 'Page Translated');
      pageTranslationTotal = 0;
      setTimeout(() => updateBadgeUI('on'), 3000);
    }
  }

  function walkAndTranslate(node) {
    // Logic anti-recursion/input
    if (processedNodes.has(node)) return;

    // Ignore Inputs/Textareas/Editable
    if (node.nodeType === 1) { // Element
      const tagName = node.tagName.toUpperCase();
      if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT' || tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      if (node.isContentEditable) return;
      if (node.getAttribute && (node.getAttribute('role') === 'textbox' || node.getAttribute('contenteditable') === 'true')) return;

      // Helper: If it's a wrapper, go deeper
      node.childNodes.forEach(child => walkAndTranslate(child));
    } else if (node.nodeType === 3) { // Text Node
      const text = node.nodeValue.trim();
      if (text.length > 2 && !processedNodes.has(node)) {
        processedNodes.add(node);

        // Track Pending
        pageTranslationTotal++;
        pageTranslationPending++;
        updatePageTranslationUI();

        // Translate incoming text
        chrome.runtime.sendMessage({
          action: 'translate',
          text: text,
          targetLang: settings.myLang // TRANSLATE TO READING LANGUAGE
        }, (res) => {
          pageTranslationPending--;
          updatePageTranslationUI();

          if (chrome.runtime.lastError) return;
          if (res && res.translation && res.translation !== text) {
            node.nodeValue = res.translation;
          }
        });
      }
    }
  }

  // === CLEANUP ===
  function destroy() {
    stopConversationMode();
    document.removeEventListener('input', handleInput, true);
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    window.hasAutoTranslatorRunning = false;
  }

  document.addEventListener('input', handleInput, true);
  document.addEventListener('click', () => { setTimeout(() => { const el = find(); if (el) originalText = getText(el); }, 100); }, true);
  document.addEventListener('focus', () => { const el = find(); if (el) originalText = getText(el); }, true);

  // === CONFIG & MESSAGING ===
  function loadConfig() {
    try {
      chrome.storage.local.get(['delay', 'targetLang', 'enabled', 'triggerMode', 'conversationMode', 'myLang'], (c) => {
        if (chrome.runtime.lastError) return;
        if (c) {
          if (c.delay) settings.delay = parseInt(c.delay);
          if (c.targetLang) settings.targetLang = c.targetLang;
          if (c.triggerMode) settings.triggerMode = c.triggerMode;
          if (c.conversationMode !== undefined) settings.conversationMode = c.conversationMode;
          if (c.myLang) settings.myLang = c.myLang;
          if (c.enabled !== undefined) isEnabled = c.enabled;

          updateBadgeUI(isEnabled ? 'on' : 'off');

          // Handle Conversation Mode Toggle
          if (isEnabled && settings.conversationMode) {
            startConversationMode();
          } else {
            stopConversationMode();
          }
        }
      });
    } catch (e) { }
  }

  chrome.runtime.onMessage.addListener((m, sender, sendResponse) => {
    if (m.action === 'ping') {
      sendResponse({ status: 'pong', enabled: isEnabled });
      return;
    }

    if (m.action === 'configChanged') {
      const oldConvMode = settings.conversationMode;

      if (m.config.delay) settings.delay = parseInt(m.config.delay);
      if (m.config.targetLang) settings.targetLang = m.config.targetLang;
      if (m.config.triggerMode) settings.triggerMode = m.config.triggerMode;
      if (m.config.conversationMode !== undefined) settings.conversationMode = m.config.conversationMode;
      if (m.config.myLang) settings.myLang = m.config.myLang;
      if (m.config.enabled !== undefined) isEnabled = m.config.enabled;

      updateBadgeUI(isEnabled ? 'on' : 'off');

      // Toggle Conversation Mode if changed
      if (isEnabled && settings.conversationMode && !observer) {
        startConversationMode();
      } else if ((!isEnabled || !settings.conversationMode) && observer) {
        stopConversationMode();
      }
    }
    if (m.action === 'statusChanged') {
      isEnabled = m.enabled;
      updateBadgeUI(isEnabled ? 'on' : 'off');
      if (isEnabled && settings.conversationMode) startConversationMode();
      else stopConversationMode();
    }

    if (m.action === 'translatePage') {
      console.log('🌍 Full Page Translation Requested');
      if (m.targetLang) settings.myLang = m.targetLang;

      // Reset and Start
      pageTranslationTotal = 0;
      pageTranslationPending = 0;
      updateBadgeUI('working', 'Scanning...');

      walkAndTranslate(document.body);

      // If nothing was found to translate
      if (pageTranslationTotal === 0) {
        updateBadgeUI('on', 'No Text Found');
        setTimeout(() => updateBadgeUI('on'), 2000);
      }
    }
  });

  // === INIT ===
  function init() {
    if (document.getElementById('tr-styles')) return;
    (document.head || document.documentElement).appendChild(style);
    (document.body || document.documentElement).appendChild(badge);
    loadConfig();
    console.log('🌐 v2.1 | Cross-Browser + Conversation Mode Ready');
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  setTimeout(init, 500);

})();
