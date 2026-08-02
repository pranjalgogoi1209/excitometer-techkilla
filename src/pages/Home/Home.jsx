import Header from "../../components/Header/Header";
import Meter from "../../components/Meter/Meter";
import Pillar from "../../components/Pillar/Pillar";

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
    </div>
  );
};

export default Home;
