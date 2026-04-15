interface EsgGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

const EsgGauge = ({ score, size = 180, label = "ESG Score" }: EsgGaugeProps) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(145, 78%, 40%)";
    if (s >= 60) return "hsl(140, 60%, 65%)";
    if (s >= 40) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={getColor(score)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="gauge-circle"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

export default EsgGauge;
