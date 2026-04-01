import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminPanel } from "@/hooks/useAdminPanel";

const ADMIN_KEY = "DEVKEY123";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}
function formatDuration(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const key = params.get("key");

  const [, forceUpdate] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

  const { sessionsRef, remoteStreamsRef, setOnUpdate, watchSession } =
    useAdminPanel();

  // Force re-render when sessions update
  useEffect(() => {
    setOnUpdate(() => forceUpdate((n) => n + 1));
  }, [setOnUpdate]);

  // Live duration ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Wire expanded session stream to video element
  useEffect(() => {
    if (!expandedId || !expandedVideoRef.current) return;
    const stream = remoteStreamsRef.current.get(expandedId);
    if (stream) {
      expandedVideoRef.current.srcObject = stream;
      expandedVideoRef.current.play().catch(() => {});
    }
  }, [expandedId, remoteStreamsRef, tick]);

  // Auth guard
  if (key !== ADMIN_KEY) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="border border-red-900 p-8 text-center space-y-4">
          <p className="text-red-500 text-xl tracking-widest">
            ACCESS DENIED
          </p>
          <p className="text-red-900 text-sm">Invalid or missing key.</p>
          <button
            onClick={() => navigate("/")}
            className="text-red-700 text-xs border border-red-900 px-4 py-2 hover:bg-red-950 transition-colors"
          >
            RETURN
          </button>
        </div>
      </div>
    );
  }

  const sessions = Array.from(sessionsRef.current.values());
  const expandedSession = expandedId
    ? sessionsRef.current.get(expandedId)
    : null;

  return (
    <div
      className="min-h-screen bg-black text-green-400 font-mono overflow-hidden"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)",
        }}
      />

      {/* Top bar */}
      <header className="border-b border-green-900 px-6 py-3 flex items-center justify-between bg-black/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <span className="text-green-500 text-xs animate-pulse">● LIVE</span>
          <span className="text-green-300 text-sm tracking-widest uppercase">
            LuxMirror // Admin Panel
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-green-600 text-xs">
            {new Date().toLocaleString()}
          </span>
          <div className="border border-green-800 px-3 py-1 text-green-300 text-xs">
            ACTIVE SESSIONS:{" "}
            <span className="text-green-400 font-bold">{sessions.length}</span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-green-900 flex flex-col bg-black">
          <div className="px-4 py-3 border-b border-green-900 text-xs text-green-600 tracking-widest uppercase">
            Active Users
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-4 text-green-900 text-xs text-center mt-8">
                No active sessions
                <br />
                <span className="animate-pulse">waiting...</span>
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.sessionId}
                  onClick={() => {
                    setExpandedId(s.sessionId);
                    watchSession(s.sessionId);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-green-950 hover:bg-green-950/40 transition-colors ${
                    expandedId === s.sessionId ? "bg-green-950/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-500 text-[10px] animate-pulse">
                      ●
                    </span>
                    <span className="text-green-300 text-xs truncate">
                      {s.sessionId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-green-700 text-[10px] pl-4">
                    Start: {formatTime(s.startTime)}
                  </div>
                  <div className="text-green-700 text-[10px] pl-4">
                    Duration: {formatDuration(s.startTime)}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Educational note */}
          <div className="border-t border-green-900 p-3">
            <p className="text-green-900 text-[9px] leading-relaxed">
              ⚠ EDUCATIONAL DEMO
              <br />
              Users consented via live badge.
              <br />
              WebRTC + WebSocket signaling.
            </p>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-auto p-4">
          {/* Expanded view */}
          {expandedSession && (
            <div className="mb-6 border border-green-700 relative">
              <div className="flex items-center justify-between px-3 py-1 bg-green-950/50 border-b border-green-800">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-[10px] animate-pulse">
                    ● WATCHING
                  </span>
                  <span className="text-green-300 text-xs">
                    SESSION:{" "}
                    {expandedSession.sessionId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setExpandedId(null)}
                  className="text-green-700 hover:text-green-400 text-xs"
                >
                  [CLOSE]
                </button>
              </div>
              <div
                className="relative bg-black flex items-center justify-center"
                style={{ height: "55vh" }}
              >
                <video
                  ref={expandedVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{
                    filter: "contrast(1.05) brightness(0.95)",
                  }}
                />
                {/* Overlay info */}
                <div className="absolute bottom-2 left-2 text-green-500 text-[10px] bg-black/60 px-2 py-1">
                  {expandedSession.sessionId.toUpperCase()} /{" "}
                  {formatTime(expandedSession.startTime)} /{" "}
                  {formatDuration(expandedSession.startTime)}
                </div>
                <div className="absolute top-2 right-2 text-red-500 text-[10px] animate-pulse bg-black/60 px-2 py-1">
                  ● REC
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="mb-3 text-xs text-green-700 tracking-widest uppercase border-b border-green-950 pb-2">
            Mirror Grid — {sessions.length} active
          </div>

          {sessions.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-green-900 text-sm">
              <div className="text-center space-y-2">
                <div className="text-4xl">◻</div>
                <p className="text-xs tracking-widest">
                  Waiting for mirror sessions...
                </p>
                <p className="text-[10px] text-green-950">
                  Navigate to /mirror to start a session
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sessions.map((s) => (
                <SessionTile
                  key={s.sessionId}
                  session={s}
                  stream={remoteStreamsRef.current.get(s.sessionId)}
                  isExpanded={expandedId === s.sessionId}
                  onClick={() => {
                    setExpandedId(s.sessionId);
                    watchSession(s.sessionId);
                  }}
                  tick={tick}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SessionTile({
  session,
  stream,
  isExpanded,
  onClick,
  tick: _tick,
}: {
  session: { sessionId: string; startTime: number };
  stream?: MediaStream;
  isExpanded: boolean;
  onClick: () => void;
  tick: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    if (videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, _tick]);

  return (
    <button
      onClick={onClick}
      className={`relative border text-left transition-all duration-200 hover:border-green-500 ${
        isExpanded ? "border-green-400" : "border-green-900"
      } bg-black group`}
    >
      {/* Video */}
      <div className="relative aspect-[9/16] bg-black overflow-hidden">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ filter: "contrast(1.05) saturate(0.9)" }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-green-900 text-xs">
            <span className="animate-pulse">Connecting...</span>
          </div>
        )}

        {/* Watching badge */}
        <div className="absolute top-1 right-1 bg-black/70 px-1.5 py-0.5 text-[9px] text-green-400 animate-pulse">
          ● LIVE
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-green-950 space-y-0.5">
        <div className="text-green-300 text-[10px] truncate">
          {session.sessionId.slice(0, 8).toUpperCase()}
        </div>
        <div className="text-green-800 text-[9px]">
          {formatTime(session.startTime)}
        </div>
        <div className="text-green-700 text-[9px]">
          {formatDuration(session.startTime)}
        </div>
      </div>
    </button>
  );
}
