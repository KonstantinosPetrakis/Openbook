import { useState, useRef } from "react";
import OffCanvas from "./OffCanvas";
import ReactCrop from "react-image-crop";
import "../styles/UploadedImage.css";

export default function UploadedImage({ src, setSrc, className, aspectRatio, circular = false}) {
    const [file, setFile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [crop, setCrop] = useState();
    const croppingImage = useRef();

    const handleUpload = (e) => {
        setFile(URL.createObjectURL(e.target.files[0]));
        setEditing(true);
    };

    const handleDone = async () => {
        setEditing(false);

        const image = croppingImage.current;
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width;
        canvas.height = crop.height;

        canvas
            .getContext("2d")
            .drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
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
                closeFunc={handleDone}
            >
                <div className="image-editor">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        aspect={aspectRatio}
                        circularCrop={circular}
                    >
                        <img
                            className="cropping-image"
                            src={file}
                            ref={croppingImage}
                        />
                    </ReactCrop>
                    <button className="transparent-button" onClick={handleDone}>
                        Done
                    </button>
                </div>
            </OffCanvas>
        </>
    );
}
