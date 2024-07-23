import Post from "./Post";
import "../styles/PostList.css";

export default function PostList({ data }) {
    return (
        <ul className="post-list">
            {data.map((post) => (
                <li key={post.id}>
                    <Post post={post} />
                </li>
            ))}
        </ul>
    );
}
