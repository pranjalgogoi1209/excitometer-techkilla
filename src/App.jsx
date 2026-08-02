import "./App.scss";

import { useState } from "react";

import Home from "./pages/Home/Home";
import SidePanel from "./components/SidePanel/SidePanel";

function App() {
  const [volume, setVolume] = useState(0);

  return (
    <div className="app">
      <aside className="app__left">
        <SidePanel />
      </aside>

      <main className="app__center">
        <Home />
      </main>

      <aside className="app__right">
        <SidePanel />
      </aside>
    </div>
  );
}

export default App;
