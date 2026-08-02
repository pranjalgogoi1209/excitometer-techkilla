import meter from "../../assets/images/meter.png";

import Wave from "../Wave/Wave";
import Mic from "../Mic/Mic";

import "./Meter.scss";

const Meter = () => {
  return (
    <section className="meter">
      <img src={meter} alt="Excitometer Meter" className="meter__image" />

      {/* Needle will be added here */}

      {/* Score will be added here */}

      <div className="meter__bottom">
        <Wave />

        <Mic />

        <Wave />
      </div>
    </section>
  );
};

export default Meter;
