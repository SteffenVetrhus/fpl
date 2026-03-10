import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export interface DeadlineTimerProps {
  deadlineTime: string;
  gameweekName: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * Calculate the time remaining until a deadline
 */
function getTimeRemaining(deadline: string): TimeRemaining {
  const total = new Date(deadline).getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format a number as two digits with leading zero
 */
function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Always-visible countdown timer showing time until next FPL gameweek deadline
 */
export function DeadlineTimer({ deadlineTime, gameweekName }: DeadlineTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => getTimeRemaining(deadlineTime));

  useEffect(() => {
    setTime(getTimeRemaining(deadlineTime));

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(deadlineTime);
      setTime(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineTime]);

  if (time.total <= 0) {
    return (
      <div className="kit-deadline-timer" data-testid="deadline-timer">
        <Clock size={14} aria-hidden="true" />
        <span className="kit-deadline-label">{gameweekName}</span>
        <span className="kit-deadline-countdown" data-testid="deadline-expired">Deadline passed</span>
      </div>
    );
  }

  const isUrgent = time.days === 0 && time.hours < 2;

  return (
    <div
      className={`kit-deadline-timer ${isUrgent ? "kit-deadline-urgent" : ""}`}
      data-testid="deadline-timer"
    >
      <Clock size={14} aria-hidden="true" />
      <span className="kit-deadline-label">{gameweekName}</span>
      <span className="kit-deadline-countdown" data-testid="deadline-countdown">
        {time.days > 0 && <span>{time.days}d </span>}
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    </div>
  );
}
