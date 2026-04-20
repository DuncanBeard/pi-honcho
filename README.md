# pi-honcho

[Honcho](https://github.com/plastic-labs/honcho) memory and social cognition tools for [pi](https://github.com/mariozechner/pi-coding-agent).

Gives pi full access to a running Honcho instance — inspect workspaces, manage peers and sessions, run dialectic queries, browse conclusions, schedule dreams, and more.

## Install

```bash
pi install git:github.com/DuncanBeard/pi-honcho
```

## Configuration

Set environment variables to point at your Honcho instance:

| Variable | Default | Description |
|---|---|---|
| `HONCHO_URL` | `http://localhost:8000` | Base URL of the Honcho API |
| `HONCHO_WORKSPACE` | `default` | Workspace name |

## Tools

| Tool | Description |
|---|---|
| `honcho_inspect_workspace` | Inspect the current workspace (peers, sessions, metadata) |
| `honcho_search` | Semantic search across messages, optionally scoped by peer/session |
| `honcho_list_peers` | List all peers in the workspace |
| `honcho_create_peer` | Get or create a peer by ID |
| `honcho_chat` | Ask a natural-language question about a peer (dialectic API) |
| `honcho_get_peer_card` | Get a peer's summary profile card |
| `honcho_get_representation` | Get the full derived representation for a peer |
| `honcho_list_sessions` | List all sessions in the workspace |
| `honcho_create_session` | Get or create a session by ID |
| `honcho_get_session_messages` | Get messages from a session |
| `honcho_add_messages` | Add messages to a session for memory processing |
| `honcho_list_conclusions` | List derived conclusions/observations |
| `honcho_query_conclusions` | Semantic search across conclusions |
| `honcho_schedule_dream` | Schedule a background memory-consolidation dream |
| `honcho_queue_status` | Check background processing queue status |

## Status Indicator

On session start, the extension checks if Honcho is reachable and shows a status indicator:

- 🧠 **Connected** — Honcho is healthy
- ⚠️ **Unhealthy** — Honcho responded but with an error
- ❌ **Offline** — Honcho is not reachable

## License

MIT
