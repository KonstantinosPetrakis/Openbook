import { useRef, useEffect } from "react";
import "../styles/ExitButton.css";

export function ExitButton({ onClick, duration }) {
    const exitButton = useRef(null);

    useEffect(() => {
        exitButton.current.style.setProperty("--duration", `${duration}ms`)
    }, [duration]);

    return (
        <button className="exit-button-container simple-button">
            <i className="bi bi-x-lg"></i>
            <div className="exit-button" onClick={onClick} ref={exitButton}>
                <div className="halfclip">
                    <div className="halfcircle clipped"></div>
                </div>
                <div className="halfcircle fixed"></div>
            </div>
        </button>
    );
}
