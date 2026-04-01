interface LedStripProps {
  active: boolean;
  side: "left" | "right";
  count?: number;
  warmColor?: string;
  glowColor?: string;
}

const LedStrip = ({
  active,
  side,
  count = 10,
  warmColor = "var(--led-warm)",
  glowColor = "var(--led-glow)",
}: LedStripProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-between py-4 ${
        side === "left" ? "pr-2" : "pl-2"
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all duration-400"
          style={{
            animationDelay: `${i * 0.12}s`,
          }}
        >
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-400"
            style={{
              border: active
                ? `2.5px solid hsl(${warmColor})`
                : "2.5px solid hsl(var(--led-off) / 0.5)",
              boxShadow: active
                ? `0 0 10px 2px hsl(${glowColor} / 0.5),
                   0 0 25px 5px hsl(${glowColor} / 0.2),
                   0 0 50px 10px hsl(${glowColor} / 0.08),
                   inset 0 0 8px 2px hsl(${glowColor} / 0.15)`
                : "none",
              animation: active ? "led-pulse 2.5s ease-in-out infinite" : "none",
              animationDelay: `${i * 0.12}s`,
            }}
          />
          {/* Inner bright center dot */}
          <div
            className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-400"
            style={{
              backgroundColor: active
                ? `hsl(${warmColor})`
                : "hsl(var(--led-off) / 0.3)",
              boxShadow: active
                ? `0 0 6px 2px hsl(${glowColor} / 0.7),
                   0 0 12px 4px hsl(${glowColor} / 0.3)`
                : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default LedStrip;
