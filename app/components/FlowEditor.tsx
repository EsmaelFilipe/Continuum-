"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ChatNode from './ChatNode';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Register custom node types
const nodeTypes = { chatNode: ChatNode };

type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export default function FlowEditor() {
  const { user, signOut } = useAuth();

  const getInitialNodes = (): Node[] => {
    const userName = user?.email?.split('@')[0] || 'there';
    return [
      {
        id: 'root',
        type: 'chatNode',
        position: { x: 250, y: 50 },
        data: { 
          label: `Hello ${userName}! I am Continuum, your infinite canvas AI. Start a conversation.`, 
          role: 'system' 
        },
      },
    ];
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());


 
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // REFS: We need these to access the latest state inside async functions
  // without getting stuck in "stale closures" (old versions of variables).
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // ------------------------------------------------------------------
  // 1. HELPER: Build Chat History by traversing up the tree
  // ------------------------------------------------------------------
  const getHistory = (startNodeId: string) => {
    const allNodes = nodesRef.current;
    const allEdges = edgesRef.current;
    
    let history = [];
    let currentNode = allNodes.find((n) => n.id === startNodeId);

    while (currentNode) {
      // Add this message to the front of the array
      history.unshift({
        role: currentNode.data.role,
        content: currentNode.data.label,
      });

      // FIX: Capture the node in a const to satisfy TypeScript
      const nodeToCheck = currentNode;
      
      // Find the edge that connects *to* this node (the parent)
      const parentEdge = allEdges.find((e) => e.target === nodeToCheck.id);
      
      if (!parentEdge) break; // We reached the root

      // Move up to the parent node
      currentNode = allNodes.find((n) => n.id === parentEdge.source);
    }
    
    return history;
  };

  // ------------------------------------------------------------------
  // 2. API: Send history to backend and update the AI Node
  // ------------------------------------------------------------------
  const fetchAIResponse = async (userNodeId: string, aiNodeId: string) => {
    try {
      // A. Get the full context for this specific branch
      // Note: We pass userNodeId because that is the last "completed" message
      const history = getHistory(userNodeId);

      // B. Send to your API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ reply: `Server error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.reply || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // C. Update the AI Node with the real response
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === aiNodeId) {
            return {
              ...node,
              data: { ...node.data, label: data.reply }, // Update text
            };
          }
          return node;
        })
      );
    } catch (error) {
      console.error("Error talking to AI:", error);
      // Update node to show error message with details
      const errorMessage = error instanceof Error ? error.message : "Could not fetch response.";
      setNodes((nds) =>
        nds.map((n) => 
          n.id === aiNodeId ? { ...n, data: { ...n.data, label: `Error: ${errorMessage}` } } : n
        )
      );
    }
  };

  // ------------------------------------------------------------------
  // 3. EVENT: Handle Manual Connection
  // ------------------------------------------------------------------
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ------------------------------------------------------------------
  // 4. EVENT: Handle "Reply" Button Click (Logic Center)
  // ------------------------------------------------------------------
  const handleReply = useCallback((parentId: string) => {
    const parentNode = nodesRef.current.find((n) => n.id === parentId);
    if (!parentNode) return;

    // A. Get User Input
    const userText = window.prompt("Enter your message:");
    if (!userText) return;

    const timestamp = Date.now();
    const userNodeId = `node-user-${timestamp}`;
    const aiNodeId = `node-ai-${timestamp}`;
    
    // Basic layout math (place below parent)
    const spacingY = 200;
    const randomOffsetX = Math.random() * 100 - 50; 

    // B. Create User Node
    const newUserNode: Node = {
      id: userNodeId,
      type: 'chatNode',
      position: { 
        x: parentNode.position.x + randomOffsetX, 
        y: parentNode.position.y + spacingY 
      },
      data: { label: userText, role: 'user', onReply: handleReply },
    };

    // C. Create AI Node (Placeholder state)
    const newAiNode: Node = {
      id: aiNodeId,
      type: 'chatNode',
      position: { 
        x: parentNode.position.x + randomOffsetX, 
        y: parentNode.position.y + (spacingY * 2) 
      },
      data: { label: 'Thinking...', role: 'assistant', onReply: handleReply },
    };

    // D. Connect them up
    const edgeToUser: Edge = { id: `e-${parentId}-${userNodeId}`, source: parentId, target: userNodeId };
    const edgeToAi: Edge = { id: `e-${userNodeId}-${aiNodeId}`, source: userNodeId, target: aiNodeId };

    // E. Update State immediately so they appear on canvas
    setNodes((nds) => [...nds, newUserNode, newAiNode]);
    setEdges((eds) => [...eds, edgeToUser, edgeToAi]);

    // F. Trigger the API call (Allow state to settle slightly 0ms timeout)
    setTimeout(() => {
      fetchAIResponse(userNodeId, aiNodeId);
    }, 0);

  }, [setNodes, setEdges]);

  // ------------------------------------------------------------------
  // 5. INIT: Pass the callback to initial nodes
  // ------------------------------------------------------------------
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, onReply: handleReply },
      }))
    );
  }, [handleReply, setNodes]);

  // ------------------------------------------------------------------
  // 6. SAVE: Save current conversation
  // ------------------------------------------------------------------
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      // Get title from first system message or prompt
      const systemNode = currentNodes.find(n => n.data.role === 'system');
      const title = systemNode?.data.label.substring(0, 50) || 'Untitled Conversation';

      const url = currentConversationId 
        ? `/api/conversations/${currentConversationId}`
        : '/api/conversations';
      
      const method = currentConversationId ? 'PUT' : 'POST';

      // Get the session token to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          title,
          nodes: currentNodes,
          edges: currentEdges,
        }),
      });

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to save conversation (${response.status})`;
          console.error('Save error:', errorMessage, errorData);
          throw new Error(errorMessage);
        } else {
          // Response is HTML (error page), get text and show status
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          throw new Error(`Server error (${response.status}): ${response.statusText}. Check server logs.`);
        }
      }

      const data = await response.json();
      setCurrentConversationId(data.conversation.id);
      alert('Conversation saved successfully!');
    } catch (error) {
      console.error('Error saving conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving: ${errorMessage}\n\nCheck the browser console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 7. LOAD: Load conversation list
  // ------------------------------------------------------------------
  const handleLoadClick = async () => {
    try {
      setIsLoading(true);
      
      // Get the session token to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to load conversations');
        return;
      }

      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        // Check if it's an auth error
        if (response.status === 401) {
          alert('Please sign in to load conversations');
          return;
        }
        // For other errors, try to get error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load conversations');
      }
      
      const data = await response.json();
      const conversationsList = data.conversations || [];
      setConversations(conversationsList);
      setShowLoadDialog(true);
      
      // If no conversations, this is normal for new users - the dialog will show a friendly message
    } catch (error) {
      console.error('Error loading conversations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error loading conversations: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 8. LOAD: Load specific conversation
  // ------------------------------------------------------------------
  const handleLoadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      
      // Get the session token to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to load conversations');
        return;
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load conversation');
      
      const data = await response.json();
      
      // Transform nodes to include onReply callback
      const loadedNodes = data.nodes.map((node: Node) => ({
        ...node,
        data: {
          ...node.data,
          onReply: handleReply,
        },
      }));

      setNodes(loadedNodes);
      setEdges(data.edges);
      setCurrentConversationId(conversationId);
      setShowLoadDialog(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Error loading conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 9. NEW: Start new conversation
  // ------------------------------------------------------------------
  const handleNew = () => {
    if (confirm('Start a new conversation? Unsaved changes will be lost.')) {
      setNodes(getInitialNodes);
      setEdges([]);
      setCurrentConversationId(null);
    }
  };

  // ------------------------------------------------------------------
  // 10. SIGN OUT: Handle sign out
  // ------------------------------------------------------------------
  const handleSignOut = async () => {
    try {
      await signOut();
      // The auth state change will automatically redirect to login via the page component
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-50 relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium"
        >
          New
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isLoading ? 'Saving...' : currentConversationId ? 'Save' : 'Save New'}
        </button>
        <button
          onClick={handleLoadClick}
          disabled={isLoading}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Load
        </button>
        <div className="ml-4 flex items-center gap-2 text-sm text-gray-600">
          <span>{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Load Conversation</h2>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No saved conversations yet.</p>
                <p className="text-sm text-gray-400">
                  Create a conversation and click "Save New" to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLoadConversation(conv.id)}
                  >
                    <div className="font-medium">{conv.title || 'Untitled Conversation'}</div>
                    <div className="text-sm text-gray-500">
                      Updated: {new Date(conv.updated_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}