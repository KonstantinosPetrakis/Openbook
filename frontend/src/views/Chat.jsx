import { useState, useContext, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import Loader from "../components/Loader";
import ChatFriendList from "../components/ChatFriendList";
import MessageList from "../components/MessageList";
import { timeDifference } from "../helpers";
import "../styles/Chat.css";

/**
 * That's the most weak point of the application. 
 * The backend sends only an alert that a new message has come, 
 * but doesn't send the message itself.
 * Additionally, the message list state is controlled by the loader
 * component, but messages are sent from a parent of the loader, so
 * there's no way the loader gets the new message.
 * Currently a brute force ultra slow non production ready solution is 
 * implemented, where the loader is forced to reload by changing the 
 * key of the loader component.
 * A more elegant solution that could be implemented is the following:
 * 1. Move the message creation to the message-list component 
 * (child of loader), and when a new message is sent update the loader
 * via the setData callback.
 * 2. Make the server send the message itself, not just an alert and
 *  update message-list to listen to that broadcast and update the 
 * loader via the setData callback if the message is for the current chat.
 * For the friend-list a more complex solution is needed to sort the already existent 
 * friend-list to include new data.
 */
export default function Chat() {
    const { id } = useParams();
    const user = useContext(UserContext);
    const { onNewMessage, offNewMessage } = useContext(RealTimeContext);
    const [reloadSwitch, setReloadSwitch] = useState(false);
    const [chattingUser, setChattingUser] = useState(null);
    const [messageContent, setMessageContent] = useState("");
    const [messageFile, setMessageFile] = useState(null);

    const sendMessage = useCallback(async () => {
        if (!chattingUser || (!messageContent && !messageFile)) return;

        if (
            await user.sendMessage(chattingUser.id, messageContent, messageFile)
        ) {
            setMessageContent("");
            setMessageFile(null);
            setReloadSwitch((s) => !s);
        }
    }, [chattingUser, messageContent, messageFile, user]);

    useEffect(() => {
        (async () => {
            if (id) {
                const u = await user.getUser(id);
                u.lastSeen = timeDifference(new Date(u.lastActive));
                setChattingUser(u);
            }
        })();
    }, [user, id]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter") sendMessage();
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [sendMessage]);

    useEffect(() => {
        const onNewMessageHandler = () => setReloadSwitch((s) => !s);
        onNewMessage(onNewMessageHandler);
        return () => offNewMessage(onNewMessageHandler);
    }, [onNewMessage, offNewMessage]);

    return (
        <div className="transparent chat">
            <div className="chat-friend-list-wrapper">
                <Loader
                    key={reloadSwitch}
                    Renderer={ChatFriendList}
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
                    key={reloadSwitch}
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
                                Choose a friend you've previously chatted with
                                to send a message, or start a new conversation
                                by visiting their profile.
                            </p>
                        )
                    }
                    fetchFunction={
                        chattingUser
                            ? (p) => user.getMessages(chattingUser.id, p)
                            : () => []
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
                        {messageFile && <div title={messageFile.name}> * </div>}
                        <input
                            accept="image/*,video/*"
                            type="file"
                            onInput={(e) => setMessageFile(e.target.files[0])}
                        />
                    </label>
                    <button className="simple-button" onClick={sendMessage}>
                        <i className="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
