"use client"

import { useState } from "react"
import type { Message } from "@langchain/langgraph-sdk"

interface MessageDebugProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageDebug({ messages, isLoading }: MessageDebugProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-gray-800 text-white px-3 py-1 rounded-t-md text-xs">
        {isOpen ? "Hide" : "Debug"} ({messages.length})
      </button>

      {isOpen && (
        <div className="bg-gray-800 text-white p-3 rounded-md max-w-md max-h-96 overflow-auto text-xs">
          <div className="mb-2">
            <span className="font-bold">Status:</span> {isLoading ? "Loading..." : "Idle"}
          </div>
          <div className="mb-2">
            <span className="font-bold">Messages:</span> {messages.length}
          </div>
          <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(messages, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

