import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const patientId = formData.get("patientId") as string
    const medicalRecordId = formData.get("medicalRecordId") as string | null

    if (!file || !patientId) {
      return NextResponse.json({ error: "Archivo y paciente requeridos" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`clinic/${patientId}/${file.name}`, file, {
      access: "public",
    })

    // Save document reference to database
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        patient_id: patientId,
        medical_record_id: medicalRecordId,
        name: file.name,
        url: blob.url,
        type: file.type,
        size: file.size,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(document)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
