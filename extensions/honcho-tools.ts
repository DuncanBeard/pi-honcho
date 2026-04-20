import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const HONCHO_URL = process.env.HONCHO_URL || "http://horton.tail7aa1e.ts.net:8100";
const WORKSPACE = process.env.HONCHO_WORKSPACE || "default";

async function honcho(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${HONCHO_URL}/v3/workspaces/${WORKSPACE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Honcho ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export default function (pi: ExtensionAPI) {
  // ── Workspace ─────────────────────────────────────────────────────

  pi.registerTool({
    name: "honcho_inspect_workspace",
    label: "Honcho: Inspect Workspace",
    description:
      "Inspect the current Honcho workspace. Returns metadata, configuration, peer IDs, and session IDs.",
    promptSnippet: "Inspect current Honcho workspace (peers, sessions, metadata)",
    parameters: Type.Object({}),
    async execute() {
      const [peers, sessions] = await Promise.all([
        honcho("POST", "/peers/list", {}),
        honcho("POST", "/sessions/list", {}),
      ]);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { workspace_id: WORKSPACE, peers, sessions },
              null,
              2,
            ),
          },
        ],
      };
    },
  });

  pi.registerTool({
    name: "honcho_search",
    label: "Honcho: Search",
    description:
      "Semantic search across messages in Honcho. Optionally scope by peer_id and/or session_id.",
    promptSnippet:
      "Semantic search across Honcho messages, optionally scoped by peer/session",
    parameters: Type.Object({
      query: Type.String({ description: "Semantic search query" }),
      peer_id: Type.Optional(
        Type.String({ description: "Scope to this peer" }),
      ),
      session_id: Type.Optional(
        Type.String({ description: "Scope to this session" }),
      ),
    }),
    async execute(_id, params) {
      let path: string;
      if (params.peer_id && params.session_id) {
        path = `/sessions/${params.session_id}/messages/list`;
      } else if (params.peer_id) {
        path = `/peers/${params.peer_id}/search`;
      } else {
        path = `/search`;
      }
      const data = await honcho("POST", path, { query: params.query });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  // ── Peers ─────────────────────────────────────────────────────────

  pi.registerTool({
    name: "honcho_list_peers",
    label: "Honcho: List Peers",
    description:
      "List all peers (users and agents) in the current Honcho workspace.",
    promptSnippet: "List Honcho peers in the workspace",
    parameters: Type.Object({}),
    async execute() {
      const data = await honcho("POST", "/peers/list", {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_create_peer",
    label: "Honcho: Create Peer",
    description: "Get or create a peer with the given ID in Honcho.",
    promptSnippet: "Create or get a Honcho peer by ID",
    parameters: Type.Object({
      peer_id: Type.String({ description: "Unique identifier for the peer" }),
    }),
    async execute(_id, params) {
      const data = await honcho("POST", "/peers", { name: params.peer_id });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_chat",
    label: "Honcho: Chat (Dialectic)",
    description:
      "Ask a natural-language question about a peer and get an answer from Honcho's reasoning system. Returns what Honcho knows about the peer's preferences, history, personality, etc.",
    promptSnippet:
      "Query Honcho's knowledge about a peer via dialectic chat",
    parameters: Type.Object({
      peer_id: Type.String({ description: "The peer to query about" }),
      query: Type.String({ description: "Natural-language question" }),
    }),
    async execute(_id, params) {
      const data = await honcho("POST", `/peers/${params.peer_id}/chat`, {
        query: params.query,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_get_peer_card",
    label: "Honcho: Get Peer Card",
    description:
      "Get the peer card (summary profile) for a peer. Contains a high-level overview of what Honcho knows.",
    promptSnippet: "Get a peer's card/profile from Honcho",
    parameters: Type.Object({
      peer_id: Type.String({ description: "The peer ID" }),
    }),
    async execute(_id, params) {
      const data = await honcho("GET", `/peers/${params.peer_id}/card`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_get_representation",
    label: "Honcho: Get Representation",
    description:
      "Get the full representation (derived knowledge) for a peer.",
    promptSnippet: "Get Honcho's full representation of a peer",
    parameters: Type.Object({
      peer_id: Type.String({ description: "The peer ID" }),
    }),
    async execute(_id, params) {
      const data = await honcho(
        "GET",
        `/peers/${params.peer_id}/representation`,
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  // ── Sessions ──────────────────────────────────────────────────────

  pi.registerTool({
    name: "honcho_list_sessions",
    label: "Honcho: List Sessions",
    description: "List all sessions in the current Honcho workspace.",
    promptSnippet: "List Honcho sessions in the workspace",
    parameters: Type.Object({}),
    async execute() {
      const data = await honcho("POST", "/sessions/list", {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_create_session",
    label: "Honcho: Create Session",
    description: "Get or create a session with the given ID.",
    promptSnippet: "Create or get a Honcho session by ID",
    parameters: Type.Object({
      session_id: Type.String({
        description: "Unique identifier for the session",
      }),
    }),
    async execute(_id, params) {
      const data = await honcho("POST", "/sessions", {
        name: params.session_id,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_get_session_messages",
    label: "Honcho: Get Session Messages",
    description:
      "Get messages from a Honcho session. Returns the conversation history.",
    promptSnippet: "Get messages from a Honcho session",
    parameters: Type.Object({
      session_id: Type.String({ description: "The session ID" }),
    }),
    async execute(_id, params) {
      const data = await honcho(
        "POST",
        `/sessions/${params.session_id}/messages/list`,
        {},
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_add_messages",
    label: "Honcho: Add Messages",
    description:
      "Add messages to a Honcho session. Messages are processed in the background for memory extraction. Each message needs a peer_id (who said it) and content.",
    promptSnippet: "Add messages to a Honcho session for memory processing",
    parameters: Type.Object({
      session_id: Type.String({ description: "The session ID" }),
      messages: Type.Array(
        Type.Object({
          peer_id: Type.String({ description: "Who sent this message" }),
          content: Type.String({ description: "The message content" }),
        }),
      ),
    }),
    async execute(_id, params) {
      const data = await honcho(
        "POST",
        `/sessions/${params.session_id}/messages`,
        params.messages,
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  // ── Conclusions ───────────────────────────────────────────────────

  pi.registerTool({
    name: "honcho_list_conclusions",
    label: "Honcho: List Conclusions",
    description:
      "List conclusions (facts and observations) Honcho has derived. Conclusions are the building blocks of Honcho's memory.",
    promptSnippet: "List derived conclusions/observations from Honcho",
    parameters: Type.Object({
      peer_id: Type.Optional(
        Type.String({ description: "Filter by observer peer" }),
      ),
    }),
    async execute(_id, params) {
      const body: Record<string, unknown> = {};
      if (params.peer_id) body.peer_id = params.peer_id;
      const data = await honcho("POST", "/conclusions/list", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_query_conclusions",
    label: "Honcho: Query Conclusions",
    description:
      "Semantic search across Honcho's conclusions. More targeted than listing — finds specific knowledge by meaning.",
    promptSnippet: "Semantic search across Honcho conclusions",
    parameters: Type.Object({
      query: Type.String({ description: "Semantic search query" }),
      peer_id: Type.Optional(
        Type.String({ description: "Filter by observer peer" }),
      ),
    }),
    async execute(_id, params) {
      const body: Record<string, unknown> = { query: params.query };
      if (params.peer_id) body.peer_id = params.peer_id;
      const data = await honcho("POST", "/conclusions/query", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  // ── System ────────────────────────────────────────────────────────

  pi.registerTool({
    name: "honcho_schedule_dream",
    label: "Honcho: Schedule Dream",
    description:
      "Schedule a dream — a background memory-consolidation task. Dreams consolidate observations into higher-level insights.",
    promptSnippet:
      "Schedule a Honcho dream (memory consolidation) for a peer",
    parameters: Type.Object({
      peer_id: Type.String({ description: "The peer to dream for" }),
      target_peer_id: Type.Optional(
        Type.String({ description: "Dream about this target peer" }),
      ),
      session_id: Type.Optional(
        Type.String({ description: "Scope dream to this session" }),
      ),
    }),
    async execute(_id, params) {
      const body: Record<string, unknown> = { observer: params.peer_id };
      if (params.target_peer_id) body.observed = params.target_peer_id;
      if (params.session_id) body.session = params.session_id;
      const data = await honcho("POST", "/schedule_dream", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  pi.registerTool({
    name: "honcho_queue_status",
    label: "Honcho: Queue Status",
    description:
      "Get the background processing queue status. Check if Honcho is still processing messages before querying for insights.",
    promptSnippet: "Check Honcho's background processing queue status",
    parameters: Type.Object({}),
    async execute() {
      const data = await honcho("GET", "/queue/status");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  // ── Notify on load ────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    try {
      const res = await fetch(`${HONCHO_URL}/health`);
      if (res.ok) {
        ctx.ui.setStatus(
          "honcho",
          "🧠 Honcho connected (localhost:8000)",
        );
      } else {
        ctx.ui.setStatus("honcho", "⚠️ Honcho unhealthy");
      }
    } catch {
      ctx.ui.setStatus(
        "honcho",
        "❌ Honcho offline — start with: docker compose up -d",
      );
    }
  });
}
