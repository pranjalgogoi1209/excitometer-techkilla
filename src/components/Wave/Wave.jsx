import React from "react";
import "./Wave.scss";

// Scaled down base height profile (max height is now ~80px)
const BASE_HEIGHTS = [
  3, 4, 5, 8, 12, 16, 22, 30, 40, 52, 62, 70, 76, 80, 76, 70, 62, 52, 40, 30,
  22, 16, 12, 8, 5, 4, 3,
];

// Combine into left & right wave halves
const ALL_BAR_HEIGHTS = [...BASE_HEIGHTS, ...BASE_HEIGHTS];

const Wave = ({ micEnabled = false }) => {
  return (
    <div className="wave">
      {ALL_BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className={`wave__bar ${micEnabled ? "wave__bar--active" : ""}`}
          style={{
            "--bar-height": `${height}px`,
            "--delay": `${index * 35}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default Wave;
