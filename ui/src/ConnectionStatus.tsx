import { useState, useEffect } from "react";

interface ConnectionStatusProps {
  apiUrl: string;
}

export function ConnectionStatus({ apiUrl }: ConnectionStatusProps) {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to fetch from the API to check if it's available
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          signal: controller.signal,
        }).catch(err => {
          throw new Error(`Failed to connect: ${err.message}`);
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        setStatus("connected");
      } catch (error) {
        console.error("Connection error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    };

    checkConnection();
  }, [apiUrl]);

  if (status === "connected") return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-md shadow-lg ${
      status === "checking" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
    }`}>
      {status === "checking" ? (
        <p>Connecting to LangGraph server...</p>
      ) : (
        <div>
          <p className="font-bold">Connection Error</p>
          <p className="text-sm">{errorMessage || "Could not connect to LangGraph server"}</p>
          <p className="text-sm mt-2">
            Make sure your LangGraph server is running at:
            <br />
            <code className="bg-red-50 px-1 rounded">{apiUrl}</code>
          </p>
        </div>
      )}
    </div>
  );
}
