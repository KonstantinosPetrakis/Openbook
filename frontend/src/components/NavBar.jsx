import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts";
import SearchBox from "./SearchBox";
import ProfilePreviewList from "./ProfilePreviewList";
import Loader from "./Loader";
import { searchUser } from "../network";
import "../styles/NavBar.css";

export default function NavBar() {
    const user = useContext(UserContext);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        user.isLoggedIn() && (
            <nav className="transparent navbar">
                <Link to="/">
                    <img className="logo" src="/images/logo.png" alt="logo" />
                </Link>
                {searchActive && (
                    <Loader
                        key={searchQuery}
                        onClick={() => setSearchActive(false)}
                        className="list search-results"
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
