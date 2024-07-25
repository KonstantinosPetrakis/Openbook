import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import { timeDifference } from "../helpers";
import FileGallery from "./FileGallery";
import "../styles/MessageList.css";

export default function MessageList({ data, setData }) {
    const user = useContext(UserContext);
    const { onMessageCreated, offMessageCreated, onNewMessage, offNewMessage } =
        useContext(RealTimeContext);
    const { id } = useParams();

    useEffect(() => {
        const onNewMessageHandler = (m) => {
            if (m.senderId === id) setData((data) => [m, ...data]);
        };

        onNewMessage(onNewMessageHandler);
        return () => offNewMessage(onNewMessageHandler);
    }, [setData, id, onNewMessage, offNewMessage]);

    useEffect(() => {
        const onMessageCreatedHandler = (m) => {
            if (m.receiverId === id) setData((data) => [m, ...data]);
        };

        onMessageCreated(onMessageCreatedHandler);
        return () => offMessageCreated(onMessageCreatedHandler);
    }, [setData, id, onMessageCreated, offMessageCreated]);

    return (
        <ul className="message-list">
            {data.map((m) => (
                <li
                    key={m.id}
                    className={`transparent message ${
                        m.senderId === user.id ? "from-me" : ""
                    }`}
                    title={`Sent ${timeDifference(new Date(m.sentAt))}`}
                >
                    {m.content}
                    {m.file && <FileGallery files={[m.file]} />}
                </li>
            ))}
        </ul>
    );
}
