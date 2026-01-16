import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

// Helper to check Supabase configuration
function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return {
      error: 'Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.',
    };
  }
  return null;
}

// GET /api/conversations/[id] - Get a specific conversation with nodes and edges
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configError = checkSupabaseConfig();
    if (configError) {
      return NextResponse.json({ error: configError.error }, { status: 500 });
    }

    // Get authenticated user
    const { user, error: authError } = await getUserFromRequest();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // 1. Get conversation (verify ownership)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Get nodes
    const { data: nodes, error: nodesError } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    // 3. Get edges
    const { data: edges, error: edgesError } = await supabaseAdmin
      .from('edges')
      .select('*')
      .eq('conversation_id', conversationId);

    if (edgesError) {
      console.error('Error fetching edges:', edgesError);
      return NextResponse.json({ error: edgesError.message }, { status: 500 });
    }

    // 4. Transform to ReactFlow format
    const reactFlowNodes = (nodes || []).map((node: any) => ({
      id: node.id,
      type: 'chatNode',
      position: { x: node.position_x, y: node.position_y },
      data: {
        label: node.label,
        role: node.role,
      },
    }));

    const reactFlowEdges = (edges || []).map((edge: any) => ({
      id: edge.id,
      source: edge.source_node_id,
      target: edge.target_node_id,
    }));

    return NextResponse.json({
      conversation,
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/conversations/[id] - Update a conversation (save nodes/edges)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configError = checkSupabaseConfig();
    if (configError) {
      return NextResponse.json({ error: configError.error }, { status: 500 });
    }

    // Get authenticated user
    const { user, error: authError } = await getUserFromRequest();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await req.json();
    const { title, nodes, edges } = body;

    // Validate input
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: 'Nodes array is required' }, { status: 400 });
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json({ error: 'Edges array is required' }, { status: 400 });
    }

    // 1. Check if conversation exists and belongs to user
    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (!existingConv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Update conversation title if provided
    if (title !== undefined) {
      await supabaseAdmin
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
    }

    // 3. Delete existing nodes and edges (cascade will handle edges, but we'll be explicit)
    await supabaseAdmin.from('edges').delete().eq('conversation_id', conversationId);
    await supabaseAdmin.from('nodes').delete().eq('conversation_id', conversationId);

    // 4. Insert new nodes
    const nodesToInsert = nodes.map((node: any) => ({
      id: node.id,
      conversation_id: conversationId,
      role: node.data.role,
      label: node.data.label,
      position_x: node.position.x,
      position_y: node.position.y,
    }));

    const { error: nodesError } = await supabaseAdmin
      .from('nodes')
      .insert(nodesToInsert);

    if (nodesError) {
      console.error('Error updating nodes:', nodesError);
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    // 5. Insert new edges
    if (edges.length > 0) {
      const edgesToInsert = edges.map((edge: any) => ({
        id: edge.id,
        conversation_id: conversationId,
        source_node_id: edge.source,
        target_node_id: edge.target,
      }));

      const { error: edgesError } = await supabaseAdmin
        .from('edges')
        .insert(edgesToInsert);

      if (edgesError) {
        console.error('Error updating edges:', edgesError);
        return NextResponse.json({ error: edgesError.message }, { status: 500 });
      }
    }

    // 6. Get updated conversation
    const { data: updatedConv } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    return NextResponse.json({ conversation: updatedConv });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configError = checkSupabaseConfig();
    if (configError) {
      return NextResponse.json({ error: configError.error }, { status: 500 });
    }

    // Get authenticated user
    const { user, error: authError } = await getUserFromRequest();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

