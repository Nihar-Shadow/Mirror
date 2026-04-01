import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Track sessions: sessionId -> { ws, startTime, peerId }
const sessions = new Map();
// Track admin connections
const admins = new Set();

function broadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastToAdmins(data) {
  const msg = JSON.stringify(data);
  admins.forEach((adminWs) => {
    if (adminWs.readyState === WebSocket.OPEN) {
      adminWs.send(msg);
    }
  });
}

function sendSessionList(targetWs) {
  const list = [];
  sessions.forEach((session, id) => {
    list.push({ sessionId: id, startTime: session.startTime });
  });
  const msg = JSON.stringify({ type: "session-list", sessions: list });
  targetWs.send(msg);
}

wss.on("connection", (ws) => {
  ws.sessionId = null;
  ws.isAdmin = false;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      // ── Mirror client registers ──────────────────────────────────────
      case "register-mirror": {
        const sessionId = randomUUID();
        ws.sessionId = sessionId;
        sessions.set(sessionId, { ws, startTime: Date.now() });
        ws.send(JSON.stringify({ type: "registered", sessionId }));

        // Notify all admins of new session
        broadcastToAdmins({
          type: "session-joined",
          sessionId,
          startTime: Date.now(),
        });
        break;
      }

      // ── Admin registers ──────────────────────────────────────────────
      case "register-admin": {
        ws.isAdmin = true;
        admins.add(ws);
        // Send current session list immediately
        sendSessionList(ws);
        break;
      }

      // ── Admin wants to watch a specific session ──────────────────────
      case "admin-watch": {
        // Forward watch request to the target mirror client
        const target = sessions.get(msg.sessionId);
        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(
            JSON.stringify({ type: "watch-request", adminId: msg.adminId })
          );
        }
        break;
      }

      // ── WebRTC signaling: offer / answer / ice-candidate ─────────────
      case "offer":
      case "answer":
      case "ice-candidate": {
        // Route to specific peer
        const dest = msg.to;
        let destWs = null;

        // Could be admin->mirror or mirror->admin
        sessions.forEach((s, id) => {
          if (id === dest) destWs = s.ws;
        });
        admins.forEach((a) => {
          if (a.adminId === dest) destWs = a;
        });

        if (destWs && destWs.readyState === WebSocket.OPEN) {
          destWs.send(
            JSON.stringify({ ...msg, from: ws.sessionId || ws.adminId })
          );
        }
        break;
      }

      // ── Admin assigns itself an ID ───────────────────────────────────
      case "set-admin-id": {
        ws.adminId = msg.adminId;
        break;
      }

      default:
        break;
    }
  });

  ws.on("close", () => {
    if (ws.sessionId && sessions.has(ws.sessionId)) {
      sessions.delete(ws.sessionId);
      broadcastToAdmins({ type: "session-left", sessionId: ws.sessionId });
    }
    if (ws.isAdmin) {
      admins.delete(ws);
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ LuxMirror signaling server running on ws://localhost:${PORT}`);
});
