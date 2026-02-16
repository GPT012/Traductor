// Background Service Worker - ConFluent v3.0 (Optimized)
// Google Translate FREE + Translation Cache + Self-Healing

'use strict';

const DEFAULT_CONFIG = {
    targetLang: 'en',
    sourceLang: 'auto',
    enabled: true
};

// === TRANSLATION CACHE (LRU) ===
const CACHE_MAX_SIZE = 200;
const translationCache = new Map(); // key: `${sl}:${tl}:${text}` → translation

function getCacheKey(text, targetLang, sourceLang) {
    return `${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;
}

function getCached(text, targetLang, sourceLang) {
    const key = getCacheKey(text, targetLang, sourceLang);
    if (translationCache.has(key)) {
        const value = translationCache.get(key);
        // Move to end (most recently used)
        translationCache.delete(key);
        translationCache.set(key, value);
        return value;
    }
    return null;
}

function setCache(text, targetLang, sourceLang, translation) {
    const key = getCacheKey(text, targetLang, sourceLang);
    // Evict oldest if full
    if (translationCache.size >= CACHE_MAX_SIZE) {
        const oldest = translationCache.keys().next().value;
        translationCache.delete(oldest);
    }
    translationCache.set(key, translation);
}

// === REQUEST DEDUPLICATION ===
const pendingRequests = new Map(); // key → Promise

// === CONFIG ===
async function getConfig() {
    const result = await chrome.storage.local.get(['targetLang', 'sourceLang', 'enabled']);
    return { ...DEFAULT_CONFIG, ...result };
}

async function saveConfig(config) {
    await chrome.storage.local.set(config);
}

// === TRANSLATION (with cache + dedup) ===
async function translateText(text, targetLang = 'en', sourceLang = 'auto') {
    if (!text || text.trim().length === 0) return { error: 'Empty text' };

    const trimmed = text.trim();

    // 1. Check cache
    const cached = getCached(trimmed, targetLang, sourceLang);
    if (cached) return { translation: cached };

    // 2. Check for pending identical request (dedup)
    const dedupeKey = getCacheKey(trimmed, targetLang, sourceLang);
    if (pendingRequests.has(dedupeKey)) {
        return pendingRequests.get(dedupeKey);
    }

    // 3. Make API call
    const requestPromise = (async () => {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            let translation = '';
            if (data?.[0]) {
                for (const part of data[0]) {
                    if (part?.[0]) translation += part[0];
                }
            }

            const result = translation.trim();
            if (result.length > 0) {
                setCache(trimmed, targetLang, sourceLang, result);
                return { translation: result };
            }
            return { error: 'No translation received' };
        } catch (error) {
            return { error: error.message };
        } finally {
            pendingRequests.delete(dedupeKey);
        }
    })();

    pendingRequests.set(dedupeKey, requestPromise);
    return requestPromise;
}

// === MESSAGE ROUTING ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getStatus':
            getConfig().then(config =>
                sendResponse({ enabled: config.enabled, targetLang: config.targetLang })
            );
            return true;

        case 'toggle':
            saveConfig({ enabled: request.enabled }).then(() => {
                chrome.tabs.query({}, tabs => {
                    for (const tab of tabs) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'statusChanged',
                            enabled: request.enabled
                        }).catch(() => { });
                    }
                });
                sendResponse({ enabled: request.enabled });
            });
            return true;

        case 'setTargetLang':
            saveConfig({ targetLang: request.lang }).then(() =>
                sendResponse({ targetLang: request.lang })
            );
            return true;

        case 'translate':
            getConfig().then(config => {
                const target = request.targetLang || config.targetLang;
                translateText(request.text, target, config.sourceLang)
                    .then(result => sendResponse(result));
            });
            return true;

        case 'getConfig':
            getConfig().then(config => sendResponse(config));
            return true;

        default:
            return false;
    }
});

// === SELF-HEALING: Inject on install/update ===
chrome.runtime.onInstalled.addListener(async () => {
    console.log('[ConFluent] 🔄 Install/Update — Injecting into open tabs...');
    const manifest = chrome.runtime.getManifest();
    for (const cs of manifest.content_scripts) {
        const tabs = await chrome.tabs.query({ url: cs.matches });
        for (const tab of tabs) {
            if (/^(chrome|edge|about):/.test(tab.url)) continue;
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: cs.all_frames },
                    files: cs.js
                });
            } catch (_) { }
        }
    }
});

// === SELF-HEALING: Re-inject on tab activation ===
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url?.startsWith('http')) return;

        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch {
            console.log('[ConFluent] 🚑 Tab missing script, injecting...', tab.url);
            try {
                await chrome.scripting.executeScript({
                    target: { tabId, allFrames: true },
                    files: ['content.js']
                });
            } catch (_) { }
        }
    } catch (_) { }
});

console.log('[ConFluent] ✅ Service Worker v3.0 (Cache + Dedup)');
