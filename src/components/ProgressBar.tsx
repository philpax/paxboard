/**
 * Core progress bar - just the visual bar element
 */
export function ProgressBarCore({
  percentage,
  color = "bg-blue-400",
  height = "h-2",
  rounded = false,
}: {
  percentage: number;
  color?: string;
  height?: string;
  rounded?: boolean;
}) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const roundedClass = rounded ? "rounded-full" : "";

  return (
    <div className={`w-full bg-black ${height} ${roundedClass}`}>
      <div
        className={`${color} ${height} ${roundedClass} transition-all duration-300`}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}

/**
 * Label row with left/right text above a progress bar
 */
export function ProgressBarLabel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between mb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Full progress bar with label and value display (current/total format)
 */
export function ProgressBar({
  current,
  total,
  label,
  color = "bg-blue-400",
}: {
  current: number;
  total: number;
  label: string;
  color?: string;
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="text-xs mb-2">
      <ProgressBarLabel label={label} value={`${current}/${total}`} />
      <ProgressBarCore percentage={percentage} color={color} />
    </div>
  );
}

/**
 * Progress bar with percentage and custom value display
 */
export function StatBar({
  label,
  value,
  percentage,
  color = "bg-blue-400",
}: {
  label: string;
  value: string;
  percentage: number;
  color?: string;
}) {
  return (
    <div className="text-xs mb-2">
      <ProgressBarLabel label={label} value={value} />
      <ProgressBarCore percentage={percentage} color={color} />
    </div>
  );
}
