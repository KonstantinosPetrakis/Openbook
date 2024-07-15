import { Link } from "react-router-dom";
import "../styles/ProfilePreviewList.css";

export default function ProfilePreviewList({ data }) {
    return (
        <ul className="transparent profile-preview-list">
            {data.map((user) => (
                <li key={user.id}>
                    <Link to={`/profile/${user.id}`}>{user.id}</Link>
                </li>
            ))}
        </ul>
    );
}
