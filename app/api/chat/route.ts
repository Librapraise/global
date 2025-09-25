import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build conversation context
    const messages = [
      {
        role: "system" as const,
        content: `You are Global AI Assistant, an expert AI specializing in public adjusting and insurance law. You help insurance professionals, public adjusters, and clients navigate complex insurance claims, understand policy coverage, and provide guidance on legal aspects of insurance disputes.

Your expertise includes:
- Property damage assessment and documentation
- Insurance policy interpretation and coverage analysis
- Claims negotiation strategies and best practices
- Legal requirements and regulations in insurance
- Public adjusting procedures and methodologies
- Dispute resolution and litigation support
- Industry standards and best practices

Always provide accurate, professional, and helpful responses. When discussing legal matters, remind users to consult with qualified attorneys for specific legal advice.`,
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ]

    const result = await streamText({
      model: xai("grok-2-1212"),
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Convert stream to text
    let fullResponse = ""
    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    return NextResponse.json({
      response: fullResponse,
      success: true,
    })
  } catch (error) {
    console.error("Chat API error:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: `Chat processing failed: ${error.message}`,
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process chat message",
        success: false,
      },
      { status: 500 },
    )
  }
}
