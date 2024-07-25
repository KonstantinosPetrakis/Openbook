import { useState, useContext, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import Loader from "../components/Loader";
import ChatFriendList from "../components/ChatFriendList";
import MessageList from "../components/MessageList";
import { timeDifference } from "../helpers";
import "../styles/Chat.css";

export default function Chat() {
    const { id } = useParams();
    const user = useContext(UserContext);
    const realTime = useContext(RealTimeContext);
    const [friendListActive, setFriendListActive] = useState(false); // Used for mobile view
    const [chattingUser, setChattingUser] = useState(null);
    const [messageContent, setMessageContent] = useState("");
    const [messageFile, setMessageFile] = useState(null);

    const sendMessage = useCallback(async () => {
        if (!chattingUser || (!messageContent && !messageFile)) return;

        if (
            await user.sendMessage(chattingUser.id, messageContent, messageFile)
        ) {
            realTime.messageCreated({
                id: Math.random().toString(36),
                senderId: user.id,
                receiverId: chattingUser.id,
                content: messageContent,
                file: messageFile ? URL.createObjectURL(messageFile) : null,
                sentAt: new Date().toISOString(),
            });
            setMessageContent("");
            setMessageFile(null);
        }
    }, [realTime, chattingUser, messageContent, messageFile, user]);

    const getMessages = useCallback(
        async (p) => {
            const messages = await user.getMessages(chattingUser.id, p);
            realTime.setUnreadMessageCount(await user.getUnreadMessageCount());
            return messages;
        },
        [chattingUser, realTime, user]
    );

    // Get chatting user when id or user changes
    useEffect(() => {
        (async () => {
            if (id) {
                const u = await user.getUser(id);
                u.lastSeen = timeDifference(new Date(u.lastActive));
                setChattingUser(u);
            }
        })();
    }, [user, id]);

    // Send message on enter
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter") sendMessage();
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [sendMessage]);

    return (
        <div className="chat-wrapper">
            <button
                className="transparent-button friend-list-opener"
                onClick={() => setFriendListActive((s) => !s)}
            >
                <i className="bi bi-person-lines-fill"></i>
            </button>
            <div className="transparent chat">
                <div
                    className={`chat-friend-list-wrapper ${
                        friendListActive ? "active" : ""
                    }`}
                >
                    <Loader
                        Renderer={ChatFriendList}
                        onClick={() => setFriendListActive(false)}
                        DefaultRenderer={() => (
                            <p>
                                You haven't chatted with anyone yet.
                                <br />
                                Make friends and send them a message via their
                                profile!
                            </p>
                        )}
                        fetchFunction={user.getChats}
                    />
                </div>
                <div className="chat-list-wrapper">
                    <div className="chat-list-header">
                        {chattingUser && (
                            <Link to={`/profile/${chattingUser.id}`}>
                                <img
                                    src={chattingUser.profileImage}
                                    alt="Profile image"
                                />
                                <div className="name-date">
                                    <div>
                                        {`${chattingUser.firstName} ${chattingUser.lastName}`}
                                    </div>
                                    <div className="secondary-text">
                                        Last seen: {chattingUser.lastSeen}
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                    <Loader
                        reverse={true}
                        Renderer={MessageList}
                        DefaultRenderer={() =>
                            chattingUser ? (
                                <p>
                                    Send your first message to
                                    {` ${chattingUser.firstName} ${chattingUser.lastName}.`}
                                </p>
                            ) : (
                                <p>
                                    Choose a friend you've previously chatted
                                    with to send a message, or start a new
                                    conversation by visiting their profile.
                                </p>
                            )
                        }
                        fetchFunction={
                            chattingUser ? getMessages : async () => []
                        }
                    />
                    <div className="chat-controls">
                        <input
                            type="text"
                            placeholder="Write a message..."
                            value={messageContent}
                            onInput={(e) => setMessageContent(e.target.value)}
                        />

                        <label>
                            <i className="bi bi-image"></i>
                            {messageFile && (
                                <div title={messageFile.name}> * </div>
                            )}
                            <input
                                accept="image/*,video/*"
                                type="file"
                                onInput={(e) =>
                                    setMessageFile(e.target.files[0])
                                }
                            />
                        </label>
                        <button className="simple-button" onClick={sendMessage}>
                            <i className="bi bi-send"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
