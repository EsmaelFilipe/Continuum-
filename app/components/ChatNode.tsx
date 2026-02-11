"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "reactflow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Define the data structure for our node
type ChatNodeData = {
  label: string;
  role: "user" | "assistant" | "system";
  onReply?: (id: string) => void;
  width?: number;
  height?: number;
};

const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ inline, className, children }) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const value = String(children).replace(/\n$/, "");
  if (inline) {
    return <code className="px-1 py-[0.08rem] rounded bg-gray-100 text-sm">{value}</code>;
  }
  return (
    <div className="rounded overflow-hidden my-2">
      <SyntaxHighlighter language={language} style={atomDark} wrapLongLines>
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatNode = ({ id, data, selected }: NodeProps<ChatNodeData>) => {
  const isUser = data.role === "user";
  const content = data.label ?? "...";
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <div
      style={{
        width: data.width ? `${data.width}px` : 'auto',
        height: isMinimized ? '40px' : 'auto', // Adjust height when minimized
        minWidth: 150,
        minHeight: 60,
        overflow: 'hidden',
        transition: 'height 0.3s ease', // Smooth transition for height
      }}
      className={`relative shadow-lg rounded-xl border p-4 break-words
        ${isUser ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <button onClick={toggleMinimize} className="text-xs bg-gray-200 rounded p-1">
          {isMinimized ? '🔼' : '🔽'} {/* Minimize/Maximize icon */}
        </button>
      </div>

      {/* NodeResizer from reactflow — visible only when node is selected */}
      <NodeResizer color="#f9f5f7ff" isVisible={!!selected} minWidth={100} minHeight={30} />

      {/* Input Handle (Connect from parent) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />

      <div className={`flex flex-col gap-2 ${isMinimized ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'}`}>
        <div className="text-xs font-bold uppercase text-gray-400">{data.role}</div>

        <div className="text-sm text-gray-800 leading-relaxed">
          {/* Use markdown renderer with code+math support.
              The AI should output fenced code blocks (```lang ...```),
              inline math $...$ and block math $$...$$ for proper rendering. */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code: ({ inline, className, children }: any) => (
                <CodeBlock inline={inline} className={className}>
                  {children}
                </CodeBlock>
              ),
              // simple styling for paragraphs & links (optional)
              p: ({ children }) => <p className="mb-1">{children}</p>,
              a: ({ href, children }) => (
                <a href={href} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <div className="flex gap-2 mt-2">
          {/* Reply Button - This creates the branch */}
          <button
            onClick={() => data.onReply?.(id)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded self-start transition"
          >
            + Reply / Branch
          </button>
        </div>
      </div>

      {/* Output Handle (Connect to children) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

export default memo(ChatNode);