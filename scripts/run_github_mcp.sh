#!/bin/bash
# Run GitHub MCP Server
# Usage: GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> ./run_github_mcp.sh

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN is not set."
  echo "Please set it before running, e.g.:"
  echo "  export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_..."
  echo "  ./run_github_mcp.sh"
  exit 1
fi

# Run the MCP server
# Note: This runs interactively (-i). Remove -i if running in background/daemon mode.
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" \
  -e GITHUB_TOOLS="get_file_contents,issue_read,create_pull_request" \
  ghcr.io/github/github-mcp-server
