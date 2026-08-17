# mini-claude-cli

Small Claude CLI written in TypeScript.

I built this mainly to understand how tool calling works in practice.

At the moment it can:

* send prompts to Claude via OpenRouter
* keep the conversation history
* handle tool calls
* read files
* write files
* run shell commands

## Usage

```bash
./mini_claude.sh -p "Read README.md and summarize it"
```

Example:

```bash
./mini_claude.sh -p "Write hello world to /tmp/test.txt and return the contents"
```

## How it works

Claude can request a tool call, for example `Read`.

The CLI executes the actual operation locally, adds the result back to the message history and sends everything back to Claude.

This repeats until Claude returns a normal response without another tool call.

## Tools

`Read` — reads a file

`Write` — writes to a file

`Bash` — executes a shell command

Still a work in progress.
