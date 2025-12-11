"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Mic,
  MicOff,
  Send,
  FileText,
  Syringe,
  Weight,
  AlertCircle,
  CheckCircle,
  History,
  ChevronDown,
  ChevronUp,
  Upload,
  File,
  Trash2,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Patient, Appointment, MedicalRecord, Document } from "@/lib/types"
import useSWR from "swr"

interface ConsultationPanelProps {
  patient: Patient
  appointment: Appointment
  doctorId: string
  onEndConsultation: () => void
}

const fetchMedicalHistory = async (patientId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from("medical_records")
    .select("*, documents(*)")
    .eq("patient_id", patientId)
    .order("date", { ascending: false })
  return data || []
}

export function ConsultationPanel({ patient, appointment, doctorId, onEndConsultation }: ConsultationPanelProps) {
  const [notes, setNotes] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: history = [] } = useSWR<MedicalRecord[]>(`medical-history-${patient.id}`, () =>
    fetchMedicalHistory(patient.id),
  )

  const handleSendNote = () => {
    if (note.trim()) {
      setNotes([...notes, note.trim()])
      setNote("")
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current)
      const minutes = Math.floor(recordingTime / 60)
      const seconds = recordingTime % 60
      setNotes([...notes, `[Nota de voz ${minutes}:${seconds.toString().padStart(2, "0")}]`])
      setRecordingTime(0)
    } else {
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
    setIsRecording(!isRecording)
  }

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("patientId", patient.id)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const doc = await response.json()
        setDocuments([...documents, doc])
      }
    } catch (error) {
      console.error("Error uploading:", error)
    } finally {
      setUploadingDoc(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveDocument = async (doc: Document) => {
    try {
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, url: doc.url }),
      })
      setDocuments(documents.filter((d) => d.id !== doc.id))
    } catch (error) {
      console.error("Error deleting:", error)
    }
  }

  const handleFinishConsultation = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Create medical record
      const { data: record, error: recordError } = await supabase
        .from("medical_records")
        .insert({
          patient_id: patient.id,
          appointment_id: appointment.id,
          weight: patient.weight,
          diagnosis: diagnosis || null,
          treatment: treatment || null,
          notes: notes.join("\n"),
          doctor_id: doctorId,
        })
        .select()
        .single()

      if (recordError) throw recordError

      // Link documents to medical record
      if (documents.length > 0) {
        await supabase
          .from("documents")
          .update({ medical_record_id: record.id })
          .in(
            "id",
            documents.map((d) => d.id),
          )
      }

      // Update patient notes if diagnosis exists
      if (diagnosis) {
        const newNotes = patient.notes ? `${patient.notes}\n${diagnosis}` : diagnosis
        await supabase.from("patients").update({ notes: newNotes }).eq("id", patient.id)
      }

      // Mark appointment as completed
      await supabase.from("appointments").update({ status: "completed" }).eq("id", appointment.id)

      onEndConsultation()
    } catch (error) {
      console.error("Error finishing consultation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 pb-24">
      {/* Pet Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <img
            src={patient.image_url || "/placeholder.svg?height=80&width=80&query=cat"}
            alt={patient.name}
            className="w-20 h-20 rounded-xl object-cover bg-muted"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">
              {patient.breed} • {patient.age}
            </p>
            <p className="text-sm text-muted-foreground">{patient.owner?.name}</p>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium mt-2 inline-block">
              {appointment.reason}
            </span>
          </div>
        </div>
      </div>

      {/* Medical History Toggle */}
      {history.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-card border border-border rounded-xl p-3 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Historial Médico</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{history.length}</span>
          </div>
          {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      )}

      {showHistory && history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-3 max-h-60 overflow-y-auto">
          {history.map((record) => (
            <div key={record.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-foreground text-sm">
                  {new Date(record.date).toLocaleDateString("es-CO")}
                </span>
                {record.weight && <span className="text-xs text-muted-foreground">{record.weight} kg</span>}
              </div>
              {record.diagnosis && (
                <p className="text-sm text-foreground">
                  <strong>Dx:</strong> {record.diagnosis}
                </p>
              )}
              {record.treatment && (
                <p className="text-sm text-muted-foreground">
                  <strong>Tx:</strong> {record.treatment}
                </p>
              )}
              {record.documents && record.documents.length > 0 && (
                <p className="text-xs text-primary mt-1">{record.documents.length} documento(s)</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Weight className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{patient.weight || "—"}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Syringe className="w-5 h-5 mx-auto text-success mb-1" />
          <p className="text-lg font-bold text-foreground">{patient.vaccines?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Vacunas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <AlertCircle className="w-5 h-5 mx-auto text-warning mb-1" />
          <p className="text-lg font-bold text-foreground">{history.length}</p>
          <p className="text-xs text-muted-foreground">Consultas</p>
        </div>
      </div>

      {/* Medical Notes Alert */}
      {patient.notes && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
          <h4 className="font-medium text-warning text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Notas Importantes
          </h4>
          <p className="text-sm text-foreground">{patient.notes}</p>
        </div>
      )}

      {/* Vaccines */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        <h4 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
          <Syringe className="w-4 h-4 text-success" />
          Vacunas Aplicadas
        </h4>
        <div className="flex flex-wrap gap-2">
          {patient.vaccines && patient.vaccines.length > 0 ? (
            patient.vaccines.map((v, i) => (
              <span key={i} className="px-2 py-1 bg-success/10 text-success text-xs rounded-lg">
                {v}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin vacunas registradas</span>
          )}
        </div>
      </div>

      {/* Consultation Notes */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        <h4 className="font-medium text-foreground text-sm mb-3">Notas de Consulta</h4>

        {notes.length > 0 && (
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {notes.map((n, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${n.startsWith("[Nota de voz") ? "bg-primary/10 text-primary flex items-center gap-2" : "bg-muted text-foreground"}`}
              >
                {n.startsWith("[Nota de voz") && <Mic className="w-4 h-4" />}
                {n}
              </div>
            ))}
          </div>
        )}

        <Textarea
          placeholder="Escribe una nota..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none mb-2"
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRecording}
            className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-1" />
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-1" />
                Grabar
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleSendNote} disabled={!note.trim()}>
            <Send className="w-4 h-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        <h4 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Documentos Adjuntos
        </h4>

        {documents.length > 0 && (
          <div className="space-y-2 mb-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                <File className="w-4 h-4 text-primary" />
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-foreground hover:text-primary truncate"
                >
                  {doc.name}
                </a>
                <button
                  onClick={() => handleRemoveDocument(doc)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadDocument}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}>
          <Upload className="w-4 h-4 mr-1" />
          {uploadingDoc ? "Subiendo..." : "Adjuntar Documento"}
        </Button>
      </div>

      {/* Finish Consultation */}
      {!isFinishing ? (
        <Button
          onClick={() => setIsFinishing(true)}
          className="w-full bg-success hover:bg-success/90 text-success-foreground"
          size="lg"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Finalizar Consulta
        </Button>
      ) : (
        <div className="bg-card border-2 border-success/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Resumen de Consulta
            </h4>
            <button onClick={() => setIsFinishing(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Diagnóstico</label>
            <Input
              placeholder="Ej: Gastritis leve"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Tratamiento</label>
            <Textarea
              placeholder="Ej: Omeprazol 10mg cada 12h por 5 días..."
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
          <Button
            className="w-full bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleFinishConsultation}
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Confirmar y Guardar"}
          </Button>
        </div>
      )}
    </div>
  )
}
