import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callStatus = formData.get('CallStatus') as string
    const callSid = formData.get('CallSid') as string
    
    console.log(`Call ${callSid} status: ${callStatus}`)

    // Broadcast status to WebSocket clients
    // You'll need to implement a WebSocket signaling server
    broadcastToSignaling({
      type: 'call-status',
      callSid: callSid,
      status: callStatus
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling status callback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// WebSocket signaling server (separate implementation needed)
function broadcastToSignaling(message: any) {
  // Implementation depends on your WebSocket setup
  // This could use Socket.IO, ws, or Vercel's WebSocket support
  console.log("Broadcasting message:", message)
}