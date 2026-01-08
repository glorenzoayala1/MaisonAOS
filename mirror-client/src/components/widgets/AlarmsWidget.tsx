// mirror-client/src/components/widgets/AlarmsWidget.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import type { AlarmItem } from "../../config";

type Props = {
  alarms?: AlarmItem[];
};

export const AlarmsWidget: React.FC<Props> = ({ alarms = [] }) => {
  const [checking, setChecking] = useState(false);

  // Check for triggered alarms every 10 seconds
  useEffect(() => {
    const checkAlarms = async () => {
      if (checking) return;

      try {
        setChecking(true);
        const res = await fetch(`${API_BASE_URL}/api/alarms/check`);
        const data = await res.json();

        if (data.triggered && data.greeting) {
          // Trigger alarm response
          console.log("[ALARMS] Alarm triggered:", data.alarm);

          // Speak the greeting via TTS
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(data.greeting);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }

          // Optional: Play sound if alarm has soundEnabled
          if (data.alarm.soundEnabled) {
            // Could add custom alarm sound here
            console.log("[ALARMS] Sound enabled for alarm");
          }
        }
      } catch (err) {
        console.error("[ALARMS] Error checking alarms:", err);
      } finally {
        setChecking(false);
      }
    };

    // Check immediately
    checkAlarms();

    // Check every 10 seconds
    const interval = setInterval(checkAlarms, 10000);

    return () => clearInterval(interval);
  }, []);

  const enabledAlarms = alarms.filter((a) => a.enabled);
  const nextAlarm = enabledAlarms.length > 0 ? enabledAlarms[0] : null;

  return (
    <div
      style={{
        fontSize: "0.85rem",
        lineHeight: 1.5,
        padding: "4px 0",
      }}
    >
      <div
        style={{
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.7,
          fontSize: "0.75rem",
          marginBottom: "8px",
        }}
      >
        Alarms
      </div>

      {enabledAlarms.length === 0 && (
        <div style={{ opacity: 0.6, fontSize: "0.8rem", fontStyle: "italic" }}>
          No active alarms
        </div>
      )}

      {enabledAlarms.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {enabledAlarms.slice(0, 3).map((alarm) => (
            <div
              key={alarm.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  minWidth: "50px",
                }}
              >
                {alarm.time}
              </div>

              {alarm.label && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    flex: 1,
                  }}
                >
                  {alarm.label}
                </div>
              )}

              {alarm.days.length > 0 && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  {alarm.days.map((d) => d.substring(0, 2)).join(", ")}
                </div>
              )}
            </div>
          ))}

          {enabledAlarms.length > 3 && (
            <div
              style={{
                fontSize: "0.75rem",
                opacity: 0.5,
                textAlign: "center",
                marginTop: "4px",
              }}
            >
              +{enabledAlarms.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlarmsWidget;
