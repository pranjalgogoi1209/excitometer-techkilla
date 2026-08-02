import logo from "../../assets/images/logo.png";

import "./Header.scss";

const Header = ({ result = false }) => {
  return (
    <header className="header">
      <img src={logo} alt="Dulcoflex Logo" className="header__logo" />

      {!result && <h1 className="header__title">EXCITOMETER</h1>}

      {!result && (
        <div className="header__subtitle">
          <span></span>

          <p>LET'S HEAR YOUR ENERGY!</p>

          <span></span>
        </div>
      )}
    </header>
  );
};

export default Header;
