# Setup Guide for Infinite Chat with Supabase

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: infinite-chat (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## 3. Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll need:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## 4. Configure Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI (if not already set)
OPENAI_API_KEY=your_openai_api_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

## 5. Restart Your Dev Server

```bash
npm run dev
```

## 6. Test It Out

1. Open http://localhost:3000
2. Create a conversation tree
3. Click **Save New** to save your first conversation
4. Click **Load** to see your saved conversations
5. Click on a conversation to load it

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Check that variable names start with `NEXT_PUBLIC_`
- Restart your dev server after adding env variables

### "Error: Conversation not found"
- Make sure you ran the SQL schema in Supabase
- Check that tables `conversations`, `nodes`, and `edges` exist in your database

### Database connection issues
- Verify your Supabase project is active (not paused)
- Check that your Project URL and API key are correct
- Make sure you're using the **anon/public** key, not the service role key (for client-side)

## Optional: Service Role Key (for advanced use)

If you need server-side admin access, you can add:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Never expose the service role key in client-side code!** It's only for server-side API routes.

