import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";

import "./Navigation.css";

function Navigation() {
  return (
    <ul className="nav-list">
      <li>
        <NavLink to="/" className="nav-button">Home</NavLink>
      </li>
      <li>
        <NavLink to="/main" className="nav-button">BOOMBOX</NavLink>
      </li>
      <li>
        <ProfileButton className="nav-button" />
      </li>
    </ul>
  );
}

export default Navigation;
