import meter from "../../assets/images/meter.png";
import needle from "../../assets/images/needle.png";

import Wave from "../Wave/Wave";
import Mic from "../Mic/Mic";

import "./Meter.scss";

const Meter = ({ volume = 0, micEnabled }) => {
  const mapVolumeToAngle = (volume) => {
    const MIN_ANGLE = -70;
    const MAX_ANGLE = 70;

    return MIN_ANGLE + (volume / 100) * (MAX_ANGLE - MIN_ANGLE);
  };

  const angle = mapVolumeToAngle(volume);

  return (
    <section className="meter">
      {/* Meter Background */}
      <img src={meter} alt="Excitometer Meter" className="meter__image" />

      {/* Needle */}
      <div
        className="meter__needle-wrapper"
        style={{
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        }}
      >
        <img src={needle} alt="Needle" className="meter__needle" />
      </div>

      {/* Audio Section */}
      <div className="meter__audio">
        <Wave volume={volume} micEnabled={true} />
        <Mic />
        <Wave volume={volume} micEnabled={true} />
      </div>
    </section>
  );
};

export default Meter;
