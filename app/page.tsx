"use client";

import FlowEditor from "./components/FlowEditor";
import AuthForm from "./components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <FlowEditor />
    </main>
  );
}