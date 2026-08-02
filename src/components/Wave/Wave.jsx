import wave from "../../assets/images/wave.png";
import "./Wave.scss";

const Wave = () => {
  return (
    <div className="wave">
      <img src={wave} alt="Wave" className="wave__image" />
    </div>
  );
};

export default Wave;
