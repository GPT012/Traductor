// Background Service Worker - Auto Translator v27.3 (Self-Healing)
// Google Translate GRATUIT + Injection Robuste

const DEFAULT_CONFIG = {
    targetLang: 'en',
    sourceLang: 'auto',
    enabled: true
};

async function getConfig() {
    const result = await chrome.storage.local.get(['targetLang', 'sourceLang', 'enabled']);
    return { ...DEFAULT_CONFIG, ...result };
}

async function saveConfig(config) {
    await chrome.storage.local.set(config);
}

// Traduction gratuite via Google Translate API publique
async function translateText(text, targetLang = 'en', sourceLang = 'auto') {
    if (!text || text.trim().length === 0) return { error: "Texte vide" };

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        let translation = '';
        if (data && data[0]) {
            for (const part of data[0]) {
                if (part && part[0]) translation += part[0];
            }
        }

        if (translation && translation.trim().length > 0) {
            return { translation: translation.trim() };
        } else {
            return { error: "Pas de traduction reçue" };
        }

    } catch (error) {
        return { error: error.message };
    }
}

// Écouter les messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStatus') {
        getConfig().then(config => sendResponse({ enabled: config.enabled, targetLang: config.targetLang }));
        return true;
    }

    if (request.action === 'toggle') {
        saveConfig({ enabled: request.enabled }).then(() => {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'statusChanged', enabled: request.enabled }).catch(() => { });
                });
            });
            sendResponse({ enabled: request.enabled });
        });
        return true;
    }

    if (request.action === 'setTargetLang') {
        saveConfig({ targetLang: request.lang }).then(() => sendResponse({ targetLang: request.lang }));
        return true;
    }

    if (request.action === 'translate') {
        getConfig().then(config => {
            // Use request.targetLang if provided (e.g. for Conversation Mode), else config default
            const target = request.targetLang || config.targetLang;
            translateText(request.text, target, config.sourceLang).then(result => sendResponse(result));
        });
        return true;
    }

    if (request.action === 'getConfig') {
        getConfig().then(config => sendResponse(config));
        return true;
    }
});

// SELF-HEALING: Injecter sur onInstalled
chrome.runtime.onInstalled.addListener(async () => {
    console.log('[Translator] 🔄 Installation/Mise à jour - Injection massive...');
    for (const cs of chrome.runtime.getManifest().content_scripts) {
        for (const tab of await chrome.tabs.query({ url: cs.matches })) {
            try {
                if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) continue;
                await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: cs.all_frames }, files: cs.js });
            } catch (err) { }
        }
    }
});

// SELF-HEALING: Vérifier et Injecter sur changement d'onglet (Demandé par l'utilisateur)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tabId = activeInfo.tabId;
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url || !tab.url.startsWith('http')) return;

        // Ping le content script
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            // Si pas d'erreur, le script est là, tout va bien.
        } catch (e) {
            // Si erreur (ex: "Could not establish connection"), le script est absent.
            console.log('[Translator] 🚑 Onglet actif sans script. Injection d\'urgence...', tab.url);
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId, allFrames: true },
                    files: ['content.js']
                });
            } catch (injectionErr) {
                console.warn('[Translator] Échec auto-healing:', injectionErr.message);
            }
        }
    } catch (e) { }
});

console.log('[Translator] ✅ Service Worker v27.3 démarré (Self-Healing Active)');
