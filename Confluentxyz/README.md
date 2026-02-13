# 🌐 ConFluent — Native Translation for the Global Web

Chrome extension that automatically translates what you type on any web page — **100% FREE** via Google Translate.

## ✨ Features

- **Auto-translation**: Type in your language → translated after a short pause
- **Universal detection**: Works on `<input>`, `<textarea>`, and `contentEditable` (Discord, Slack, etc.)
- **3 trigger modes**: Standard (Timer), ⚡ Rapid (Instant), 📧 Pro (Sentence End)
- **Conversation Mode**: Translates incoming messages in real-time (MutationObserver + batching)
- **10 languages**: English, French, Spanish, German, Italian, Portuguese, Russian, Japanese, Chinese, Arabic
- **Visual indicator**: Floating "orb" badge with color states (Green/Red/Violet/Orange)
- **Dark Mode**: Full dark theme support for popup and badge
- **Self-Healing**: Auto-injects content script on tab switch and extension update

## 🚀 Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `Confluentxyz` folder (or `dist` for the packaged version)

## 📝 Usage

1. Make sure the extension is ON (orb badge is green)
2. Type text in any input field on any website
3. Wait for the trigger (timer, space, or sentence end depending on mode)
4. Text is automatically translated!

## 📁 Structure

```
Confluentxyz/
├── manifest.json      # Manifest V3 configuration
├── background.js      # Service Worker (Google Translate API + Self-Healing)
├── content.js         # Injected script (input detection, DOM manipulation, badge, conversation mode)
├── popup.html         # Popup UI
├── popup.js           # Popup logic (config load/save, theme toggle)
├── popup.css          # Ceramic/Glass Orb design system
├── icons/             # Extension icons (16, 48, 128px)
├── dist/              # Packaged beta release
└── website/           # Landing page (confluent.xyz)
```

## ⚙️ Trigger Modes

| Mode | Description | Trigger |
|------|-------------|---------|
| **Standard** | Timer-based | After configurable delay (0.5s – 2s) |
| **Rapid** | Instant on punctuation/space | Space, period, comma, etc. |
| **Pro** | Sentence-end | Period, exclamation, question mark |

## 🔒 Permissions

- `storage` — Save user preferences
- `activeTab` / `scripting` — Inject content script
- `clipboardRead` / `clipboardWrite` — Ctrl+A/Ctrl+V simulation for rich text editors
