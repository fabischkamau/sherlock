"use client"


import { useState, useRef, useEffect } from "react"
import { useStream } from "@langchain/langgraph-sdk/react"
import type { Message } from "@langchain/langgraph-sdk"
import { MessageBubble } from "./components/MessageBubble"
import { SendIcon, StopIcon, BotIcon } from "./components/Icons"
// Import the MessageDebug component
import { MessageDebug } from "./Messagedebug"
// Import the ConnectionStatus component

// Add the API URL as a constant at the top of the file
const API_URL = "http://127.0.0.1:2024"

export default function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  // Initialize the thread with LangGraph SDK
  const thread = useStream<{ messages: Message[] }>({
    apiUrl: API_URL,
    assistantId: "agent",
    messagesKey: "messages",
    threadId: threadId,
    onThreadId: setThreadId,
    onError: (error) => {
      console.error("LangGraph error:", error)
    },
  })

  // Add this useEffect to log messages for debugging
  useEffect(() => {
    console.log("Current messages:", thread.messages)
  }, [thread.messages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    console.log("Submitting message:", inputValue)

    try {
      thread.submit({
        messages: [{ type: "human", content: inputValue }],
      })
      setInputValue("")
    } catch (error) {
      console.error("Error submitting message:", error)
    }
  }

  // Add the ConnectionStatus component at the top of the App component's return
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-6">

      <header className="flex items-center gap-3 py-4 border-b border-purple-100 mb-4">
        <BotIcon className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
          AI Assistant
        </h1>
      </header>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 rounded-lg">
        {thread.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <BotIcon className="w-16 h-16 text-purple-300 mb-4" />
            <h2 className="text-xl font-semibold text-purple-800 mb-2">Welcome to your AI Assistant</h2>
            <p className="text-purple-600 max-w-md">Ask me anything and I'll do my best to help you!</p>
          </div>
        ) : (
          <div className="space-y-4 p-2 prose">
            {thread.messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isLoading={thread.isLoading && index === thread.messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white rounded-xl shadow-md overflow-hidden border border-purple-100"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-4 outline-none text-gray-700"
          disabled={thread.isLoading}
        />

        <button
          type={thread.isLoading ? "button" : "submit"}
          onClick={() => thread.isLoading && thread.stop()}
          className={`p-4 ${thread.isLoading ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"} text-white transition-colors`}
          aria-label={thread.isLoading ? "Stop" : "Send"}
        >
          {thread.isLoading ? <StopIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
        </button>
      </form>

      {/* Thread ID display (for debugging) */}
      {threadId && <div className="mt-2 text-xs text-gray-500">Thread ID: {threadId}</div>}

      {/* Add the debug component */}
      <MessageDebug messages={thread.messages} isLoading={thread.isLoading} />
    </div>
  )
}

