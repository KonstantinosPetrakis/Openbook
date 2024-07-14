import { useState } from "react";
import "../styles/SearchBox.css";

export default function SearchBox() {
    const [active, setActive] = useState(false);

    return (
        <div className={`search-box ${active ? "active" : ""}`}>
            <input type="text" placeholder="Search someone..." tabIndex={active ? 0 : -1}/>
            <button className="transparent-button" onClick={() => setActive(!active)}>
                <i className="bi bi-search"></i>
            </button>
        </div>
    );
}
