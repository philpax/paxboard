interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
  color?: string;
}

export function ProgressBar({ current, total, label, color = "bg-blue-400" }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="text-xs mb-2">
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{current}/{total}</span>
      </div>
      <div className="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
