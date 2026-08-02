import pillar from "../../assets/images/pillar.png";

import "./Pillar.scss";

const Pillar = ({ side }) => {
  return (
    <aside className={`pillar pillar--${side}`}>
      <img src={pillar} alt={`${side} Pillar`} className="pillar__image" />
    </aside>
  );
};

export default Pillar;
