import { Link } from "react-router-dom";
import "../styles/ChatFriendList.css";

export default function ChatFriendList({ data }) {
    return (
        <ul className="chat-friend-list">
            {data.map((c) => (
                <li key={c.friendId} className="chat-friend">
                    {c.firstName} {c.lastName}
                </li>
            ))}
        </ul>
    );
}
