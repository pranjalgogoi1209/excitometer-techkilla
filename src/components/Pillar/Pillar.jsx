import pillarLeft from "../../assets/images/pillar-left.png";
import pillarRight from "../../assets/images/pillar-right.png";

import "./Pillar.scss";

const TOTAL_LEDS = 30;

const ledColors = [
  // Dark Green (1-5)
  "#006b2d",
  "#006b2d",
  "#007a33",
  "#00853a",
  "#009940",

  // Green (6-10)
  "#1fb34a",
  "#3ecb55",
  "#5ee160",
  "#7bf06a",
  "#9cff5a",

  // Yellow-Green (11-15)
  "#bfff4a",
  "#d7ff35",
  "#e8ff22",
  "#f5ff10",
  "#fff700",

  // Yellow (16-20)
  "#fff200",
  "#ffea00",
  "#ffe000",
  "#ffd500",
  "#ffca00",

  // Yellow-Orange (21-24)
  "#ffbe00",
  "#ffb000",
  "#ffa200",
  "#ff9400",

  // Orange (25-28)
  "#ff8600",
  "#ff7600",
  "#ff6600",
  "#ff5400",

  // Red (29-30)
  "#ff3d00",
  "#ff2200",
];

const Pillar = ({ side, volume = 0 }) => {
  const pillarImage = side === "left" ? pillarLeft : pillarRight;

  const activeLeds = Math.round((volume / 100) * TOTAL_LEDS);

  return (
    <aside className={`pillar pillar--${side}`}>
      <div className="pillar__wrapper">
        <img
          src={pillarImage}
          alt={`${side} Pillar`}
          className="pillar__image"
        />

        <div className={`pillar__leds pillar__leds--${side}`}>
          {Array.from({ length: TOTAL_LEDS }).map((_, index) => (
            <div
              key={index}
              className={`pillar__led ${
                index < activeLeds ? "pillar__led--active" : ""
              }`}
              style={{
                "--led-color": ledColors[index],
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Pillar;
