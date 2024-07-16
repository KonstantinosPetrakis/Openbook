import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/User";
import SearchBox from "./SearchBox";
import ProfilePreviewList from "./ProfilePreviewList";
import Loader from "./Loader";
import { searchUser } from "../network";
import "../styles/NavBar.css";

export default function NavBar() {
    const location = useLocation();
    const user = useContext(UserContext);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (location.pathname.includes("profile")) setSearchActive(false);
    }, [location]);

    return (
        user.isLoggedIn() && (
            <nav className="transparent navbar">
                <Link to="/">
                    <img className="logo" src="/images/logo.png" alt="logo" />
                </Link>
                {searchActive && (
                    <Loader
                        key={searchQuery}
                        className="search-results"
                        Renderer={ProfilePreviewList}
                        fetchFunction={(p) => searchUser(searchQuery, p)}
                    />
                )}
                <SearchBox
                    search={searchQuery}
                    setSearch={setSearchQuery}
                    active={searchActive}
                    setActive={setSearchActive}
                />
                <button
                    className="transparent-button"
                    onClick={() => user.logout()}
                >
                    <i className="bi bi-box-arrow-right"></i>
                </button>
            </nav>
        )
    );
}
