import mic from "../../assets/images/mic.png";

import "./Mic.scss";

const Mic = () => {
  return (
    <div className="mic">
      <img src={mic} alt="Microphone" className="mic__image" />
    </div>
  );
};

export default Mic;
