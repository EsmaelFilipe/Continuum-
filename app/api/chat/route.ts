import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Fallback to empty string to prevent startup crash
});

export async function POST(req: Request) {
  try {
    // 1. Check if Key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json({ reply: "Error: Missing OpenAI API Key. Please add OPENAI_API_KEY to your .env.local file." }, { status: 500 });
    }

    const body = await req.json();
    const { messages } = body;

    // 2. Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Error: Invalid request. 'messages' must be a non-empty array." }, { status: 400 });
    }

    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const reply = completion.choices[0].message.content;
    
    if (!reply) {
      return NextResponse.json({ reply: "Error: OpenAI returned an empty response." }, { status: 500 });
    }
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    // 4. Catch errors (like Quota exceeded or Invalid Key) and return them as JSON
    console.error("OpenAI API Error:", error);
    
    // Provide more specific error messages
    let errorMessage = error.message || "Unknown error occurred";
    if (error.status === 401) {
      errorMessage = "Invalid OpenAI API Key. Please check your OPENAI_API_KEY in .env.local";
    } else if (error.status === 429) {
      errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
    } else if (error.status === 500) {
      errorMessage = "OpenAI API server error. Please try again later.";
    }
    
    return NextResponse.json({ reply: `Error: ${errorMessage}` }, { status: 500 });
  }
}