import { Link } from "react-router-dom";
import { timeDifference } from "../helpers";
import FileGallery from "./FileGallery";
import "../styles/Post.css";

export default function Post({ post }) {
    return (
        <div className="transparent post">
            <Link className="post-header" to={`/profile/${post.author.id}`}>
                <div className="post-image">
                    <img src={post.author.profileImage} alt="author image" />
                </div>
                <div className="post-info">
                    <div className="name">
                        <b>
                            {`${post.author.firstName} ${post.author.lastName}`}
                        </b>
                    </div>
                    <div className="secondary-text date">
                        {timeDifference(new Date(post.postedAt))}
                    </div>
                </div>
            </Link>
            <div className="post-content">{post.content}</div>
            <div className="post-gallery">
                <FileGallery files={post.files} />
            </div>
            <div
                className={`post-controls ${
                    post.files.length === 0 ? "no-gallery" : ""
                }`}
            >
                <button className="simple-button">
                    <i className="bi bi-heart"></i>
                    {post.likes}
                </button>
                <button className="simple-button">
                    <i className="bi bi-chat"></i>
                    {post.comments}
                </button>
            </div>
            <div className="post-comments"></div>
        </div>
    );
}
