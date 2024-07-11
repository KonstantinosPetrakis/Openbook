import { useState } from "react";

import { PopUpContext } from "../contexts/PopUp";

export default function PopUpProvider({children}) {
    const [popUp, setPopUp] = useState(null);

    function createPopUp(type, title, message) {
        setPopUp(
            <div className={`transparent pop-up ${type}`}>
                <div className="header">
                    <h2>{title}</h2>
                    <button onClick={() => setPopUp(null)}> 
                        <i className="bi bi-x"></i>
                    </button>
                </div>
                <p>{message}</p>
            </div>
        );

        setTimeout(() => {
            setPopUp(null);
        }, 5000);
    }

    return (
        <PopUpContext.Provider value={createPopUp}>
            {children}
            {popUp && popUp}
        </PopUpContext.Provider>
    );
}