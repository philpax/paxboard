import { useEffect, useState } from "react";

interface Clock {
  city: string;
  timezone: string;
}

interface AnaloguClockProps {
  timezone: string;
  currentTime: Date;
}

function AnalogueClock({ timezone, currentTime }: AnaloguClockProps) {
  const getTimeInTimezone = () => {
    const timeString = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(currentTime);

    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = getTimeInTimezone();

  // Calculate angles for clock hands
  const secondAngle = seconds * 6 - 90; // 6 degrees per second, -90 to start at 12
  const minuteAngle = minutes * 6 + seconds * 0.1 - 90; // 6 degrees per minute
  const hourAngle = (hours % 12) * 30 + minutes * 0.5 - 90; // 30 degrees per hour

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {/* Clock face */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />

      {/* Hour markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 50 + 40 * Math.cos(angle);
        const y1 = 50 + 40 * Math.sin(angle);
        const x2 = 50 + 45 * Math.cos(angle);
        const y2 = 50 + 45 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1="50"
        y1="50"
        x2={50 + 25 * Math.cos((hourAngle * Math.PI) / 180)}
        y2={50 + 25 * Math.sin((hourAngle * Math.PI) / 180)}
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Minute hand */}
      <line
        x1="50"
        y1="50"
        x2={50 + 35 * Math.cos((minuteAngle * Math.PI) / 180)}
        y2={50 + 35 * Math.sin((minuteAngle * Math.PI) / 180)}
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Second hand */}
      <line
        x1="50"
        y1="50"
        x2={50 + 38 * Math.cos((secondAngle * Math.PI) / 180)}
        y2={50 + 38 * Math.sin((secondAngle * Math.PI) / 180)}
        stroke="#ff6b6b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="white" />
    </svg>
  );
}

export function WorldClocks() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const clocks: Clock[] = [
    { city: "San Francisco", timezone: "America/Los_Angeles" },
    { city: "New York", timezone: "America/New_York" },
    { city: "London", timezone: "Europe/London" },
    { city: "Stockholm", timezone: "Europe/Stockholm" },
    { city: "Melbourne", timezone: "Australia/Melbourne" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (timezone: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(currentTime);
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2 text-center">world clocks</h2>
      <div className="flex justify-between gap-2">
        {clocks.map((clock) => (
          <div
            key={clock.timezone}
            className="bg-[var(--color-bg-secondary)] p-2 hover:brightness-125 transition-all duration-200 flex-grow-1 flex flex-col items-center"
          >
            <div className="text-sm font-semibold mb-1 text-center">
              {clock.city}
            </div>
            <AnalogueClock
              timezone={clock.timezone}
              currentTime={currentTime}
            />
            <div className="text-base font-bold font-mono tabular-nums mt-1">
              {formatTime(clock.timezone)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
