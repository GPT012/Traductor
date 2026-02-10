# 🌐 Auto Translator - Extension Chrome

Extension Chrome qui traduit automatiquement ce que vous tapez sur les pages web via l'API Anthropic Claude.

## ✨ Fonctionnalités

- **Traduction automatique** : Tapez en français → traduction en anglais après 2 secondes de pause
- **Détection universelle** : Fonctionne sur `<input>`, `<textarea>`, et `contentEditable` (Discord, Slack, etc.)
- **3 modes de traduction** : Casual, Professionnel, Gaming
- **Multi-langues** : Anglais, Français, Espagnol, Allemand, Italien, Portugais, Japonais, Chinois
- **Sécurité** : Exclut automatiquement les champs sensibles (mots de passe, cartes, etc.)
- **Indicateur visuel** : Badge flottant avec état de la traduction

## 🚀 Installation

1. Ouvrez Chrome → `chrome://extensions/`
2. Activez le **Mode développeur** (toggle en haut à droite)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `chrome-translator`

## ⚙️ Configuration

1. Cliquez sur l'icône de l'extension → **Configurer la clé API**
2. Entrez votre clé API Anthropic (obtenue sur [console.anthropic.com](https://console.anthropic.com))
3. Choisissez votre langue cible et votre mode préféré
4. Sauvegardez !

## 📝 Utilisation

1. Assurez-vous que l'extension est activée (badge "Translator ON")
2. Tapez du texte dans n'importe quel champ de saisie
3. Attendez 2 secondes sans taper
4. Le texte est automatiquement traduit !

## 📁 Structure

```
chrome-translator/
├── manifest.json      # Configuration Manifest V3
├── background.js      # Service Worker + API Anthropic
├── content.js         # Script injecté (détection + remplacement)
├── popup.html/js      # Interface popup
├── options.html/js    # Page de configuration
└── icons/             # Icônes de l'extension
```

## 🔧 Modes de traduction

| Mode | Description | Exemple |
|------|-------------|---------|
| **Casual** | Naturel, détendu | "Salut, ça va ?" → "Hey, how's it going?" |
| **Pro** | Formel, business | "Salut, ça va ?" → "Hello, how are you?" |
| **Gaming** | Court, direct, slang OK | "Salut, ça va ?" → "Yo, sup?" |
