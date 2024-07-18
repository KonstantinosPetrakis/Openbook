import { useState } from "react";
import { ExitButton } from "./ExitButton";
import { PopUpContext } from "../contexts";
import "../styles/PopUpProvider.css";

export default function PopUpProvider({ children }) {
    const [popUp, setPopUp] = useState(null);
    const duration = 3000;

    function createPopUp(type, title, message) {
        setPopUp(
            <div className={`pop-up ${type}`}>
                <div className="header">
                    <h2>{title}</h2>
                    <ExitButton
                        onClick={() => setPopUp(null)}
                        duration={duration}
                    >
                        <i className="bi bi-x"></i>
                    </ExitButton>
                </div>
                <p>{message}</p>
            </div>
        );

        setTimeout(() => {
            setPopUp(null);
        }, duration - 500);
    }

    return (
        <PopUpContext.Provider value={createPopUp}>
            {children}
            {popUp && popUp}
        </PopUpContext.Provider>
    );
}
