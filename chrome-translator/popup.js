// popup.js - Configuration v27.6 (Conversational Mode)

document.addEventListener('DOMContentLoaded', () => {
    const elEnabled = document.getElementById('enabled');
    const elTargetLang = document.getElementById('targetLang');
    const elTriggerMode = document.getElementById('triggerMode');
    const elDelay = document.getElementById('delay');
    const elDelayContainer = document.getElementById('delay-container');
    const elConversationMode = document.getElementById('conversationMode');
    const elMyLang = document.getElementById('myLang');
    const elMyLangContainer = document.getElementById('myLang-container');
    const elStatus = document.getElementById('status');
    const elConnectionDot = document.getElementById('connection-dot');

    // Helper: UI Visibility
    const updateUiState = () => {
        const mode = elTriggerMode.value;
        const conversation = elConversationMode.checked;

        // Hide Delay if not in Timer mode
        if (mode === 'timer') {
            elDelayContainer.style.display = 'flex';
            elDelayContainer.style.opacity = '1';
        } else {
            elDelayContainer.style.display = 'none';
            elDelayContainer.style.opacity = '0';
        }

        // Show My Lang if Conversation Mode is ON
        if (conversation) {
            elMyLangContainer.style.display = 'flex';
        } else {
            elMyLangContainer.style.display = 'none';
        }
    };

    // 1. Load Configuration
    chrome.storage.local.get(['enabled', 'targetLang', 'delay', 'triggerMode', 'conversationMode', 'myLang'], (c) => {
        if (c) {
            elEnabled.checked = c.enabled !== false;
            if (c.targetLang) elTargetLang.value = c.targetLang;
            if (c.delay) elDelay.value = c.delay;
            if (c.triggerMode) elTriggerMode.value = c.triggerMode;
            elConversationMode.checked = c.conversationMode === true;
            if (c.myLang) elMyLang.value = c.myLang;

            updateConnectionStatus(c.enabled !== false);
            updateUiState();
        }
    });

    // 2. Auto-Save Function
    const saveConfig = () => {
        const config = {
            enabled: elEnabled.checked,
            targetLang: elTargetLang.value,
            triggerMode: elTriggerMode.value,
            delay: parseInt(elDelay.value),
            conversationMode: elConversationMode.checked,
            myLang: elMyLang.value
        };

        updateConnectionStatus(config.enabled);
        updateUiState();

        chrome.storage.local.set(config, () => {
            elStatus.classList.add('show');
            setTimeout(() => { elStatus.classList.remove('show'); }, 1500);

            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'configChanged',
                        config: config
                    }).catch(() => { });
                });
            });
        });
    };

    // 3. Event Listeners
    elEnabled.addEventListener('change', saveConfig);
    elTargetLang.addEventListener('change', saveConfig);
    elTriggerMode.addEventListener('change', saveConfig);
    elDelay.addEventListener('change', saveConfig);
    elConversationMode.addEventListener('change', saveConfig);
    elMyLang.addEventListener('change', saveConfig);

    function updateConnectionStatus(isEnabled) {
        if (isEnabled) elConnectionDot.classList.add('active');
        else elConnectionDot.classList.remove('active');
    }

    // 4. Translate Page Action
    const elTranslatePage = document.getElementById('translatePage');
    if (elTranslatePage) {
        elTranslatePage.addEventListener('click', () => {
            // Visual Feedback
            elStatus.textContent = 'Started...';
            elStatus.classList.add('show');
            setTimeout(() => { elStatus.classList.remove('show'); elStatus.textContent = 'Saved'; }, 2000);

            // Send Command
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'translatePage',
                        targetLang: elMyLang.value // Reading Language
                    }).catch(() => { });
                }
            });
        });
    }
});
