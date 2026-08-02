import logo from "../../assets/images/logo.png";

import "./Header.scss";

const Header = ({ showResult = false }) => {
  return (
    <header className="header">
      <img src={logo} alt="Dulcoflex Logo" className="header__logo" />

      {!showResult && <h1 className="header__title">EXCITOMETER</h1>}

      {!showResult && (
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
