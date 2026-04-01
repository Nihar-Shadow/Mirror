import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FrameSelector from "@/components/FrameSelector";
import { FrameStyle, frameStyles } from "@/components/frameStyles";
import { useMirrorStream } from "@/hooks/useMirrorStream";

const MirrorPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [personDetected, setPersonDetected] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("gold-ornate");
  const detectorRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const frame = frameStyles[frameStyle];
  const shouldGlow = personDetected || isDark;
  const [showLiveBadge, setShowLiveBadge] = useState(false);

  // WebRTC: start streaming once camera is ready
  useMirrorStream(videoRef);

  // Start camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setError("Camera access denied. Please allow camera permissions.");
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Show the live badge once camera is ready
  useEffect(() => {
    if (cameraReady) {
      setTimeout(() => setShowLiveBadge(true), 800);
    }
  }, [cameraReady]);

  // Load COCO-SSD model
  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;

    const loadModel = async () => {
      try {
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        await import("@tensorflow/tfjs");
        const model = await cocoSsd.load();
        if (!cancelled) {
          detectorRef.current = model;
        }
      } catch (e) {
        console.error("Failed to load detection model:", e);
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [cameraReady]);

  // Detection loop
  const detect = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const predictions = await detectorRef.current.detect(videoRef.current);
      const hasPerson = predictions.some(
        (p: any) => p.class === "person" && p.score > 0.5
      );
      setPersonDetected(hasPerson);

      // Detect background brightness
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvasRef.current.width = 64;
          canvasRef.current.height = 64;
          ctx.drawImage(videoRef.current, 0, 0, 64, 64);
          
          const imageData = ctx.getImageData(0, 0, 64, 64);
          const data = imageData.data;
          let colorSum = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            colorSum += brightness;
          }
          
          const avgBrightness = colorSum / (64 * 64);
          setIsDark(avgBrightness < 60);
        }
      }
    } catch {
      // Silently skip frame
    }

    // Run detection every ~500ms for performance
    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(detect);
    }, 500);
  }, []);

  useEffect(() => {
    if (cameraReady) {
      animFrameRef.current = requestAnimationFrame(detect);
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraReady, detect]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-6 text-center">
        <p className="text-primary text-lg">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-400"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Consent / Live badge — always visible to user */}
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest transition-all duration-700 ${
          showLiveBadge ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(255,60,60,0.4)",
          color: "#ff4444",
          backdropFilter: "blur(4px)",
        }}
        title="This mirror session may be viewed for educational WebRTC demonstration purposes."
      >
        <span className="animate-pulse">●</span>
        <span>LIVE</span>
      </div>
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 text-muted-foreground/50 hover:text-primary text-sm tracking-widest uppercase transition-colors duration-400"
      >
        ← Back
      </button>

      {/* Frame selector */}
      <FrameSelector current={frameStyle} onChange={setFrameStyle} />

      {/* Mirror assembly */}
      <div className="relative h-[85vh] max-h-[700px]" style={{ aspectRatio: "9/16" }}>
        {/* Backlit LED ring glow (behind the mirror) */}
        <div
          className="absolute -inset-4 rounded-2xl transition-all duration-500 pointer-events-none"
          style={{
            boxShadow: shouldGlow
              ? `0 0 25px 8px hsl(${frame.glowColor} / 0.7),
                 0 0 60px 20px hsl(${frame.glowColor} / 0.4),
                 0 0 120px 40px hsl(${frame.glowColor} / 0.2),
                 0 0 200px 60px hsl(${frame.glowColor} / 0.08),
                 inset 0 0 30px 8px hsl(${frame.glowColor} / 0.25)`
              : `0 0 12px 3px hsl(${frame.glowColor} / 0.15),
                 0 0 30px 8px hsl(${frame.glowColor} / 0.08)`,
            border: shouldGlow
              ? `2px solid hsl(${frame.ledWarm} / 0.8)`
              : `2px solid hsl(${frame.ledWarm} / 0.15)`,
            animation: shouldGlow ? "led-pulse 3s ease-in-out infinite" : "none",
          }}
        />

        {/* Inner LED ring border (visible ring light strip) */}
        <div
          className="absolute -inset-1 rounded-xl transition-all duration-500 pointer-events-none"
          style={{
            border: shouldGlow
              ? `3px solid hsl(${frame.ledWarm} / 1)`
              : `3px solid hsl(${frame.ledWarm} / 0.12)`,
            boxShadow: shouldGlow
              ? `0 0 15px 4px hsl(${frame.glowColor} / 0.7),
                 0 0 30px 8px hsl(${frame.glowColor} / 0.35),
                 inset 0 0 15px 4px hsl(${frame.glowColor} / 0.2)`
              : "none",
          }}
        />

        {/* Mirror frame */}
        <div
          className={`relative overflow-hidden h-full w-full ${frame.borderClass}`}
          style={{
            ...frame.borderStyle,
            transition: "all 0.4s ease",
          }}
        >
          {/* Decorative inner border */}
          <div
            className={`absolute inset-0 z-10 pointer-events-none ${frame.borderClass}`}
            style={frame.innerBorderStyle}
          />

          {/* Camera feed */}
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />

          {/* Frosted overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none bg-background/5 backdrop-blur-[0.5px]" />

          {/* Hidden canvas for detection */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Loading indicator */}
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-30">
              <p className="text-muted-foreground text-sm tracking-widest uppercase animate-pulse">
                Initializing mirror…
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="fixed bottom-6 text-muted-foreground/40 text-xs tracking-[0.2em] uppercase transition-all duration-400">
        {!detectorRef.current && cameraReady
          ? "Loading intelligence…"
          : shouldGlow
          ? `● ${personDetected ? "Presence" : "Darkness"} detected`
          : "○ Awaiting presence / ambient darkness"}
      </div>
    </div>
  );
};

export default MirrorPage;
