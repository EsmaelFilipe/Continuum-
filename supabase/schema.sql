-- Supabase Database Schema for Infinite Chat
-- Run this in your Supabase SQL Editor

-- 1. Conversations table (one tree = one conversation)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nodes table (your chat nodes)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  label TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, conversation_id)
);

-- 3. Edges table (connections between nodes)
CREATE TABLE IF NOT EXISTS edges (
  id TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, conversation_id),
  FOREIGN KEY (source_node_id, conversation_id) REFERENCES nodes(id, conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id, conversation_id) REFERENCES nodes(id, conversation_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_conversation ON nodes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_edges_conversation ON edges(conversation_id);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_node_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_node_id, conversation_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

