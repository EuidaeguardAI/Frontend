import { fill, track } from "./ProgressBar.css";

interface ProgressBarProps {
  value: number; // 0~1
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percent = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div className={track}>
      <div className={fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
