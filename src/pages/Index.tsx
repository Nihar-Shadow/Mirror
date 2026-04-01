import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Ambient animated background */}
      <div
        className="absolute inset-0 animate-ambient opacity-60"
        style={{
          background:
            "linear-gradient(135deg, hsl(240 20% 4%) 0%, hsl(235 25% 10%) 25%, hsl(240 20% 6%) 50%, hsl(230 20% 12%) 75%, hsl(240 20% 4%) 100%)",
        }}
      />

      {/* Frosted glass overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-background/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-serif font-semibold tracking-tight text-primary animate-fade-up">
          LuxMirror
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground font-light tracking-widest uppercase animate-fade-up-delay">
          Your reflection, perfected.
        </p>

        <button
          onClick={() => navigate("/mirror")}
          className="mt-8 px-12 py-4 text-lg font-medium tracking-wide rounded-full border border-primary/30 bg-primary/10 text-primary backdrop-blur-sm transition-all duration-400 hover:bg-primary/20 hover:border-primary/50 animate-cta-pulse animate-fade-up-delay-2"
        >
          Start Mirror
        </button>
      </div>

      {/* Subtle decorative elements */}
      <div className="absolute bottom-8 text-muted-foreground/30 text-xs tracking-[0.3em] uppercase font-sans">
        Intelligent Vanity Experience
      </div>
    </div>
  );
};

export default Index;
