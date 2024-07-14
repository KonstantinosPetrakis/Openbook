import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/User";
import SearchBox from "./SearchBox";
import "../styles/NavBar.css";

export default function NavBar() {
    const user = useContext(UserContext);

    return (
        user.isLoggedIn() && (
            <nav className="transparent navbar">
                <Link to="/">
                    <img className="logo" src="/images/logo.png" alt="logo" />
                </Link>
                <SearchBox />
                <button className="transparent-button" onClick={() => user.logout()}>
                    <i className="bi bi-box-arrow-right"></i>
                </button>
            </nav>
        )
    );
}
