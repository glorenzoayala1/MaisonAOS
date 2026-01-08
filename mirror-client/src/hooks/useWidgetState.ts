import { useEffect, useState } from "react";

export type WidgetState = Record<string, any>;

export function useWidgetState(pollIntervalMs: number = 3000) {
  const [widgetState, setWidgetState] = useState<WidgetState>({});

  useEffect(() => {
    let isMounted = true;

    async function fetchState() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/widgets/state");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setWidgetState(data);
      } catch (e) {
        console.error("[useWidgetState] error fetching widget state:", e);
      }
    }

    fetchState();
    const id = setInterval(fetchState, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  return widgetState;
}

