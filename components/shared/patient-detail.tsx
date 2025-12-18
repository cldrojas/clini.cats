"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  ArrowLeft,
  Phone,
  Syringe,
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  Upload,
  File,
  Download,
  Edit2,
  Check,
  X,
  Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { Patient, MedicalRecord, Role } from "@/lib/types"
import useSWR from "swr"

interface PatientDetailProps {
  patient: Patient
  role: Role
  onBack: () => void
  onUpdate: () => void
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

export function PatientDetail({ patient, role, onBack, onUpdate }: PatientDetailProps) {
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editDiagnosis, setEditDiagnosis] = useState("")
  const [editTreatment, setEditTreatment] = useState("")
  const [editingPatient, setEditingPatient] = useState(false)
  const [patientName, setPatientName] = useState(patient.name)
  const [patientBreed, setPatientBreed] = useState(patient.breed || "")
  const [patientAge, setPatientAge] = useState(patient.age || "")
  const [newVaccine, setNewVaccine] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: history = [], mutate: mutateHistory } = useSWR<MedicalRecord[]>(`patient-history-${patient.id}`, () =>
    fetchMedicalHistory(patient.id),
  )

  const canEdit = role === "assistant" || role === "doctor"

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, recordId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("patientId", patient.id)
      if (recordId) formData.append("medicalRecordId", recordId)

      const response = await fetch("/api/upload", { method: "POST", body: formData })

      if (response.ok) {
        mutateHistory()
      }
    } catch (error) {
      console.error("Error uploading:", error)
    } finally {
      setUploadingDoc(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSavePatient = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase
      .from("patients")
      .update({ name: patientName, breed: patientBreed, age: patientAge })
      .eq("id", patient.id)
    setEditingPatient(false)
    onUpdate()
    setIsLoading(false)
  }

  const handleAddVaccine = async () => {
    if (!newVaccine.trim()) return
    setIsLoading(true)
    const supabase = createClient()
    const updatedVaccines = [...(patient.vaccines || []), newVaccine.trim()]
    await supabase.from("patients").update({ vaccines: updatedVaccines }).eq("id", patient.id)
    setNewVaccine("")
    onUpdate()
    setIsLoading(false)
  }

  const handleRemoveVaccine = async (index: number) => {
    setIsLoading(true)
    const supabase = createClient()
    const updatedVaccines = patient.vaccines?.filter((_, i) => i !== index) || []
    await supabase.from("patients").update({ vaccines: updatedVaccines }).eq("id", patient.id)
    onUpdate()
    setIsLoading(false)
  }

  const startEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record.id)
    setEditDiagnosis(record.diagnosis || "")
    setEditTreatment(record.treatment || "")
  }

  const handleSaveRecord = async (recordId: string) => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase
      .from("medical_records")
      .update({ diagnosis: editDiagnosis || null, treatment: editTreatment || null })
      .eq("id", recordId)
    setEditingRecord(null)
    mutateHistory()
    setIsLoading(false)
  }

  return (
    <div className="p-4 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Volver a pacientes</span>
      </button>

      {/* Patient Profile */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-4">
          <picture>
            <source
              srcSet={patient.image_url || "/placeholder.svg?height=80&width=80&query=cat face"}
              type="image/webp"
            />
            <source
              srcSet={patient.image_url || "/placeholder.svg?height=80&width=80&query=cat face"}
              type="image/jpeg"
            />
            <img
              src={patient.image_url || "/placeholder.svg?height=80&width=80&query=cat face"}
              alt={patient.name}
              className="w-20 h-20 rounded-2xl object-cover bg-muted"
            />
          </picture>
          <div className="flex-1">
            {editingPatient && canEdit ? (
              <div className="space-y-2">
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nombre" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={patientBreed} onChange={(e) => setPatientBreed(e.target.value)} placeholder="Raza" />
                  <Input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Edad" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePatient} disabled={isLoading}>
                    <Check className="w-4 h-4 mr-1" />
                    Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPatient(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingPatient(true)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {patient.breed} - {patient.age}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-medium text-foreground">
                    {patient.weight ? `${patient.weight} kg` : "—"}
                  </span>
                  <Badge variant="secondary">{patient.vaccines?.length || 0} vacunas</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">Propietario</p>
          <p className="font-medium text-foreground">{patient.owner?.name}</p>
          {patient.owner?.phone && (
            <a
              href={`tel:${patient.owner.phone}`}
              className="flex items-center gap-2 text-primary text-sm mt-1 hover:underline"
            >
              <Phone className="w-3 h-3" />
              {patient.owner.phone}
            </a>
          )}
        </div>
      </div>

      {/* Vaccines */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="w-4 h-4 text-primary" />
            Vacunas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.vaccines && patient.vaccines.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {patient.vaccines.map((vaccine, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Badge variant="outline">{vaccine}</Badge>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveVaccine(idx)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">Sin vacunas registradas</p>
          )}
          {canEdit && (
            <div className="flex gap-2">
              <Input
                placeholder="Nueva vacuna..."
                value={newVaccine}
                onChange={(e) => setNewVaccine(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddVaccine} disabled={!newVaccine.trim() || isLoading}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Notes */}
      {patient.notes && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              Notas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-line">{patient.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Medical History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Historial de Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="border border-border rounded-xl p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {new Date(record.date).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {record.weight && <Badge variant="secondary">{record.weight} kg</Badge>}
                      {canEdit && editingRecord !== record.id && (
                        <Button variant="ghost" size="sm" onClick={() => startEditRecord(record)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingRecord === record.id ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Diagnóstico</label>
                        <Input
                          value={editDiagnosis}
                          onChange={(e) => setEditDiagnosis(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tratamiento</label>
                        <Textarea
                          value={editTreatment}
                          onChange={(e) => setEditTreatment(e.target.value)}
                          className="mt-1 resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleSaveRecord(record.id)} disabled={isLoading}>
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {record.diagnosis && (
                        <div className="flex items-start gap-2 mb-2">
                          <Stethoscope className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Diagnóstico</p>
                            <p className="text-sm text-foreground">{record.diagnosis}</p>
                          </div>
                        </div>
                      )}
                      {record.treatment && (
                        <div className="flex items-start gap-2 mb-2">
                          <Pill className="w-4 h-4 text-success mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tratamiento</p>
                            <p className="text-sm text-foreground">{record.treatment}</p>
                          </div>
                        </div>
                      )}
                      {record.notes && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notas</p>
                          <p className="text-sm text-foreground whitespace-pre-line">{record.notes}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Documents */}
                  {record.documents && record.documents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Documentos</p>
                      <div className="space-y-1">
                        {record.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <File className="w-4 h-4" />
                            {doc.name}
                            <Download className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload document to this record (doctor only) */}
                  {role === "doctor" && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <input
                        type="file"
                        id={`upload-${record.id}`}
                        onChange={(e) => handleUploadDocument(e, record.id)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${record.id}`)?.click()}
                        disabled={uploadingDoc}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {uploadingDoc ? "Subiendo..." : "Adjuntar"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No hay consultas registradas</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
