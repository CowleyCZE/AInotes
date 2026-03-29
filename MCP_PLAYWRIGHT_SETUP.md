# Playwright MCP Server - AInotes Integration

This document explains how to use the Playwright MCP server with the AInotes project.

## 📍 Setup Status

✅ **Installation Complete**

```
/home/cowley/Dokumenty/projekty/
├── AInotes/
│   └── cline_mcp_config.json  ← MCP configuration
└── playwright/                 ← Standalone MCP server
    ├── package.json
    ├── server.js
    ├── README.md
    └── node_modules/           ← Dependencies installed
```

## 🚀 How to Use

### 1. Start the Playwright MCP Server

```bash
cd /home/cowley/Dokumenty/projekty/playwright
npm start
```

The server will communicate via stdio with AI agents.

### 2. Available in AI Context

Once running, AI agents working in the AInotes workspace can use:

```
browser_navigate('https://example.com')  → Navigate to webpage
browser_snapshot()                       → Get page content
browser_click('.selector')               → Click element
browser_type('text')                     → Type into field
browser_close()                          → Close browser
```

### 3. Example Use Cases

**Testing AInotes Features:**
```
1. Navigate to deployed app
2. Take snapshot of interface
3. Click on note creation button
4. Type test content
5. Verify content renders
```

**Web Content Analysis:**
```
1. Navigate to external webpage
2. Take snapshot
3. Analyze page structure
4. Extract specific information
```

## 🔧 Configuration

The MCP server is configured via `cline_mcp_config.json` in the AInotes project:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["../playwright/server.js"],
      "description": "Playwright MCP Server for Testing & Browser Automation",
      "disabled": false,
      "alwaysAllow": ["browser_navigate", "browser_snapshot", "browser_click", "browser_type"]
    }
  }
}
```

**To disable/enable:** Set `"disabled": true` or `false` in the config.

## 📚 Documentation

- **Full Server Docs:** [../playwright/README.md](../playwright/README.md)
- **Workspace Instructions:** [./.github/copilot-instructions.md](./.github/copilot-instructions.md#-model-context-protocol-mcp-servers)

## 🐛 Troubleshooting

**Server fails to start:**
```bash
             # Reinstall dependencies
npx playwright install   # Install browser binaries
npm start               # Try again
```

**Tools don't respond:**
- Verify MCP server is running
- Check stdio connection in AI agent logs
- Ensure MCP configuration points to correct path

**Port conflicts:**
- Playwright server uses stdio, not ports
- No port conflicts should occur

## 🎯 Integration with AInotes Development

Use Playwright MCP server for:

1. **E2E Testing** — Automate UI tests without adding to package.json
2. **Development Preview** — Verify changes in running app
3. **Documentation** — Screenshot features for docs
4. **QA Automation** — Test workflows before deployment

## 📝 Notes

- MCP server runs **independently** of the AInotes React app
- Server uses **stdio communication** (not HTTP)
- Browser sessions **persist** during server lifetime
- Playwright **installs system browsers** on first use

---

**Setup Date:** March 30, 2026  
**Status:** ✅ Ready for use  
**Protocol:** Model Context Protocol (MCP) 1.0
