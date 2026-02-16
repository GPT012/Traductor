// ===================================
// AUTO TRANSLATOR v28.0 - PERFORMANCE + BATCHING
// Universal Support: Ctrl+A+Ctrl+V + Generic Detection
// + Configurable Delay & Language
// + Premium Minimalist Design
// + Anti-Zombie & High Fidelity Events
// + Self-Healing on Tab Switch
// + Rapid (Instant) & Pro (Sentence) Modes
// + Conversation Mode (Incoming Translation)
// + BATCH TRANSLATION ENGINE (Performance Fix)
// ===================================

(function () {
  'use strict';

  // === PREVENTION DOUBLONS ===
  if (window.hasAutoTranslatorRunning) return;
  window.hasAutoTranslatorRunning = true;

  console.log('%c🌐 Translator v28.0 (Optimized)', 'background: #000; color: white; padding: 6px 12px; border-radius: 999px;');

  // === STATE ===
  let isEnabled = true;
  let typingTimer = null;
  let originalText = '';
  let lastTranslated = '';
  let isTranslating = false;
  let isDeleting = false;
  let lastInputTime = 0;

  // Optimized Translation State
  let observer = null;
  let processedNodes = new WeakSet(); // Kept for individual nodes if needed
  let translatedMap = new WeakMap(); // Map<Node, string> - stores original text to avoid re-translation loop

  // Batching State
  let batchQueue = []; // Array<{node: Node, text: string}>
  let batchTimer = null;
  const BATCH_DELAY = 100;
  const MAX_BATCH_SIZE = 50;

  // Default Config
  let settings = {
    delay: 1000,
    targetLang: 'en',
    triggerMode: 'timer',
    conversationMode: false,
    myLang: 'fr'
  };

  // === CSS (ULTRA-PREMIUM CERAMIC/GLASS ORB) ===
  const style = document.createElement('style');
  style.id = 'tr-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

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
      
      /* HYPER-REALISTIC MATERIAL: White Matte Ceramic / Frosted Glass */
      background: radial-gradient(120% 120% at 30% 30%, #ffffff 0%, #f8fafc 40%, #e2e8f0 100%) !important;
      
      /* COMPLEX LIGHTING & SHADOWS */
      /* 1. Top-left highlight (Specularity) */
      /* 2. Soft form shadow (Volume) */
      /* 3. Bounce light from bottom (Environment) */
      /* 4. Drop shadow (Distance from page) */
      box-shadow: 
        inset 2px 2px 5px rgba(255, 255, 255, 1),      /* Highlight top-left */
        inset -5px -5px 15px rgba(148, 163, 184, 0.3), /* Deep shadow bottom-right */
        0 15px 35px -10px rgba(15, 23, 42, 0.2),       /* Main drop shadow */
        0 5px 15px -5px rgba(15, 23, 42, 0.1) !important;
      
      border: 1px solid rgba(255, 255, 255, 0.4) !important; /* Subtle rim */
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

    /* INFINITY ICON (Deep Etched Engraving) */
    #tr-icon {
      width: 26px !important;
      height: 26px !important;
      color: #94a3b8 !important; /* Neutral grey base */
      
      /* ENGRAVED EFFECT */
      /* Inner shadow to look pressed in */
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.8)) drop-shadow(0 -1px 0 rgba(0,0,0,0.15)) !important;
      
      transition: color 0.4s ease, filter 0.4s ease, transform 0.4s ease !important;
      opacity: 0.8 !important;
    }

    /* STATES */
    
    /* 1. ACTIVE (Green Glow) */
    #tr-badge.state-on {
       /* Subtle green ambient light */
       box-shadow: 
        inset 2px 2px 5px rgba(255, 255, 255, 1),
        inset -5px -5px 15px rgba(148, 163, 184, 0.2),
        0 15px 35px -10px rgba(16, 185, 129, 0.3), /* Colored shadow */
        0 5px 15px -5px rgba(16, 185, 129, 0.2) !important;
    }
    #tr-badge.state-on #tr-icon { 
      color: #10b981 !important; 
      /* Inner glow for the icon */
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)) !important;
      opacity: 1 !important;
    }

    /* 2. INACTIVE (Red/Grey Dimmed) */
    #tr-badge.state-off {
      background: radial-gradient(120% 120% at 30% 30%, #f1f5f9 0%, #e2e8f0 100%) !important;
      box-shadow: 
        inset 1px 1px 3px rgba(255, 255, 255, 0.8),
        inset -2px -2px 8px rgba(148, 163, 184, 0.2),
        0 10px 25px -8px rgba(15, 23, 42, 0.15) !important;
    }
    #tr-badge.state-off #tr-icon { 
      color: #ef4444 !important; /* Red but muted */
      opacity: 0.5 !important; 
      filter: grayscale(0.5) !important;
    }

    /* 3. WORKING (Violet Magical Pulse) */
    #tr-badge.state-working {
      animation: tr-pulse-violet 2.5s infinite ease-in-out !important;
      background: radial-gradient(120% 120% at 30% 30%, #ffffff 0%, #fdf4ff 40%, #f3e8ff 100%) !important;
    }
    #tr-badge.state-working #tr-icon { 
      color: #8b5cf6 !important; 
      filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.6)) !important; /* Strong glow */
      opacity: 1 !important;
    }

    /* 4. ERROR (Orange Alert) */
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
  `;

  // === BADGE ===
  const oldBadge = document.getElementById('tr-badge');
  if (oldBadge) oldBadge.remove();

  const badge = document.createElement('div');
  badge.id = 'tr-badge';
  // SVG Infinity Symbol
  badge.innerHTML = `
    <svg id="tr-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 7.5C15.8807 7.5 17 8.61929 17 10C17 11.3807 15.8807 12.5 14.5 12.5C13.1193 12.5 12 11.3807 12 10C12 8.61929 13.1193 7.5 14.5 7.5ZM9.5 7.5C10.8807 7.5 12 8.61929 12 10C12 11.3807 10.8807 12.5 9.5 12.5C8.11929 12.5 7 11.3807 7 10C7 8.61929 8.11929 7.5 9.5 7.5ZM14.5 5.5C12.756 5.5 11.129 6.275 10 7.545C8.871 6.275 7.244 5.5 5.5 5.5C2.462 5.5 0 7.962 0 11C0 14.038 2.462 16.5 5.5 16.5C7.244 16.5 8.871 15.725 10 14.455C11.129 15.725 12.756 16.5 14.5 16.5C17.538 16.5 20 14.038 20 11C20 7.962 17.538 5.5 14.5 5.5Z" />
    </svg>
  `;

  function updateBadgeUI(state, text) {
    if (!badge || !badge.isConnected) return;
    badge.classList.remove('state-on', 'state-off', 'state-typing', 'state-working', 'state-waiting', 'state-done', 'state-error');

    // Normalization of states to colors
    // typing/working/waiting -> Violet (working)
    if (['typing', 'working', 'waiting'].includes(state)) {
      badge.classList.add('state-working');
      badge.title = text || 'Translating...';
    }
    else if (state === 'done') {
      badge.classList.add('state-on'); // Back to Green on done
      badge.title = 'Ready';
    }
    else {
      badge.classList.add(`state-${state}`);
      badge.title = state === 'on' ? 'Ready' : 'Disabled';
    }
  }

  function toggle() {
    isEnabled = !isEnabled;
    updateBadgeUI(isEnabled ? 'on' : 'off');
    chrome.storage.local.set({ enabled: isEnabled });
  }

  badge.onclick = (e) => { if (e.detail === 1) toggle(); };
  badge.ondblclick = (e) => { e.preventDefault(); };

  function find() {
    // 1. Try Active Element first
    let a = document.activeElement;
    if (a) {
      if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') return a;
      // Check for editor wrappers
      let editor = a.closest('[data-slate-editor="true"]')
        || a.closest('[contenteditable="true"]')
        || a.closest('[role="textbox"]')
        || a.closest('.ProseMirror');
      if (editor) return editor;
    }

    // 2. Try Selection API (Critical for Discord where activeElement might be body or wrapper)
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
      let editor = node.closest('[data-slate-editor="true"]')
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

      // DISCORD / SLATE / RICH TEXT
      // Try innerText first (visual text)
      let txt = el.innerText;

      // Fallback: If innerText is empty or fails, try textContent
      if (!txt || txt.trim() === '') {
        txt = el.textContent;
      }

      // Cleanup ZWSP and trim
      return (txt || '').replace(/\u200B/g, '');
    } catch (e) { return ''; }
  }

  // === HIGH FIDELITY SIMULATION ===
  const isMac = navigator.userAgent.indexOf('Mac') !== -1;

  function createKeyEvent(type, key, code, keyCode) {
    return new KeyboardEvent(type, {
      key: key,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
      ctrlKey: !isMac,
      metaKey: isMac,
      view: window
    });
  }

  async function autoCtrlACtrlV(el, newText) {
    try {
      await navigator.clipboard.writeText(newText);
      el.focus();

      // STANDARD INPUTS
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        try { el.select(); } catch (e) { }
        document.execCommand('selectAll', false, null); // Backup
        document.execCommand('insertText', false, newText); // Try standard execCommand first
      }
      else {
        // RICH TEXT (DISCORD/SLATE)
        // Ensure we really have focus on the editor logic
        const sel = window.getSelection();
        if (!sel.rangeCount) el.focus();

        // 1. Select All (Aggressive Strategy)
        // Try native command first (works best on ContentEditable)
        document.execCommand('selectAll', false, null);

        // Short pause for editor to react
        await new Promise(r => setTimeout(r, 10));

        // Backup: Manual Range Selection if execCommand didn't work well
        try {
          const s = window.getSelection();
          if (s.toString().length < getText(el).length) {
            const r = document.createRange();
            r.selectNodeContents(el);
            s.removeAllRanges();
            s.addRange(r);
          }
        } catch (e) { }

        // Backup 2: Simulations (Cmd+A / Ctrl+A)
        el.dispatchEvent(createKeyEvent('keydown', 'a', 'KeyA', 65));

        await new Promise(r => setTimeout(r, 20)); // Wait for selection to settle

        // 3. Paste via Clipboard Event
        const dt = new DataTransfer();
        dt.setData('text/plain', newText);
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true, cancelable: true, composed: true, clipboardData: dt, view: window
        });
        el.dispatchEvent(pasteEvent);

        // 4. Force Update if necessary
        // If paste wasn't prevented, we might need manual insertion
        if (!pasteEvent.defaultPrevented) {
          document.execCommand('insertText', false, newText);
        }
      }

      // Verification & Cleanup
      await new Promise(r => setTimeout(r, 50));

      // Dispatch final input event to ensure UI updates
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: newText, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

    } catch (err) { console.error('AutoPaste Warning:', err); }
  }

  // === TRANSLATION LOGIC (INPUT) ===
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
        const lastChar = currentText.slice(-1);
        if (['.', '!', '?', '\n'].includes(lastChar)) {
          updateBadgeUI('waiting');
          translate(el, currentText, true);
        }
      }
      else if (mode === 'rapid') {
        const lastChar = currentText.slice(-1);
        if ([' ', '.', ',', '!', '?', '\n'].includes(lastChar)) {
          typingTimer = setTimeout(() => {
            updateBadgeUI('waiting');
            translate(el, currentText, true);
          }, 50);
        } else {
          typingTimer = setTimeout(() => {
            updateBadgeUI('waiting');
            translate(el, currentText);
          }, 1000);
        }
      }
      else {
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
    updateBadgeUI('on');

    let mutationQueue = [];
    let mutationTimer = null;

    // Debounced Mutation Observer
    observer = new MutationObserver(mutations => {
      if (!isEnabled || !settings.conversationMode) return;
      // ... (existing mutation logic)
      let hasUpdate = false;
      mutations.forEach(m => {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => mutationQueue.push(n));
          hasUpdate = true;
        }
      });
      if (!hasUpdate) return;

      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        if (mutationQueue.length > 0) {
          const nodesToProcess = [...mutationQueue];
          mutationQueue = [];
          nodesToProcess.forEach(node => walkAndQueue(node));
        }
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // === NEW: INSTANT SCAN OF EXISTING CONTENT ===
    // This allows translating the conversation history immediately without refresh
    console.log('🗣️ Conversation Mode: Scanning existing content...');
    setTimeout(() => {
      walkAndQueue(document.body);
    }, 100);
  }

  function stopConversationMode() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    processedNodes = new WeakSet();
    console.log('🗣️ Conversation Mode STOPPED');
  }

  function flushBatch() {
    if (batchQueue.length === 0) return;

    const currentBatch = batchQueue.splice(0, MAX_BATCH_SIZE);
    const texts = currentBatch.map(item => item.text);
    const hugeText = texts.join('\n\n====B====\n\n'); // Unique delimiter

    updateBadgeUI('working', 'Translating incoming...');

    chrome.runtime.sendMessage({
      action: 'translate',
      text: hugeText,
      targetLang: settings.myLang
    }, (res) => {
      updateBadgeUI('on');

      if (chrome.runtime.lastError) return;

      if (res && res.translation) {
        const translatedParts = res.translation.split(/\n\n====B====\n\n/);

        currentBatch.forEach((item, index) => {
          if (translatedParts[index]) {
            const translation = translatedParts[index].trim();
            // Minimal check to avoid bad replacements
            if (translation && translation.length > 0) {
              item.node.nodeValue = translation;
              translatedMap.set(item.node, translation);
            }
          }
        });
      }
    });
  }

  function queueNodeForTranslation(node, text) {
    batchQueue.push({ node, text });

    if (batchTimer) clearTimeout(batchTimer);

    if (batchQueue.length >= MAX_BATCH_SIZE) {
      flushBatch();
    } else {
      batchTimer = setTimeout(flushBatch, BATCH_DELAY);
    }
  }

  function walkAndQueue(rootNode) {
    if (!rootNode) return;

    const treeWalker = document.createTreeWalker(
      rootNode.nodeType === Node.ELEMENT_NODE ? rootNode : document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          // Ignore script, style, etc.
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tag = parent.tagName.toUpperCase();
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          if (parent.getAttribute && (parent.getAttribute('translate') === 'no' || parent.classList.contains('notranslate'))) {
            return NodeFilter.FILTER_REJECT;
          }

          // Content checks
          const text = node.nodeValue.trim();
          if (text.length < 3 || text.match(/^\d+$/)) return NodeFilter.FILTER_SKIP; // Ignore numbers/short

          if (translatedMap.has(node)) return NodeFilter.FILTER_REJECT;
          if (processedNodes.has(node)) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    if (rootNode.nodeType === Node.TEXT_NODE) {
      // Manual check for single text node
      if (rootNode.nodeValue.trim().length >= 3 && !processedNodes.has(rootNode)) {
        processedNodes.add(rootNode);
        queueNodeForTranslation(rootNode, rootNode.nodeValue.trim());
      }
    } else {
      while (currentNode = treeWalker.nextNode()) {
        processedNodes.add(currentNode);
        queueNodeForTranslation(currentNode, currentNode.nodeValue.trim());
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
  document.addEventListener('keyup', (e) => {
    // Fallback for complex editors that might suppress 'input' events (like Discord sometimes)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) return;
    handleInput(e);
  }, true);
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
      if (m.config.delay) settings.delay = parseInt(m.config.delay);
      if (m.config.targetLang) settings.targetLang = m.config.targetLang;
      if (m.config.triggerMode) settings.triggerMode = m.config.triggerMode;
      if (m.config.conversationMode !== undefined) settings.conversationMode = m.config.conversationMode;
      if (m.config.myLang) settings.myLang = m.config.myLang;
      if (m.config.enabled !== undefined) isEnabled = m.config.enabled;

      updateBadgeUI(isEnabled ? 'on' : 'off');

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

    if (m.action === 'statusChanged') {
      isEnabled = m.enabled;
      updateBadgeUI(isEnabled ? 'on' : 'off');
      if (isEnabled && settings.conversationMode) startConversationMode();
      else stopConversationMode();
    }
  });

  // === INIT ===
  function init() {
    if (document.getElementById('tr-styles')) return;
    (document.head || document.documentElement).appendChild(style);
    (document.body || document.documentElement).appendChild(badge);
    loadConfig();
    console.log('🌐 v28.0 | Optimized Batch Engine Ready');
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  setTimeout(init, 500);

})();
