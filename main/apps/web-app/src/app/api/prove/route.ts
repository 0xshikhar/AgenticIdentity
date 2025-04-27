import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const reqJson = await req.json()
        let response: any

        response = await fetch("http://localhost:9816/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqJson)
        })
        const data = await response.json()

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (error: any) {
        console.error(error)

        return new Response(JSON.stringify({ message: `Server error: ${error}` }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
}
