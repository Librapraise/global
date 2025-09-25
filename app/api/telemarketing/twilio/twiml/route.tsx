import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Please hold while we connect you to an agent.</Say>
    <Dial timeout="30" record="true">
        <Client>agent</Client>
    </Dial>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
