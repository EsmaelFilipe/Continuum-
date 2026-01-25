# Continuum - Infinite Chat Canvas

An innovative AI conversation tool that lets you create branching, non-linear conversation trees on an infinite canvas. Explore multiple conversation paths simultaneously, visualize your dialogue structure, and save your conversation trees for later.

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

## ✨ Features

- **Infinite Canvas**: Visualize conversations as interactive node graphs
- **Branching Conversations**: Create multiple conversation paths from any point
- **AI-Powered**: Powered by OpenAI GPT-3.5-turbo for intelligent responses
- **User Authentication**: Secure login/signup with Supabase Auth
- **Save & Load**: Persist your conversation trees to PostgreSQL
- **User Isolation**: Each user's conversations are private and secure
- **Real-time Updates**: See AI responses appear in real-time
- **Personalized Greetings**: Customized welcome messages for each user

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI API (GPT-3.5-turbo)
- **Visualization**: ReactFlow 11.11.4

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm, yarn, pnpm, or bun
- A Supabase account ([sign up here](https://supabase.com))
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd infinite-chat
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database schemas:
   - Go to **SQL Editor** in your Supabase dashboard
   - Run `supabase/schema.sql` first
   - Then run `supabase/schema-auth.sql`
3. Get your credentials from **Settings → API**:
   - Project URL
   - anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Sign Up/Login**: Create an account or sign in with your credentials
2. **Start a Conversation**: Click "Reply / Branch" on the system node
3. **Branch Your Conversations**: Create multiple paths from any message
4. **Save Your Work**: Click "Save New" to persist your conversation tree
5. **Load Conversations**: Click "Load" to see and restore saved conversations
6. **Explore**: Drag nodes, zoom, and navigate your conversation canvas

## 📁 Project Structure

```
infinite-chat/
├── app/
│   ├── api/
│   │   ├── chat/              # OpenAI API integration
│   │   └── conversations/     # CRUD operations for conversations
│   ├── components/
│   │   ├── FlowEditor.tsx     # Main canvas component
│   │   ├── ChatNode.tsx       # Individual conversation node
│   │   └── AuthForm.tsx       # Login/signup form
│   ├── layout.tsx
│   └── page.tsx
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── lib/
│   ├── supabase.ts            # Supabase client configuration
│   └── auth-helpers.ts        # Server-side auth utilities
├── supabase/
│   ├── schema.sql             # Main database schema
│   └── schema-auth.sql        # Authentication migration
└── SETUP.md                   # Detailed setup guide
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User data isolation at the database level
- Secure authentication with Supabase Auth
- Environment variables for sensitive keys

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md) for detailed troubleshooting guide.

Common issues:
- **"Missing Supabase environment variables"**: Check your `.env.local` file
- **"Unauthorized"**: Ensure you're signed in and RLS policies are set up
- **"Conversation not found"**: Verify database schemas are run correctly

## 📝 License

This project is private.

## 🤝 Contributing

This is a private research project. Contributions are not currently accepted.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ReactFlow Documentation](https://reactflow.dev)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [OpenAI](https://openai.com)
- Database by [Supabase](https://supabase.com)
- Visualization by [ReactFlow](https://reactflow.dev)
