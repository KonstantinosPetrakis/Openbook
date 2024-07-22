import { useState, useContext, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserContext, PopUpContext } from "../contexts";
import { timeDifference } from "../helpers";
import FileGallery from "./FileGallery";
import Loader from "./Loader";
import "../styles/Post.css";

export default function Post({ post }) {
    const [liked, setLiked] = useState(post.liked);
    const [commentCount, setCommentCount] = useState(post.comments);
    const [likes, setLikes] = useState(post.likes);
    const [commentsActive, setCommentsActive] = useState(false);
    const [file, setFile] = useState("");
    const [comment, setComment] = useState("");
    const createPopUp = useContext(PopUpContext);
    const user = useContext(UserContext);

    function PostComments({ data, setData }) {
        const handleCommentDelete = async (id) => {
            if (
                confirm("Are you sure you want to delete the comment?") &&
                (await user.deleteComment(id))
            ) {
                createPopUp(
                    "success",
                    "Comment deleted!",
                    "The comment has been successfully deleted."
                );
                setData((d) => d.filter((c) => c.id !== id));
                setCommentCount((c) => c - 1);
            }
        };

        return (
            <ul className="post-comments">
                {data.map((c) => (
                    <li key={c.id}>
                        <Link
                            to={`/profile/${c.author.id}`}
                            className="profile-image-wrapper"
                        >
                            <img
                                src={c.author.profileImage}
                                alt="comment author image"
                            />
                        </Link>
                        <div className="comment-content">
                            <div className="comment-header">
                                <Link to={`/profile/${c.author.id}`}>
                                    <b>{`${c.author.firstName} ${c.author.lastName}`}</b>
                                </Link>
                                <div className="controls">
                                    <span className="secondary-text date">
                                        {timeDifference(
                                            new Date(c.commentedAt)
                                        )}
                                    </span>
                                    {c.author.id === user.id && (
                                        <button
                                            className="simple-button"
                                            onClick={() =>
                                                handleCommentDelete(c.id)
                                            }
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>{c.content}</div>
                            {c.file && (
                                <div>
                                    <FileGallery files={[c.file]} />
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    const handleComment = useCallback(async () => {
        if (!comment && !file) {
            createPopUp(
                "error",
                "Comment cannot be empty!",
                "Please write a comment or attach a file."
            );
            return;
        }

        if (await user.commentPost(post.id, comment, file)) {
            setCommentCount((c) => c + 1);
            setComment("");
            setFile("");
        } else
            createPopUp(
                "error",
                "Failed to comment post!",
                "Please try again later."
            );
    }, [comment, file, user, post, createPopUp]);

    const handleDelete = useCallback(async () => {
        confirm("Are you sure you want to delete the post?") &&
            (await user.deletePost(post.id)) &&
            createPopUp(
                "success",
                "Post deleted!",
                "The post has been successfully deleted."
            );
    }, [user, post, createPopUp]);

    const fetchCommentsFunction = useCallback(
        (p) => user.getPostComments(post.id, p),
        [user, post]
    );

    const handleLike = () => {
        setLiked(!liked);
        setLikes(liked ? likes - 1 : likes + 1);
        user.likePost(post.id);
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") setCommentsActive(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter" && commentsActive) handleComment();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [commentsActive, handleComment]);

    return (
        <div className="transparent post">
            <div className="post-header">
                <Link
                    className="post-author-image"
                    to={`/profile/${post.author.id}`}
                >
                    <img
                        src={post.author.profileImage}
                        alt="post author profile"
                    />
                </Link>
                <div className="name">
                    <Link to={`/profile/${post.author.id}`}>
                        <b>
                            {post.author.firstName} {post.author.lastName}
                        </b>
                    </Link>
                    <div>
                        <span className="secondary-text date">
                            {timeDifference(new Date(post.postedAt))}
                        </span>
                    </div>
                </div>
                <div className="controls">
                    {post.author.id === user.id && (
                        <button
                            className="simple-button"
                            onClick={handleDelete}
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    )}
                </div>
            </div>
            <div className="post-content">{post.content}</div>
            <div className="post-gallery">
                <FileGallery files={post.files} />
                <div
                    className={`post-controls ${
                        post.files.length === 0 ? "no-gallery" : ""
                    }`}
                >
                    <button className="simple-button" onClick={handleLike}>
                        <i
                            className={
                                liked ? "bi bi-heart-fill" : "bi bi-heart"
                            }
                        ></i>
                        {likes}
                    </button>
                    <button
                        className="simple-button"
                        onClick={() => setCommentsActive((c) => !c)}
                    >
                        <i className="bi bi-chat"></i>
                        {commentCount}
                    </button>
                </div>
            </div>
            <div
                className={`post-comments-wrapper ${
                    commentsActive ? "active" : ""
                }`}
            >
                <div className="create-comment">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={comment}
                        onInput={(e) => setComment(e.target.value)}
                    />

                    <label>
                        <i className="bi bi-image"></i>
                        {file && <div title={file.name}> * </div>}
                        <input
                            accept="image/*,video/*"
                            type="file"
                            onInput={(e) => setFile(e.target.files[0])}
                        />
                    </label>
                    <button className="simple-button" onClick={handleComment}>
                        <i className="bi bi-send"></i>
                    </button>
                </div>
                <div className="comment-list-wrapper">
                    <Loader
                        key={commentCount}
                        Renderer={PostComments}
                        fetchFunction={fetchCommentsFunction}
                    />
                </div>
            </div>
        </div>
    );
}
