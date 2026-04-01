export type FrameStyle = "gold-ornate" | "minimalist-black" | "rose-gold";

export interface FrameConfig {
  label: string;
  borderClass: string;
  borderStyle: React.CSSProperties;
  innerBorderStyle: React.CSSProperties;
  glowColor: string;
  ledWarm: string;
  ledGlow: string;
}

export const frameStyles: Record<FrameStyle, FrameConfig> = {
  "gold-ornate": {
    label: "Gold Ornate",
    borderClass: "rounded-lg",
    borderStyle: {
      border: "4px solid transparent",
      backgroundClip: "padding-box",
      backgroundImage:
        "linear-gradient(hsl(240 15% 10%), hsl(240 15% 10%)), linear-gradient(135deg, hsl(43 80% 55%), hsl(36 70% 70%), hsl(43 90% 50%), hsl(36 60% 65%), hsl(43 80% 55%))",
      backgroundOrigin: "border-box",
      WebkitBackgroundClip: undefined,
    },
    innerBorderStyle: {
      border: "1px solid hsl(43 60% 50% / 0.3)",
      boxShadow: "inset 0 0 30px hsl(43 80% 50% / 0.05)",
    },
    glowColor: "43 90% 61%",
    ledWarm: "36 80% 75%",
    ledGlow: "43 90% 61%",
  },
  "minimalist-black": {
    label: "Minimalist",
    borderClass: "rounded-sm",
    borderStyle: {
      border: "3px solid hsl(0 0% 8%)",
      boxShadow: "0 0 0 1px hsl(0 0% 20% / 0.4)",
    },
    innerBorderStyle: {
      border: "1px solid hsl(0 0% 15% / 0.5)",
    },
    glowColor: "0 0% 60%",
    ledWarm: "0 0% 90%",
    ledGlow: "0 0% 75%",
  },
  "rose-gold": {
    label: "Rose Gold",
    borderClass: "rounded-xl",
    borderStyle: {
      border: "4px solid transparent",
      backgroundClip: "padding-box",
      backgroundImage:
        "linear-gradient(hsl(240 15% 10%), hsl(240 15% 10%)), linear-gradient(135deg, hsl(350 50% 65%), hsl(15 60% 70%), hsl(350 40% 60%), hsl(20 50% 75%), hsl(350 50% 65%))",
      backgroundOrigin: "border-box",
    },
    innerBorderStyle: {
      border: "1px solid hsl(350 40% 55% / 0.25)",
      boxShadow: "inset 0 0 30px hsl(350 50% 60% / 0.04)",
    },
    glowColor: "350 50% 65%",
    ledWarm: "15 60% 80%",
    ledGlow: "350 50% 65%",
  },
};
