#!/bin/bash
echo "Installing OpenClaw globally..."
sudo npm install -g openclaw@latest

echo "Installing OpenClaw Browser Extension..."
openclaw browser extension install

echo "Done! Open Chrome and load the unpacked extension from:"
openclaw browser extension path
