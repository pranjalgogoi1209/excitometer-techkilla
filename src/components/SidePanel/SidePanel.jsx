import { useEffect, useState } from "react";
import "./SidePanel.scss";

const TOTAL_LEDS = 18;

const LedBar = ({ speed = 0.6, minHeight = 2, maxHeight = TOTAL_LEDS }) => {
  const [active, setActive] = useState(minHeight);

  useEffect(() => {
    let phase = Math.random() * Math.PI * 2;

    const interval = setInterval(() => {
      // Slower phase movement
      phase += speed * 0.07;

      const wave1 = Math.sin(phase);
      const wave2 = Math.sin(phase * 2.1);

      // Small random movement
      const jitter = (Math.random() - 0.5) * 0.08;

      const raw = (wave1 * 0.65 + wave2 * 0.35 + 1) / 2 + jitter;

      const normalized = Math.max(0, Math.min(1, raw));

      const target = minHeight + normalized * (maxHeight - minHeight);

      // Smooth transition
      setActive((prev) => prev + (target - prev) * 0.25);
    }, 45);

    return () => clearInterval(interval);
  }, [speed, minHeight, maxHeight]);

  return (
    <div className="side-panel__bar">
      {Array.from({ length: TOTAL_LEDS }).map((_, index) => {
        const ledIndexFromBottom = TOTAL_LEDS - 1 - index;

        const isActive = ledIndexFromBottom < Math.round(active);

        return (
          <div
            key={index}
            className={`side-panel__led ${
              isActive ? "side-panel__led--active" : ""
            }`}
          />
        );
      })}
    </div>
  );
};

const SidePanel = () => {
  return (
    <aside className="side-panel">
      <LedBar speed={0.85} minHeight={4} maxHeight={18} />

      <LedBar speed={0.95} minHeight={2} maxHeight={17} />
    </aside>
  );
};

export default SidePanel;
