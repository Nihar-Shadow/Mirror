import { useEffect, useRef, useCallback } from "react";

// Dynamically resolve WS URL so it works through any dev tunnel or deployment
const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

export function useMirrorStream(videoRef: React.RefObject<HTMLVideoElement>) {
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const getOrCreatePeer = useCallback(
    (adminId: string): RTCPeerConnection => {
      if (peersRef.current.has(adminId)) {
        return peersRef.current.get(adminId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add video tracks from the camera stream
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              to: adminId,
              candidate: e.candidate,
            })
          );
        }
      };

      peersRef.current.set(adminId, pc);
      return pc;
    },
    [videoRef]
  );

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register-mirror" }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "registered":
          sessionIdRef.current = msg.sessionId;
          break;

        case "watch-request": {
          // An admin wants to watch — create an offer
          const pc = getOrCreatePeer(msg.adminId);

          // Add tracks if not already added
          const stream = videoRef.current?.srcObject as MediaStream | null;
          if (stream && pc.getSenders().length === 0) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          }

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({ type: "offer", to: msg.adminId, sdp: offer })
          );
          break;
        }

        case "answer": {
          const pc = peersRef.current.get(msg.from);
          if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
          break;
        }

        case "ice-candidate": {
          const pc = peersRef.current.get(msg.from);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.error("ICE error:", e);
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
      peersRef.current.clear();
    };

    return () => {
      ws.close();
    };
  }, [getOrCreatePeer, videoRef]);

  return { sessionIdRef };
}
