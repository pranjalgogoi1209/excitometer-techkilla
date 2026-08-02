import Header from "./../../components/Header";
import Header from "./../../components/Pillar";
import Header from "./../../components/Meter";
import Header from "./../../components/Wave";
import Header from "./../../components/Mic";

const Home = () => {
  return (
    <>
      <Header />

      <main>
        <Pillar />

        <Meter />

        <Pillar />
      </main>

      <Wave />

      <Mic />
    </>
  );
};

export default Home;
