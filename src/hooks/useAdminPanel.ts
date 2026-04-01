import { useEffect, useRef, useCallback } from "react";
import { randomUUID } from "@/lib/uuid";

// Dynamically resolve WS URL so it works through any dev tunnel or deployment
const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

export interface AdminSession {
  sessionId: string;
  startTime: number;
  stream?: MediaStream;
}

export function useAdminPanel() {
  const wsRef = useRef<WebSocket | null>(null);
  const adminId = useRef<string>(randomUUID());
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const sessionsRef = useRef<Map<string, AdminSession>>(new Map());
  const onUpdateRef = useRef<(() => void) | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const setOnUpdate = useCallback((fn: () => void) => {
    onUpdateRef.current = fn;
  }, []);

  const triggerUpdate = useCallback(() => {
    onUpdateRef.current?.();
  }, []);

  const watchSession = useCallback((sessionId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: "admin-watch",
        sessionId,
        adminId: adminId.current,
      })
    );
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "set-admin-id", adminId: adminId.current }));
      ws.send(JSON.stringify({ type: "register-admin" }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "session-list": {
          sessionsRef.current.clear();
          msg.sessions.forEach((s: AdminSession) => {
            sessionsRef.current.set(s.sessionId, s);
          });
          triggerUpdate();
          // Watch all existing sessions
          msg.sessions.forEach((s: AdminSession) => watchSession(s.sessionId));
          break;
        }

        case "session-joined": {
          sessionsRef.current.set(msg.sessionId, {
            sessionId: msg.sessionId,
            startTime: msg.startTime,
          });
          triggerUpdate();
          watchSession(msg.sessionId);
          break;
        }

        case "session-left": {
          sessionsRef.current.delete(msg.sessionId);
          remoteStreamsRef.current.delete(msg.sessionId);
          const pc = peersRef.current.get(msg.sessionId);
          if (pc) {
            pc.close();
            peersRef.current.delete(msg.sessionId);
          }
          triggerUpdate();
          break;
        }

        case "offer": {
          // Admin receives an offer from a mirror peer
          const peerId = msg.from;
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });
          peersRef.current.set(peerId, pc);

          const remoteStream = new MediaStream();
          remoteStreamsRef.current.set(peerId, remoteStream);

          pc.ontrack = (e) => {
            e.streams[0]?.getTracks().forEach((track) => {
              remoteStream.addTrack(track);
            });
            triggerUpdate();
          };

          pc.onicecandidate = (e) => {
            if (e.candidate && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "ice-candidate",
                  to: peerId,
                  candidate: e.candidate,
                })
              );
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(
            JSON.stringify({ type: "answer", to: peerId, sdp: answer })
          );
          break;
        }

        case "ice-candidate": {
          const pc = peersRef.current.get(msg.from);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.error("ICE:", e);
            }
          }
          break;
        }

        default:
          break;
      }
    };

    ws.onclose = () => {
      peersRef.current.forEach((pc) => pc.close());
    };

    return () => ws.close();
  }, [triggerUpdate, watchSession]);

  return {
    adminId: adminId.current,
    sessionsRef,
    remoteStreamsRef,
    setOnUpdate,
    watchSession,
  };
}
