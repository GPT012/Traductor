// popup.js - Configuration v28.0 (White Orb Design)
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
    const elLogoContainer = document.getElementById('logo-container');
    const elThemeToggle = document.getElementById('theme-toggle');

    // Helper: UI Visibility
    const updateUiState = () => {
        const mode = elTriggerMode.value;
        const conversation = elConversationMode.checked;

        // Hide Delay if not in Timer mode
        if (mode === 'timer') {
            elDelayContainer.style.display = 'flex';
            // elDelayContainer.style.opacity = '1'; // handled by CSS/browser render
        } else {
            elDelayContainer.style.display = 'none';
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

            if (c.theme === 'dark') {
                document.body.classList.add('dark-mode');
                updateThemeIcon(true);
            }

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
            conversationMode: elConversationMode.checked,
            myLang: elMyLang.value,
            theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
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
    elConversationMode.addEventListener('change', saveConfig);
    elMyLang.addEventListener('change', saveConfig);

    // Theme Toggle
    if (elThemeToggle) {
        elThemeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            updateThemeIcon(isDark);
            saveConfig();
        });
    }

    function updateThemeIcon(isDark) {
        if (!elThemeToggle) return;
        if (isDark) {
            // Show Sun (to switch to light)
            elThemeToggle.innerHTML = `<svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            elThemeToggle.setAttribute('aria-label', 'Switch to Light Mode');
        } else {
            // Show Moon (to switch to dark)
            elThemeToggle.innerHTML = `<svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            elThemeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
        }
    }

    function updateConnectionStatus(isEnabled) {
        if (isEnabled) {
            elConnectionDot.classList.add('active');
            if (elLogoContainer) elLogoContainer.classList.add('active');
        } else {
            elConnectionDot.classList.remove('active');
            if (elLogoContainer) elLogoContainer.classList.remove('active');
        }
    }

});
