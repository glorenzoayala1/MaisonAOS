import React, { useEffect, useState } from "react";

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const ClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div
        style={{
          fontSize: "3rem",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {formatTime(now)}
      </div>
      <div
        style={{
          fontSize: "0.95rem",
          opacity: 0.8,
        }}
      >
        {formatDate(now)}
      </div>
    </div>
  );
};
