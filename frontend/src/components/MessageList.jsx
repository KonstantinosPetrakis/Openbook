import { useContext } from "react";
import { UserContext } from "../contexts";
import { timeDifference } from "../helpers";
import FileGallery from "./FileGallery";
import "../styles/MessageList.css";

export default function MessageList({ data }) {
    const user = useContext(UserContext);
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
                    {m.file &&  <FileGallery files={[m.file]} />}
                </li>
            ))}
        </ul>
    );
}
