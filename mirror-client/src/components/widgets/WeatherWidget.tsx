import React from "react";

type WeatherWidgetProps = {
  temperatureF: number;
  description: string;
  symbol: string;
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  temperatureF,
  description,
  symbol,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: "2.4rem",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {Math.round(temperatureF)}°F
      </div>
      <div style={{ fontSize: "1.4rem" }}>{symbol}</div>
      <div style={{ fontSize: "0.95rem", opacity: 0.85 }}>
        {description}
      </div>
    </div>
  );
};
