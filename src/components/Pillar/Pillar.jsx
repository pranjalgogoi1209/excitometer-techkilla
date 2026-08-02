import pillarLeft from "../../assets/images/pillar-left.png";
import pillarRight from "../../assets/images/pillar-right.png";

import "./Pillar.scss";

const Pillar = ({ side, volume }) => {
  const pillarImage = side === "left" ? pillarLeft : pillarRight;

  return (
    <aside className={`pillar pillar--${side}`}>
      <div className="pillar__wrapper">
        <img
          src={pillarImage}
          alt={`${side} Pillar`}
          className="pillar__image"
        />

        {/* Animated fill will come here */}
        {/* <div className="pillar__fill"></div> */}
      </div>
    </aside>
  );
};

export default Pillar;
