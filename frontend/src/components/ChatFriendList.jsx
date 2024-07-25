import { useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import "../styles/ChatFriendList.css";

/**
 * This component could be improved so it doesn't load again users that it knows from previous chats.
 * I am too lazy to do that right now.
 */
export default function ChatFriendList({ data, onClick, setData }) {
    const { id } = useParams();
    const user = useContext(UserContext);
    const { onNewMessage, offNewMessage, onMessageCreated, offMessageCreated } =
        useContext(RealTimeContext);

    useEffect(() => {
        const onMessageHandler = async (m) => {
            m = { ...m, ...(await user.getUser(m.senderId)) };
            const newChat = {
                attention: true,
                backgroundImage: m.backgroundImage,
                content: m.content ? m.content : "📎 Attachment",
                firstName: m.firstName,
                friendId: m.senderId,
                lastActive: m.lastActive,
                lastName: m.lastName,
                profileImage: m.profileImage,
                sentAt: m.sentAt,
            };

            setData((data) => {
                const newData = data.filter(
                    (c) => c.friendId !== newChat.friendId
                );
                return [newChat, ...newData];
            });
        };

        onNewMessage(onMessageHandler);
        return () => offNewMessage(onMessageHandler);
    }, [user, onNewMessage, offNewMessage, setData]);

    useEffect(() => {
        const onMessageCreatedHandler = async (m) => {
            m = { ...m, ...(await user.getUser(m.receiverId)) };
            const newChat = {
                attention: true,
                backgroundImage: m.backgroundImage,
                content: `You: ${m.content ? m.content : "📎 Attachment"}`,
                firstName: m.firstName,
                friendId: m.receiverId,
                lastActive: m.lastActive,
                lastName: m.lastName,
                profileImage: m.profileImage,
                sentAt: m.sentAt,
            };

            setData((data) => {
                const newData = data.filter(
                    (c) => c.friendId !== newChat.friendId
                );
                return [newChat, ...newData];
            });
        };

        onMessageCreated(onMessageCreatedHandler);
        return () => offMessageCreated(onMessageCreatedHandler);
    }, [user, onMessageCreated, offMessageCreated, setData]);

    return (
        <ul className="chat-friend-list">
            {data.map((c) => (
                <li
                    key={c.friendId}
                    className={`chat-friend ${
                        c.friendId === id ? "active" : ""
                    }`}
                >
                    <Link to={`/chat/${c.friendId}`} onClick={onClick}>
                        <div>
                            <img
                                src={c.profileImage}
                                alt="friend profile image"
                            />
                        </div>
                        <div className="name-message">
                            <div>
                                {c.firstName} {c.lastName}
                            </div>
                            <div className="secondary-text">{c.content}</div>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
