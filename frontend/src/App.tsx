import { useEffect, useState } from "react";
import { testAPI } from "./services/testService";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await testAPI();
                setMessage(data.message);
            } catch (error) {
                console.error(error);
            }
        };

        load();
    }, []);

    return (
        <div>
            <h1>{message}</h1>
        </div>
    );
}

export default App;