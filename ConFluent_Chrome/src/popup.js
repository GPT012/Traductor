// Popup Controller — ConFluent v3.2
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // === DOM REFERENCES ===
    const $ = (id) => document.getElementById(id);
    const elEnabled = $('enabled');
    const elTargetLang = $('targetLang');
    const elDelay = $('delay');
    const elTriggerMode = $('triggerMode');
    const elConversationMode = $('conversationMode');
    const elFlagSelector = $('flagSelector');
    const elThemeToggle = $('theme-toggle');
    const elStatus = $('status');
    const elDelayContainer = $('delay-container');
    const elProfileBar = $('profile-bar');
    const elUserName = $('user-name');
    const elUserAvatar = $('user-avatar');
    const elLogoutBtn = $('logout-btn');
    const flagBtns = document.querySelectorAll('.flag-btn');

    // Current myLang value
    let currentMyLang = 'fr';

    // === DEBOUNCED SAVE ===
    let saveTimer = null;
    const SAVE_DEBOUNCE = 300;

    function showToast(text = '✓ Saved') {
        if (!elStatus) return;
        elStatus.textContent = text;
        elStatus.classList.add('show');
        setTimeout(() => elStatus.classList.remove('show'), 1500);
    }

    // === FLAG SELECTION ===
    function selectFlag(lang) {
        currentMyLang = lang;
        flagBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    // === LOAD CONFIG ===
    chrome.storage.local.get(
        ['enabled', 'targetLang', 'delay', 'triggerMode', 'conversationMode', 'myLang', 'theme', 'user'],
        (c) => {
            if (chrome.runtime.lastError || !c) return;

            elEnabled.checked = c.enabled !== false;
            if (c.targetLang) elTargetLang.value = c.targetLang;
            if (c.delay) elDelay.value = c.delay;
            if (c.triggerMode) elTriggerMode.value = c.triggerMode;
            if (c.conversationMode) elConversationMode.checked = true;
            if (c.myLang) currentMyLang = c.myLang;
            if (c.theme === 'dark') document.body.classList.add('dark-mode');

            selectFlag(currentMyLang);
            updateVisibility();

            // Show profile if logged in (no redirect if not)
            if (c.user) {
                showProfile(c.user);
            }
        }
    );

    // === PROFILE DISPLAY ===
    function showProfile(user) {
        if (elProfileBar && user) {
            elProfileBar.style.display = 'flex';
            elUserName.textContent = user.name || user.email || 'User';
            elUserAvatar.src = user.picture || '';
        }
    }

    // === LOGOUT ===
    function logout() {
        chrome.storage.local.remove('user', () => {
            elProfileBar.style.display = 'none';
            showToast('Signed out');
        });
    }

    // === SYNC TO SUPABASE ===
    async function syncToSupabase(settings) {
        chrome.storage.local.get(['user'], async (res) => {
            if (res.user && res.user.email) {
                try {
                    await fetch('https://iisjgbmhlgpnzqoaevml.supabase.co/rest/v1/profiles?email=eq.' + res.user.email, {
                        method: 'PATCH',
                        headers: {
                            'apikey': 'sb_publishable_IHrNdjkpayFqGnp_5jGw6g_MLenBeW9',
                            'Authorization': 'Bearer sb_publishable_IHrNdjkpayFqGnp_5jGw6g_MLenBeW9',
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            settings: settings,
                            updated_at: new Date().toISOString()
                        })
                    });
                } catch (e) {
                    console.error('Remote sync failed:', e);
                }
            }
        });
    }

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
                myLang: currentMyLang,
                theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
            };

            chrome.storage.local.set(config);
            syncToSupabase(config); // Push to Supabase

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
        if (elFlagSelector) {
            elFlagSelector.style.display = elConversationMode.checked ? 'flex' : 'none';
        }
        if (elDelayContainer) {
            elDelayContainer.style.display = elTriggerMode.value === 'timer' ? 'flex' : 'none';
        }
    }

    // === EVENT LISTENERS ===
    const inputs = [elEnabled, elTargetLang, elTriggerMode, elDelay, elConversationMode];
    for (const input of inputs) {
        if (input) input.addEventListener('change', saveConfig);
    }

    // Flag button clicks
    flagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectFlag(btn.dataset.lang);
            saveConfig();
        });
    });

    // Conversation mode and trigger mode also update visibility
    elConversationMode?.addEventListener('change', updateVisibility);
    elTriggerMode?.addEventListener('change', updateVisibility);

    // === THEME TOGGLE ===
    elThemeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        saveConfig();
    });

    // === LOGOUT ===
    elLogoutBtn?.addEventListener('click', logout);
});
