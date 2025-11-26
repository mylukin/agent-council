# Agent Council

A multi-model AI council CLI that provides consensus-driven decisions using Claude, Codex, and Gemini.

## How It Works

```text
Stage 1: Individual Responses
  All agents answer the question in parallel

Stage 2: Peer Rankings
  Each agent evaluates and ranks all responses

Stage 3: Chairman Synthesis
  A designated agent synthesizes the final answer based on all responses and rankings
```

## Installation

```bash
# Install globally from npm
npm install -g agent-council

# Or clone and build locally
git clone https://github.com/mylukin/agent-council.git
cd agent-council
npm install
npm link
```

## Prerequisites

The following CLI tools must be installed and configured:

- [Claude Code](https://github.com/anthropics/claude-code) (`claude`)
- [Codex CLI](https://github.com/openai/codex) (`codex`)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (`gemini`)

At least one agent must be available. The council works best with multiple agents.

## Usage

### REPL Mode (Interactive)

```bash
# Start interactive mode
agent-council

> What's the best database for real-time analytics?
# Council processes and responds...

> What about cost considerations?
# Follow-up question with conversation history...
```

### Single Question Mode

```bash
agent-council "Your question here"

# Options
agent-council "Question" --chairman gemini  # Set chairman (default: gemini)
agent-council "Question" --timeout 60       # Per-agent timeout in seconds
agent-council "Question" --json             # Output as JSON
```

### Slash Commands (REPL Mode)

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/agents` | List available agents |
| `/chairman [name]` | Show or set chairman |
| `/timeout [seconds]` | Show or set timeout |
| `/history` | Show conversation history |
| `/clear` | Clear conversation history |
| `/exit` | Exit the REPL |

## Interactive Controls

During execution, use these keyboard controls:

| Key | Action |
|-----|--------|
| `1`, `2`, `3` | Focus agent N |
| `↑` / `↓` | Navigate focus |
| `k` | Kill focused agent |
| `ESC` | Abort all agents |
| `Ctrl+C` | Quit |

## Development

```bash
npm run dev -- "Test question"  # Run without building
npm test                        # Run tests
npm run test:watch              # Run tests in watch mode
```

## License

MIT
