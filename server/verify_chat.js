const API_URL = "http://localhost:3000/api/chat";
const API_KEY = "YOUR_SECRET_API_KEY";

async function verifyChat() {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY
            },
            body: JSON.stringify({
                message: "Hello, this is a test. Are you working?",
                history: [],
                sessionId: "verify-123"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Success! Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verifyChat();
