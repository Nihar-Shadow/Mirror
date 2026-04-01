import { FrameStyle, frameStyles } from "./frameStyles";

interface FrameSelectorProps {
  current: FrameStyle;
  onChange: (style: FrameStyle) => void;
}

const swatches: Record<FrameStyle, string> = {
  "gold-ornate": "linear-gradient(135deg, hsl(43 80% 55%), hsl(36 70% 70%))",
  "minimalist-black": "linear-gradient(135deg, hsl(0 0% 10%), hsl(0 0% 20%))",
  "rose-gold": "linear-gradient(135deg, hsl(350 50% 65%), hsl(15 60% 70%))",
};

const FrameSelector = ({ current, onChange }: FrameSelectorProps) => {
  const styles = Object.keys(frameStyles) as FrameStyle[];

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-3 items-center">
      <span className="text-muted-foreground/40 text-[10px] tracking-[0.2em] uppercase mr-1">
        Frame
      </span>
      {styles.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={frameStyles[key].label}
          className="w-7 h-7 rounded-full transition-all duration-400 border-2"
          style={{
            background: swatches[key],
            borderColor:
              current === key ? "hsl(var(--primary))" : "transparent",
            transform: current === key ? "scale(1.15)" : "scale(1)",
            boxShadow:
              current === key
                ? "0 0 12px 2px hsl(var(--primary) / 0.25)"
                : "none",
          }}
        />
      ))}
    </div>
  );
};

export default FrameSelector;
