import { useState } from "react";
import OffCanvas from "./OffCanvas";
import ReactCrop from "react-image-crop";
import "../styles/UploadedImage.css";

export default function UploadedImage({ src, setSrc, className, aspectRatio }) {
    const [file, setFile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [crop, setCrop] = useState();

    const handleUpload = (e) => {
        setFile(URL.createObjectURL(e.target.files[0]));
        setEditing(true);
    };

    const handleDone = () => {
        setEditing(false);

        const image = new Image();
        image.src = file;

        const canvas = document.createElement("canvas");
        canvas.width = crop.width;
        canvas.height = crop.height;

        canvas
            .getContext("2d")
            .drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );
        setSrc(canvas.toDataURL("image/png"));
    };

    return (
        <>
            <div className={`uploaded-image ${className}`}>
                <img src={src} />
                <label className="transparent">
                    <i className="bi bi-upload"></i>
                    <input
                        type="file"
                        accept="image/*"
                        onInput={handleUpload}
                    />
                </label>
            </div>
            <OffCanvas
                title="Crop image to fit desired ratio..."
                open={editing}
                onClose={handleDone}
            >
                <div className="image-editor">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        aspect={aspectRatio}
                    >
                        <img className="cropping-image" src={file} />
                    </ReactCrop>
                    <button className="transparent-button" onClick={handleDone}>
                        Done
                    </button>
                </div>
            </OffCanvas>
        </>
    );
}
