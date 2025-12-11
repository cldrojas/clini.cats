import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { documentId, url } = await request.json()

    if (!documentId || !url) {
      return NextResponse.json({ error: "ID y URL requeridos" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)

    // Delete from database
    await supabase.from("documents").delete().eq("id", documentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
