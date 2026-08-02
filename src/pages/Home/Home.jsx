import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";
import Wave from "../../components/Wave/Wave";
import Mic from "../../components/Mic/Mic";

import "./Home.scss";

const Home = () => {
  return (
    <div className="home">
      <Header />

      <div className="content">
        <Pillar side="left" />

        <Meter />

        <Pillar side="right" />
      </div>

      <div className="bottom">
        <Wave />

        <Mic />

        <Wave />
      </div>
    </div>
  );
};

export default Home;
