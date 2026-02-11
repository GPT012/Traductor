// Popup Controller — ConFluent v3.0 (Optimized)
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // === DOM REFERENCES ===
    const $ = (id) => document.getElementById(id);
    const elEnabled = $('enabled');
    const elTargetLang = $('targetLang');
    const elDelay = $('delay');
    const elTriggerMode = $('triggerMode');
    const elConversationMode = $('conversationMode');
    const elMyLang = $('myLang');
    const elThemeToggle = $('theme-toggle');
    const elStatus = $('status');
    const elConversationContainer = $('conversationSettings');
    const elDelayContainer = $('delayContainer');

    // === DEBOUNCED SAVE ===
    let saveTimer = null;
    const SAVE_DEBOUNCE = 300;

    function showToast(text = '✓ Saved') {
        if (!elStatus) return;
        elStatus.textContent = text;
        elStatus.classList.add('show');
        setTimeout(() => elStatus.classList.remove('show'), 1500);
    }

    // === LOAD CONFIG ===
    chrome.storage.local.get(
        ['enabled', 'targetLang', 'delay', 'triggerMode', 'conversationMode', 'myLang', 'theme'],
        (c) => {
            if (chrome.runtime.lastError || !c) return;

            elEnabled.checked = c.enabled !== false;
            if (c.targetLang) elTargetLang.value = c.targetLang;
            if (c.delay) elDelay.value = c.delay;
            if (c.triggerMode) elTriggerMode.value = c.triggerMode;
            if (c.conversationMode) elConversationMode.checked = true;
            if (c.myLang) elMyLang.value = c.myLang;
            if (c.theme === 'dark') document.body.classList.add('dark-mode');

            updateVisibility();
        }
    );

    // === SAVE CONFIG (debounced) ===
    function saveConfig() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const config = {
                enabled: elEnabled.checked,
                targetLang: elTargetLang.value,
                triggerMode: elTriggerMode.value,
                delay: parseInt(elDelay.value),
                conversationMode: elConversationMode.checked,
                myLang: elMyLang.value,
                theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
            };

            chrome.storage.local.set(config);

            // Broadcast to all tabs
            chrome.tabs.query({}, (tabs) => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'configChanged',
                        config
                    }).catch(() => { });
                }
            });

            showToast();
        }, SAVE_DEBOUNCE);
    }

    // === VISIBILITY LOGIC ===
    function updateVisibility() {
        if (elConversationContainer) {
            elConversationContainer.style.display = elConversationMode.checked ? 'flex' : 'none';
        }
        if (elDelayContainer) {
            elDelayContainer.style.display = elTriggerMode.value === 'timer' ? 'flex' : 'none';
        }
    }

    // === EVENT LISTENERS ===
    const inputs = [elEnabled, elTargetLang, elTriggerMode, elDelay, elConversationMode, elMyLang];
    for (const input of inputs) {
        if (input) input.addEventListener('change', saveConfig);
    }

    // Conversation mode and trigger mode also update visibility
    elConversationMode?.addEventListener('change', updateVisibility);
    elTriggerMode?.addEventListener('change', updateVisibility);

    // === THEME TOGGLE ===
    elThemeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        saveConfig();
    });
});
