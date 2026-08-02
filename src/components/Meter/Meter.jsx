import meter from "../../assets/images/meter.png";
import needle from "../../assets/images/needle.png";

import Wave from "../Wave/Wave";
import Mic from "../Mic/Mic";

import "./Meter.scss";

const Meter = () => {
  return (
    <section className="meter">
      {/* Meter Background */}
      <img src={meter} alt="Excitometer Meter" className="meter__image" />

      {/* Needle */}
      <div className="meter__needle-wrapper">
        <img src={needle} alt="Needle" className="meter__needle" />
      </div>

      {/* Audio Section */}
      <div className="meter__audio">
        <Wave />
        <Mic />
        <Wave />
      </div>
    </section>
  );
};

export default Meter;
