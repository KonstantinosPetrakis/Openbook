import { useEffect, useState } from "react";
import "../styles/FileGallery.css";

export default function FileGallery({ files }) {
    const [filesWithTypes, setFilesWithTypes] = useState([]);
    const [fullScreenIndex, setFullScreenIndex] = useState(-1);
    const picturesAlwaysVisible = 9;

    const closeFullScreen = () => setFullScreenIndex(-1);
    const previousFullScreen = () => setFullScreenIndex((i) => i - (i > 0));
    const nextFullScreen = () =>
        setFullScreenIndex((i) => i + (i < filesWithTypes.length - 1));

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") closeFullScreen();
            if (e.key === "ArrowLeft") previousFullScreen();
            if (e.key === "ArrowRight") nextFullScreen();
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    });

    useEffect(() => {
        (async () => {
            setFilesWithTypes(
                await Promise.all(
                    files.map(async (f) => {
                        const blob = await (await fetch(f)).blob();
                        const type = blob.type.startsWith("image")
                            ? "image"
                            : "video";
                        return {
                            name: f,
                            src: URL.createObjectURL(blob),
                            type,
                        };
                    })
                )
            );
        })();
    }, [files]);

    if (!filesWithTypes) return "";

    if (fullScreenIndex >= 0)
        return (
            <div className="fullscreen-file-gallery">
                <div className="fullscreen-controls">
                    <button
                        className="previous transparent-button"
                        onClick={previousFullScreen}
                        disabled={fullScreenIndex === 0}
                    >
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <div>
                        {`You're viewing file ${fullScreenIndex + 1} of ${
                            files.length
                        }`}
                    </div>
                    <button
                        className="next transparent-button"
                        onClick={nextFullScreen}
                        disabled={fullScreenIndex === filesWithTypes.length - 1}
                    >
                        <i className="bi bi-arrow-right"></i>
                    </button>
                    <button
                        className="exit transparent-button"
                        onClick={closeFullScreen}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>
                <div onClick={closeFullScreen}>
                    {filesWithTypes[fullScreenIndex].type === "image" ? (
                        <img src={filesWithTypes[fullScreenIndex].src} />
                    ) : (
                        <video controls>
                            <source src={filesWithTypes[fullScreenIndex].src} />
                        </video>
                    )}
                </div>
            </div>
        );

    return (
        <ul className="file-gallery">
            {filesWithTypes.slice(0, picturesAlwaysVisible).map((f, i) => (
                <li key={f.name}>
                    <button
                        className="simple-button"
                        onClick={() => setFullScreenIndex(i)}
                    >
                        {f.type === "image" ? (
                            <img src={f.src} />
                        ) : (
                            <video controls>
                                <source src={f.src} />
                            </video>
                        )}
                        {i === picturesAlwaysVisible - 1 &&
                            filesWithTypes.length > picturesAlwaysVisible && (
                                <div className="more">
                                    +
                                    {filesWithTypes.length -
                                        picturesAlwaysVisible}
                                </div>
                            )}
                    </button>
                </li>
            ))}
        </ul>
    );
}
