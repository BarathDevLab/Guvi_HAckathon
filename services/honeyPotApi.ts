import { HoneyPotResponse, ChatMessage } from "../types";

interface ApiRequest {
  method: string;
  headers: Record<string, string>;
  body: {
    message: string;
    history: ChatMessage[];
    sessionId: string;
  };
}

interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
}

/**
 * PUBLIC REST API CONTROLLER (REAL BACKEND INTEGRATION)
 *
 * Routes incoming webhooks/messages to the Node.js Backend.
 * Strictly enforces API Key security.
 */
export const handleApiRequest = async (
  request: ApiRequest,
): Promise<ApiResponse<HoneyPotResponse>> => {
  // Log the activity to console
  console.group("🔌 calling Backend API");
  console.log("Target: http://localhost:3000/api/chat");
  console.groupEnd();

  // 1. HEADER VALIDATION (Client-side pre-check, though backend handles the real check)
  const providedKey = request.headers["x-api-key"];
  if (!providedKey) {
    return {
      status: 401,
      error: "Unauthorized: Missing 'x-api-key' header.",
    };
  }

  try {
    const API_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/chat";
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": providedKey,
      },
      body: JSON.stringify(request.body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: response.status,
        error: errorData.error || `Server Error: ${response.status}`,
      };
    }

    const data: HoneyPotResponse = await response.json();
    return {
      status: 200,
      data: data,
    };
  } catch (error) {
    console.error("API Network Error:", error);
    return {
      status: 500,
      error: "Network Error: Could not connect to the HoneyPot Backend.",
    };
  }
};
