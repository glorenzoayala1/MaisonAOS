import React from "react";
import type { TodayItem } from "../../config";

type TodayWidgetProps = {
  items: TodayItem[];
};

export const TodayWidget: React.FC<TodayWidgetProps> = ({ items }) => {
  return (
    <div>
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        Today
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          fontSize: "0.95rem",
        }}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            {item.time ? (
              <span style={{ opacity: 0.7, minWidth: "54px" }}>
                {item.time}
              </span>
            ) : (
              <span style={{ opacity: 0.4, minWidth: "54px" }}>•</span>
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
