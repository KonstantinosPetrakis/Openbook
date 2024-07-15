import { useState, useRef } from "react";
import { debounce } from "../helpers";
import "../styles/SearchBox.css";

/**
 * The SearchBox component updates its parent component with the search query after a delay.
 * This leads parent to can't properly set the search value in the input field anytime, but only initialize it.
 * Activating 2 way binding would glitch the component, making it display the correct value only after waiting the debounce time.
 * This happens because SearchBox uses a local state to store the search query, which is not in sync with the parent's state until the debounce time passes.
 */
export default function SearchBox({ search, setSearch, active, setActive }) {
    const [localSearch, setLocalSearch] = useState(search);
    const debouncedSetSearch = useRef(debounce(setSearch, 500)).current;

    function updateSearch(v) {
        setLocalSearch(v);
        debouncedSetSearch(v);
    }

    return (
        <div className={`search-box ${active ? "active" : ""}`}>
            <input
                type="text"
                placeholder="Search someone..."
                tabIndex={active ? 0 : -1}
                value={localSearch}
                onInput={(e) => updateSearch(e.target.value)}
            />
            <button
                className="transparent-button"
                onClick={() => setActive(!active)}
            >
                <i className="bi bi-search"></i>
            </button>
        </div>
    );
}
