// ===================================
// ConFluent v3.2 — OPTIMIZED TRANSLATION ENGINE
// Batch Translation + Conversation Mode
// Performance Tuned + Const Correct
// ===================================

(function () {
  'use strict';

  // === SINGLETON GUARD & IFRAME BLOCK ===
  if (window.self !== window.top) return; // Prevent running in iframes
  if (window.__confluentRunning) return;
  window.__confluentRunning = true;

  // === DEBUG FLAG (set to false for production) ===
  const DEBUG = false;

  if (DEBUG) console.log('%c🌐 ConFluent v3.2', 'background: #000; color: white; padding: 6px 12px; border-radius: 999px;');

  // === WEB AUTH LISTENER ===
  // Listens for login data from confluents.xyz login page
  let authReceived = false;
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://www.confluents.xyz' && event.origin !== 'https://confluents.xyz') return;
    if (event.data?.type === 'CONFLUENT_AUTH' && !authReceived) {
      const user = event.data.user;
      const settings = event.data.settings;
      if (user && user.email) {
        authReceived = true;
        const storageData = { user };
        if (settings) {
          Object.assign(storageData, settings);
        }

        chrome.storage.local.set(storageData, () => {
          if (DEBUG) console.log('🔐 ConFluent: Logged in and synced as', user.name);
          // Tell the page we got the data
          window.postMessage({ type: 'CONFLUENT_AUTH_OK' }, event.origin);
        });
      }
    }
  });

  // === STATE ===
  let isEnabled = true;
  let isTranslating = false;
  let isDeleting = false;
  let typingTimer = null;
  let originalText = '';
  let lastTranslated = '';
  let lastInputTime = 0;
  let translationGeneration = 0; // Stale callback guard

  // Conversation Mode State
  let observer = null;
  const processedNodes = new WeakSet();
  const translatedMap = new WeakMap();

  // Batching
  const batchQueue = [];
  let batchTimer = null;
  const BATCH_DELAY = 100;
  const MAX_BATCH_SIZE = 50;

  // Config
  const settings = {
    delay: 1000,
    targetLang: 'en',
    triggerMode: 'timer',
    conversationMode: false,
    myLang: 'fr',
    theme: 'light'
  };

  // === PLATFORM DETECTION ===
  const IS_MAC = /Mac/.test(navigator.userAgent);

  // === INJECTED STYLES ===
  const style = document.createElement('style');
  style.id = 'tr-styles';
  style.textContent = `
    @keyframes tr-fade-in { from { opacity: 0; transform: scale(0.8) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes tr-pulse-violet { 0% { box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.3), inset 0 0 0 0 rgba(139, 92, 246, 0); } 50% { box-shadow: 0 10px 40px -5px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1); } 100% { box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.3), inset 0 0 0 0 rgba(139, 92, 246, 0); } }
    @keyframes tr-spin-subtle { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    #tr-badge {
      all: initial !important;
      position: fixed !important;
      bottom: 30px !important;
      right: 30px !important;
      width: 56px !important;
      height: 56px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      z-index: 2147483647 !important;
      user-select: none !important;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease !important;
      animation: tr-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;

      background: var(--tr-orb-bg, radial-gradient(120% 120% at 30% 30%, #ffffff 0%, #f8fafc 40%, #e2e8f0 100%)) !important;
      box-shadow: var(--tr-orb-shadow,
        inset 2px 2px 5px rgba(255, 255, 255, 1),
        inset -5px -5px 15px rgba(148, 163, 184, 0.3),
        0 15px 35px -10px rgba(15, 23, 42, 0.2),
        0 5px 15px -5px rgba(15, 23, 42, 0.1)) !important;
      border: var(--tr-orb-border, 1px solid rgba(255, 255, 255, 0.4)) !important;
    }

    #tr-badge:hover {
      transform: scale(1.08) translateY(-4px) !important;
      box-shadow:
        inset 2px 2px 5px rgba(255, 255, 255, 1),
        inset -5px -5px 15px rgba(148, 163, 184, 0.3),
        0 25px 45px -12px rgba(15, 23, 42, 0.25),
        0 10px 20px -8px rgba(15, 23, 42, 0.15) !important;
    }

    #tr-badge:active { transform: scale(0.96) translateY(0) !important; }

    #tr-icon {
      width: 26px !important;
      height: 26px !important;
      color: #94a3b8 !important;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.8)) drop-shadow(0 -1px 0 rgba(0,0,0,0.15)) !important;
      transition: color 0.4s ease, filter 0.4s ease, transform 0.4s ease !important;
      opacity: 0.8 !important;
    }

    /* STATES */
    #tr-badge.state-on {
       box-shadow:
        inset 2px 2px 5px rgba(255, 255, 255, 1),
        inset -5px -5px 15px rgba(148, 163, 184, 0.2),
        0 15px 35px -10px rgba(16, 185, 129, 0.3),
        0 5px 15px -5px rgba(16, 185, 129, 0.2) !important;
    }
    #tr-badge.state-on #tr-icon {
      color: #10b981 !important;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)) !important;
      opacity: 1 !important;
    }

    #tr-badge.state-off {
      background: radial-gradient(120% 120% at 30% 30%, #f1f5f9 0%, #e2e8f0 100%) !important;
      box-shadow:
        inset 1px 1px 3px rgba(255, 255, 255, 0.8),
        inset -2px -2px 8px rgba(148, 163, 184, 0.2),
        0 10px 25px -8px rgba(15, 23, 42, 0.15) !important;
    }
    #tr-badge.state-off #tr-icon {
      color: #ef4444 !important;
      opacity: 0.5 !important;
      filter: grayscale(0.5) !important;
    }

    #tr-badge.state-working {
      animation: tr-pulse-violet 2.5s infinite ease-in-out !important;
      background: radial-gradient(120% 120% at 30% 30%, #ffffff 0%, #fdf4ff 40%, #f3e8ff 100%) !important;
    }
    #tr-badge.state-working #tr-icon {
      color: #8b5cf6 !important;
      filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.6)) !important;
      opacity: 1 !important;
    }

    #tr-badge.state-error {
      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both !important;
      box-shadow:
        inset 2px 2px 5px rgba(255, 255, 255, 1),
        0 0 0 2px rgba(249, 115, 22, 0.8),
        0 15px 35px -10px rgba(249, 115, 22, 0.4) !important;
    }
    #tr-badge.state-error #tr-icon {
      color: #f97316 !important;
    }

    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

    /* === DARK MODE === */
    #tr-badge.tr-dark-mode,
    #tr-badge.tr-dark-mode.state-on,
    #tr-badge.tr-dark-mode.state-off,
    #tr-badge.tr-dark-mode.state-working,
    #tr-badge.tr-dark-mode.state-error,
    #tr-badge.tr-dark-mode:hover {
        background: #131215 !important;
        box-shadow: none !important;
        border: none !important;
        animation: none !important;
    }

    #tr-badge.tr-dark-mode.state-working {
        animation: tr-pulse-violet 2.5s infinite ease-in-out !important;
    }

    #tr-badge.tr-dark-mode #tr-icon {
        color: #e2e8f0 !important;
        filter: none !important;
        opacity: 0.9 !important;
    }

    #tr-badge.tr-dark-mode.state-off #tr-icon {
        color: #ef4444 !important;
        opacity: 0.6 !important;
    }
  `;

  // === BADGE ===
  const oldBadge = document.getElementById('tr-badge');
  if (oldBadge) oldBadge.remove();

  const badge = document.createElement('div');
  badge.id = 'tr-badge';
  badge.innerHTML = `
    <svg id="tr-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 7.5C15.8807 7.5 17 8.61929 17 10C17 11.3807 15.8807 12.5 14.5 12.5C13.1193 12.5 12 11.3807 12 10C12 8.61929 13.1193 7.5 14.5 7.5ZM9.5 7.5C10.8807 7.5 12 8.61929 12 10C12 11.3807 10.8807 12.5 9.5 12.5C8.11929 12.5 7 11.3807 7 10C7 8.61929 8.11929 7.5 9.5 7.5ZM14.5 5.5C12.756 5.5 11.129 6.275 10 7.545C8.871 6.275 7.244 5.5 5.5 5.5C2.462 5.5 0 7.962 0 11C0 14.038 2.462 16.5 5.5 16.5C7.244 16.5 8.871 15.725 10 14.455C11.129 15.725 12.756 16.5 14.5 16.5C17.538 16.5 20 14.038 20 11C20 7.962 17.538 5.5 14.5 5.5Z" />
    </svg>
  `;

  // === BADGE UI ===
  const BADGE_STATES = ['state-on', 'state-off', 'state-typing', 'state-working', 'state-waiting', 'state-done', 'state-error'];
  const WORKING_STATES = new Set(['typing', 'working', 'waiting']);

  function updateBadgeUI(state, text) {
    if (!badge?.isConnected) return;
    badge.classList.remove(...BADGE_STATES);

    // Hide sphere when disabled, show when active
    if (state === 'off') {
      badge.style.setProperty('display', 'none', 'important');
    } else {
      badge.style.setProperty('display', 'flex', 'important');
    }

    if (WORKING_STATES.has(state)) {
      badge.classList.add('state-working');
      badge.title = text || 'Translating...';
    } else if (state === 'done') {
      badge.classList.add('state-on');
      badge.title = 'Ready';
    } else {
      badge.classList.add(`state-${state}`);
      badge.title = state === 'on' ? 'Ready' : 'Disabled';
    }
  }

  function updateTheme(theme) {
    if (!badge) return;
    if (theme === 'dark') {
      badge.classList.add('tr-dark-mode');
    } else {
      badge.classList.remove('tr-dark-mode');
      badge.style.removeProperty('--tr-orb-bg');
      badge.style.removeProperty('--tr-orb-shadow');
      badge.style.removeProperty('--tr-orb-border');
    }
  }

  function toggle() {
    isEnabled = !isEnabled;
    updateBadgeUI(isEnabled ? 'on' : 'off');
    chrome.storage.local.set({ enabled: isEnabled });
  }

  badge.ondblclick = (e) => {
    e.preventDefault();
    toggle();
  };

  // === INPUT FIELD DETECTION ===
  function findActiveEditor() {
    const a = document.activeElement;
    if (a) {
      if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') return a;
      const editor = a.closest('[data-slate-editor="true"]')
        || a.closest('[contenteditable="true"]')
        || a.closest('[role="textbox"]')
        || a.closest('.ProseMirror');
      if (editor) return editor;
    }

    // Fallback: Selection API (critical for Discord)
    const sel = window.getSelection();
    if (sel?.anchorNode) {
      const node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
      const editor = node.closest('[data-slate-editor="true"]')
        || node.closest('[contenteditable="true"]')
        || node.closest('[role="textbox"]')
        || node.closest('.ProseMirror');
      if (editor) return editor;
    }

    return null;
  }

  function getText(el) {
    if (!el) return '';
    try {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value;
      // Rich text: prefer innerText, fallback to textContent
      const txt = el.innerText || el.textContent || '';
      return txt.replace(/\u200B/g, ''); // Remove zero-width spaces
    } catch { return ''; }
  }

  // === HIGH FIDELITY TEXT REPLACEMENT ===
  function createKeyEvent(type, key, code, keyCode) {
    return new KeyboardEvent(type, {
      key, code, keyCode, which: keyCode,
      bubbles: true, cancelable: true, composed: true,
      ctrlKey: !IS_MAC, metaKey: IS_MAC, view: window
    });
  }

  async function replaceText(el, newText) {
    try {
      await navigator.clipboard.writeText(newText);
      el.focus();

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        // Standard inputs
        el.select();
        document.execCommand('insertText', false, newText);
      } else {
        // Rich text editors (Discord/Slate/ProseMirror)
        document.execCommand('selectAll', false, null);
        await new Promise(r => setTimeout(r, 5));

        // Ensure full selection
        const s = window.getSelection();
        if (s.toString().length < getText(el).length) {
          const range = document.createRange();
          range.selectNodeContents(el);
          s.removeAllRanges();
          s.addRange(range);
        }

        // Simulate Cmd/Ctrl+A
        el.dispatchEvent(createKeyEvent('keydown', 'a', 'KeyA', 65));
        await new Promise(r => setTimeout(r, 10));

        // Paste via ClipboardEvent
        const dt = new DataTransfer();
        dt.setData('text/plain', newText);
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true, cancelable: true, composed: true,
          clipboardData: dt, view: window
        });
        el.dispatchEvent(pasteEvent);

        // Fallback if paste wasn't consumed
        if (!pasteEvent.defaultPrevented) {
          document.execCommand('insertText', false, newText);
        }
      }

      // Notify UI
      await new Promise(r => setTimeout(r, 20));
      el.dispatchEvent(new InputEvent('input', {
        bubbles: true, inputType: 'insertText', data: newText, composed: true
      }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      console.warn('[ConFluent] Paste error:', err);
    }
  }

  // === TRANSLATION LOGIC ===
  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && e.key.length === 1) lastInputTime = Date.now();
    if (['Backspace', 'Delete'].includes(e.key)) {
      isDeleting = true;
      clearTimeout(typingTimer);
    }
  }, true);

  function translate(el, text, ignoreGuard = false) {
    if (isTranslating || !text || text.length < 2 || text === lastTranslated) return;
    if (!ignoreGuard && Date.now() - lastInputTime < 50) return;

    isTranslating = true;
    const gen = ++translationGeneration; // Stale guard
    updateBadgeUI('working');

    try {
      chrome.runtime.sendMessage(
        { action: 'translate', text, targetLang: settings.targetLang },
        async (res) => {
          try {
            // Discard stale results
            if (gen !== translationGeneration) return;

            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message.includes('context invalidated')) {
                destroy();
                return;
              }
              updateBadgeUI('error');
              setTimeout(() => updateBadgeUI('on'), 2000);
              return;
            }

            if (res?.translation && res.translation.toLowerCase() !== text.toLowerCase()) {
              if (ignoreGuard || (getText(el) === text && Date.now() - lastInputTime > 50)) {
                await replaceText(el, res.translation);
                originalText = res.translation;
                lastTranslated = res.translation;
                updateBadgeUI('done');
              } else {
                updateBadgeUI('on');
              }
            } else {
              updateBadgeUI('on');
            }
          } finally {
            isTranslating = false;
          }
        }
      );
    } catch {
      isTranslating = false;
      destroy();
    }
  }

  // === UNIFIED INPUT HANDLER ===
  function handleInput() {
    if (!isEnabled || isTranslating) return;
    lastInputTime = Date.now();
    const el = findActiveEditor();
    if (!el) return;
    const currentText = getText(el).trim();

    if (isDeleting) { isDeleting = false; originalText = currentText; return; }
    if (currentText.length < originalText.length) { originalText = currentText; clearTimeout(typingTimer); return; }
    if (currentText.length === 0) { originalText = ''; lastTranslated = ''; clearTimeout(typingTimer); return; }

    if (currentText !== lastTranslated && currentText.length >= 2) {
      updateBadgeUI('typing');
      clearTimeout(typingTimer);

      const mode = settings.triggerMode || 'timer';
      const lastChar = currentText.slice(-1);

      if (mode === 'pro') {
        if (['.', '!', '?', '\n'].includes(lastChar)) {
          translate(el, currentText, true);
        }
      } else if (mode === 'rapid') {
        const delay = [' ', '.', ',', '!', '?', '\n'].includes(lastChar) ? 50 : 1000;
        typingTimer = setTimeout(() => translate(el, currentText, delay === 50), delay);
      } else {
        // Timer mode (default)
        typingTimer = setTimeout(() => translate(el, currentText), settings.delay);
      }
    }
  }

  // Single unified listener (no duplicate keyup handler)
  document.addEventListener('input', handleInput, true);
  document.addEventListener('keyup', (e) => {
    // Only handle printable keys as fallback for editors that suppress 'input'
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    handleInput();
  }, true);

  // Track focus changes to reset originalText
  const resetOriginal = () => {
    setTimeout(() => {
      const el = findActiveEditor();
      if (el) originalText = getText(el);
    }, 100);
  };
  document.addEventListener('click', resetOriginal, true);
  document.addEventListener('focus', resetOriginal, true);

  // === CONVERSATION MODE ===
  function startConversationMode() {
    if (observer) observer.disconnect();

    if (DEBUG) console.log('🗣️ Conversation Mode ON: Reading in', settings.myLang);
    updateBadgeUI('on');

    let mutationQueue = [];
    let mutationTimer = null;

    observer = new MutationObserver(mutations => {
      if (!isEnabled || !settings.conversationMode) return;

      let hasNew = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            mutationQueue.push(n);
            hasNew = true;
          }
        }
      }
      if (!hasNew) return;

      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        const nodes = mutationQueue.splice(0);
        for (const node of nodes) walkAndQueue(node);
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Scan existing content immediately
    setTimeout(() => walkAndQueue(document.body), 100);
  }

  function stopConversationMode() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (DEBUG) console.log('🗣️ Conversation Mode OFF');
  }

  // === BATCH TRANSLATION ===
  const BATCH_DELIMITER = '\n\n====B====\n\n';

  function flushBatch() {
    if (batchQueue.length === 0) return;

    const batch = batchQueue.splice(0, MAX_BATCH_SIZE);
    const hugeText = batch.map(item => item.text).join(BATCH_DELIMITER);

    updateBadgeUI('working', 'Translating incoming...');

    chrome.runtime.sendMessage({
      action: 'translate',
      text: hugeText,
      targetLang: settings.myLang
    }, (res) => {
      updateBadgeUI('on');
      if (chrome.runtime.lastError || !res?.translation) return;

      const parts = res.translation.split(new RegExp(BATCH_DELIMITER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      batch.forEach((item, i) => {
        const translation = parts[i]?.trim();
        if (translation?.length > 0) {
          item.node.nodeValue = translation;
          translatedMap.set(item.node, translation);
        }
      });
    });
  }

  function queueNodeForTranslation(node, text) {
    batchQueue.push({ node, text });
    clearTimeout(batchTimer);

    if (batchQueue.length >= MAX_BATCH_SIZE) {
      flushBatch();
    } else {
      batchTimer = setTimeout(flushBatch, BATCH_DELAY);
    }
  }

  // === DOM WALKER (Optimized) ===
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SVG']);

  function walkAndQueue(rootNode) {
    if (!rootNode) return;

    const root = rootNode.nodeType === Node.ELEMENT_NODE ? rootNode : document.body;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
        if (parent.getAttribute?.('translate') === 'no' || parent.classList?.contains('notranslate')) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.nodeValue.trim();
        if (text.length < 3 || /^\d+$/.test(text)) return NodeFilter.FILTER_SKIP;
        if (translatedMap.has(node) || processedNodes.has(node)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    if (rootNode.nodeType === Node.TEXT_NODE) {
      if (rootNode.nodeValue.trim().length >= 3 && !processedNodes.has(rootNode)) {
        processedNodes.add(rootNode);
        queueNodeForTranslation(rootNode, rootNode.nodeValue.trim());
      }
    } else {
      let current;
      while ((current = walker.nextNode())) {
        processedNodes.add(current);
        queueNodeForTranslation(current, current.nodeValue.trim());
      }
    }
  }


  // === CLEANUP ===
  function destroy() {
    stopConversationMode();
    document.removeEventListener('input', handleInput, true);
    badge?.parentNode?.removeChild(badge);
    window.__confluentRunning = false;
  }

  // === CONFIG & MESSAGING ===
  function loadConfig() {
    try {
      chrome.storage.local.get(
        ['delay', 'targetLang', 'enabled', 'triggerMode', 'conversationMode', 'myLang', 'theme'],
        (c) => {
          if (chrome.runtime.lastError || !c) return;

          if (c.delay) settings.delay = parseInt(c.delay);
          if (c.targetLang) settings.targetLang = c.targetLang;
          if (c.triggerMode) settings.triggerMode = c.triggerMode;
          if (c.conversationMode !== undefined) settings.conversationMode = c.conversationMode;
          if (c.myLang) settings.myLang = c.myLang;
          if (c.theme) settings.theme = c.theme;
          if (c.enabled !== undefined) isEnabled = c.enabled;


          updateBadgeUI(isEnabled ? 'on' : 'off');
          updateTheme(settings.theme);

          if (isEnabled && settings.conversationMode) {
            startConversationMode();
          } else {
            stopConversationMode();
          }
        }
      );
    } catch { }
  }

  chrome.runtime.onMessage.addListener((m, _sender, sendResponse) => {
    switch (m.action) {
      case 'ping':
        sendResponse({ status: 'pong', enabled: isEnabled });
        return;

      case 'configChanged': {
        const c = m.config;
        if (c.delay) settings.delay = parseInt(c.delay);
        if (c.targetLang) settings.targetLang = c.targetLang;
        if (c.triggerMode) settings.triggerMode = c.triggerMode;
        if (c.conversationMode !== undefined) settings.conversationMode = c.conversationMode;
        if (c.myLang) settings.myLang = c.myLang;
        if (c.theme) settings.theme = c.theme;
        if (c.enabled !== undefined) isEnabled = c.enabled;


        updateBadgeUI(isEnabled ? 'on' : 'off');
        updateTheme(settings.theme);

        if (isEnabled && settings.conversationMode && !observer) {
          startConversationMode();
        } else if ((!isEnabled || !settings.conversationMode) && observer) {
          stopConversationMode();
        }
        return;
      }

      case 'statusChanged':
        isEnabled = m.enabled;
        updateBadgeUI(isEnabled ? 'on' : 'off');
        if (isEnabled && settings.conversationMode) startConversationMode();
        else stopConversationMode();
        return;

    }
  });

  // === SPA URL CHANGE DETECTION ===
  let lastUrl = location.href;

  function onUrlChange() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    // Reset translation state
    isTranslating = false;
    originalText = '';
    lastTranslated = '';
    clearTimeout(typingTimer);
    translationGeneration++;

    // Reinitialize conversation mode if active
    if (isEnabled && settings.conversationMode) {
      stopConversationMode();
      setTimeout(() => startConversationMode(), 300);
    }

    updateBadgeUI(isEnabled ? 'on' : 'off');
  }

  // Hook into History API (SPA navigation: Discord, Twitter, WhatsApp Web, etc.)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);
  window.addEventListener('hashchange', onUrlChange);

  // === INIT ===
  function init() {
    if (window.self !== window.top) return;

    // Remove any existing badge to prevent duplicates
    const existingBadge = document.getElementById('tr-badge');
    if (existingBadge) existingBadge.remove();

    if (document.getElementById('tr-styles')) return;
    (document.head || document.documentElement).appendChild(style);
    (document.body || document.documentElement).appendChild(badge);
    loadConfig();
    if (DEBUG) console.log('🌐 ConFluent v3.2 | Ready');
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

})();
