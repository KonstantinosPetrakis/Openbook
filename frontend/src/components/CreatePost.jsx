import { useState, useRef, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext, PopUpContext, OffCanvasContext } from "../contexts";
import FileGallery from "./FileGallery";
import "../styles/CreatePost.css";

export default function CreatePost() {
    const [postContent, setPostContent] = useState("");
    const [postFiles, setPostFiles] = useState([]);
    const filesInput = useRef(null);
    const navigate = useNavigate();
    const offCanvasCloseFunc = useContext(OffCanvasContext);
    const popUp = useContext(PopUpContext);
    const user = useContext(UserContext);

    async function createPost(e) {
        e.preventDefault();
        if (!postContent.trim() && !postFiles.length) {
            popUp.show(
                "Warning",
                "Can't create a post.",
                "You need to write something or attach files to create a post."
            );
            return;
        }

        const id = await user.createPost(postContent, postFiles);
        if (id) {
            setPostContent("");
            setPostFiles([]);
            filesInput.current.value = "";
            navigate(`/post/${id}`);
            offCanvasCloseFunc();
        } else
            popUp.show(
                "Error",
                "Can't create a post",
                "The post could not be created. Please try again later."
            );
    }

    const postFilesURLs = useMemo(
        () => postFiles.map((f) => URL.createObjectURL(f)),
        [postFiles]
    );

    return (
        <form className="create-post">
            <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
            ></textarea>
            <br />
            <input
                type="file"
                ref={filesInput}
                onChange={(e) => setPostFiles([...e.target.files])}
                multiple
            />
            <div>
                The files you selected:
                <button
                    className="transparent-button"
                    onClick={(e) => {
                        e.preventDefault();
                        setPostFiles([]);
                        filesInput.current.value = "";
                    }}
                >
                    Clear
                </button>
            </div>
            {!!postFiles.length && <FileGallery files={postFilesURLs} />}
            <br />
            <button className="transparent-button" onClick={createPost}>
                Post
            </button>
        </form>
    );
}
