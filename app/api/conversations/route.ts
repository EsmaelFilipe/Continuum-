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

// GET /api/conversations - List all conversations for the authenticated user
export async function GET() {
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

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(req: Request) {
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

    const body = await req.json();
    const { title, nodes, edges } = body;

    // Validate input
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: 'Nodes array is required' }, { status: 400 });
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json({ error: 'Edges array is required' }, { status: 400 });
    }

    // 1. Create conversation with user_id
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({ title: title || 'Untitled Conversation', user_id: user.id })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    const conversationId = conversation.id;

    // 2. Insert nodes
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
      // Rollback: delete conversation if nodes fail
      await supabaseAdmin.from('conversations').delete().eq('id', conversationId);
      console.error('Error inserting nodes:', nodesError);
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    // 3. Insert edges (if any)
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
        // Rollback: delete conversation and nodes if edges fail
        await supabaseAdmin.from('conversations').delete().eq('id', conversationId);
        console.error('Error inserting edges:', edgesError);
        return NextResponse.json({ error: edgesError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      conversation: {
        id: conversationId,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

