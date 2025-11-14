import { useEffect, useState } from "react";

interface Clock {
  city: string;
  timezone: string;
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

  const formatDate = (timezone: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(currentTime);
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2 text-center">world clocks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {clocks.map((clock) => (
          <div
            key={clock.timezone}
            className="bg-[var(--color-bg-secondary)] rounded-lg p-4 hover:brightness-125 transition-all duration-200"
          >
            <div className="text-lg font-semibold mb-1">{clock.city}</div>
            <div className="text-3xl font-bold font-mono tabular-nums">
              {formatTime(clock.timezone)}
            </div>
            <div className="text-sm opacity-80 mt-1">
              {formatDate(clock.timezone)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
