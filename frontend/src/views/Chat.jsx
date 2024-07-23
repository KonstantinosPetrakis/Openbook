import { useParams } from "react-router-dom";

export default function Chat() {
    const { id } = useParams();

    return (
        <div className="chat">
            <ul className="chat-list">

            </ul>
            <div className="current-chat">
                
            </div>
        </div>
    );
}
