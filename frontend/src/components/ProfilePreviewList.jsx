import { Link } from "react-router-dom";
import "../styles/ProfilePreviewList.css";

export default function ProfilePreviewList({ data }) {
    return (
        <ul className="profile-preview-list">
            {data.map((user) => (
                <li key={user.id}>
                    <Link to={`/profile/${user.id}`}>
                        <div>
                            <img
                                src={user.profileImage}
                                alt="profile picture"
                            />
                        </div>
                        <div>
                            {user.firstName} {user.lastName}
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
