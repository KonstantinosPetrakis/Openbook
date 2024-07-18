import { OffCanvasContext } from "../contexts";
import "../styles/OffCanvas.css";

export default function OffCanvas({ title, children, open, closeFunc }) {
    return (
        <OffCanvasContext.Provider value={closeFunc}>
            <div className={`off-canvas ${open ? "open" : ""}`}>
                <div className="off-canvas-header">
                    <h3> {title} </h3>
                    <button className="simple-button" onClick={closeFunc}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="off-canvas-content">{children}</div>
            </div>
        </OffCanvasContext.Provider>
    );
}
