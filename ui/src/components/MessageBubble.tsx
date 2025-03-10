"use client"

import { useState } from "react"
import type { Message } from "@langchain/langgraph-sdk"
import { UserIcon, BotIcon, EditIcon } from "./Icons"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageBubbleProps {
  message: Message
  isLoading?: boolean
}

export function MessageBubble({ message, isLoading = false }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content as string)

  const isHuman = message.type === "human"
  const isAI = message.type === "ai"

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would implement the actual edit functionality
    // using thread.submit with the appropriate checkpoint
    setIsEditing(false)
    // For now, we just update the local state
    message.content = editValue
  }

  return (
    <div className={`flex ${isHuman ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[80%] ${isHuman ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isHuman ? "ml-2" : "mr-2"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${isHuman ? "bg-purple-500" : "bg-pink-500"}`}
          >
            {isHuman ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-5 h-5 text-white" />}
          </div>
        </div>

        {/* Message content */}
        <div
          className={`
          rounded-2xl p-3 shadow-sm
          ${
            isHuman
              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
              : "bg-white border border-purple-100 text-gray-800"
          }
          ${isLoading ? "animate-pulse" : ""}
        `}
        >
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 p-1 text-gray-800 rounded border border-purple-300 outline-none"
                autoFocus
              />
              <button type="submit" className="ml-2 px-2 py-1 bg-purple-500 text-white rounded text-xs">
                Save
              </button>
            </form>
          ) : (
            <div className="whitespace-pre-wrap markdown-content">
              {isAI ? (
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-md font-bold my-1" {...props} />,
                    p: ({ node, ...props }) => <p className="my-1" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
                    li: ({ node, ...props }) => <li className="my-1" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "")
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded my-2"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-gray-100 px-1 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                    table: ({ node, ...props }) => (
                      <table className="border-collapse border border-gray-300 my-2" {...props} />
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                    tbody: ({ node, ...props }) => <tbody {...props} />,
                    tr: ({ node, ...props }) => <tr className="border-b border-gray-300" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-gray-300 px-2 py-1" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-gray-300 px-2 py-1" {...props} />,
                  }}
                >
                  {typeof message.content === "string"
                    ? message.content
                    : Array.isArray(message.content)
                      ? message.content
                          .map((part, i) => (typeof part === "string" ? part : part.type === "text" ? part.text : ""))
                          .join("")
                      : JSON.stringify(message.content)}
                </ReactMarkdown>
              ) : typeof message.content === "string" ? (
                message.content
              ) : Array.isArray(message.content) ? (
                message.content.map((part, i) =>
                  typeof part === "string" ? (
                    <span key={i}>{part}</span>
                  ) : part.type === "text" ? (
                    <span key={i}>{part.text}</span>
                  ) : null,
                )
              ) : (
                JSON.stringify(message.content)
              )}
            </div>
          )}
        </div>

        {/* Edit button for human messages */}
        {isHuman && !isEditing && !isLoading && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-purple-500 ml-2 self-end mb-1"
            aria-label="Edit message"
          >
            <EditIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

