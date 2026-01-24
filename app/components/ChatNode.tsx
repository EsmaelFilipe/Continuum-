import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define the data structure for our node
type ChatNodeData = {
  label: string;
  role: 'user' | 'assistant' | 'system';
  onReply: (id: string) => void; // Callback to parent to handle branching
};

const ChatNode = ({ id, data }: NodeProps<ChatNodeData>) => {
  const isUser = data.role === 'user';
  
  return (
    <div className={`shadow-lg rounded-xl border p-4 min-w-[250px] max-w-[400px] 
      ${isUser ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      
      {/* Input Handle (Connect from parent) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />

      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold uppercase text-gray-400">
          {data.role}
        </div>
        
        {/* The Chat Message */}
        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
           {data.label || "..."}
        </div>

        {/* Reply Button - This creates the branch */}
        <button 
          onClick={() => data.onReply!(id)}
          className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded self-start transition"
        >
          + Reply / Branch
        </button>
      </div>

      {/* Output Handle (Connect to children) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

export default memo(ChatNode);