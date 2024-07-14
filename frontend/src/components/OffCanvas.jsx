import "../styles/OffCanvas.css";

export default function OffCanvas({ title, children, open, onClose }) {
    return (
        <div className={`off-canvas ${open ? "open" : ""}`}>
            <div className="off-canvas-header">
                <h3> {title} </h3>
                <button className="simple-button" onClick={onClose}>
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>
            <div className="off-canvas-content">{children}</div>
        </div>
    );
}
