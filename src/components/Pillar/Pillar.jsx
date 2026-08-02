import pillar from "../../assets/images/pillar.png";

import "./Pillar.scss";

const Pillar = ({ side }) => {
  return (
    <aside className={`pillar pillar--${side}`}>
      <div className="pillar__wrapper">
        <img src={pillar} alt={`${side} Pillar`} className="pillar__image" />

        {/* Animated fill will come here */}
        {/* <div className="pillar__fill"></div> */}
      </div>
    </aside>
  );
};

export default Pillar;
