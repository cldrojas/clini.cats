"use client"

import { useState } from "react"
import { Save, Plus, Trash2, Weight, Syringe, FileText, Edit2, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Patient, MedicalRecord } from "@/lib/types"
import useSWR from "swr"

interface PetDataEditorProps {
  patient: Patient
  onUpdate: () => void
}

const fetchMedicalHistory = async (patientId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from("medical_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false })
  return data || []
}

export function PetDataEditor({ patient, onUpdate }: PetDataEditorProps) {
  const [newWeight, setNewWeight] = useState("")
  const [newVaccine, setNewVaccine] = useState("")
  const [newNote, setNewNote] = useState("")
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editDiagnosis, setEditDiagnosis] = useState("")
  const [editTreatment, setEditTreatment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { data: history = [], mutate: mutateHistory } = useSWR<MedicalRecord[]>(`history-${patient.id}`, () =>
    fetchMedicalHistory(patient.id),
  )

  const handleUpdateWeight = async () => {
    if (!newWeight.trim()) return
    setIsLoading(true)
    const supabase = createClient()
    await supabase
      .from("patients")
      .update({ weight: Number.parseFloat(newWeight) })
      .eq("id", patient.id)
    setNewWeight("")
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

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsLoading(true)
    const supabase = createClient()
    const updatedNotes = patient.notes ? `${patient.notes}\n${newNote.trim()}` : newNote.trim()
    await supabase.from("patients").update({ notes: updatedNotes }).eq("id", patient.id)
    setNewNote("")
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
      .update({
        diagnosis: editDiagnosis || null,
        treatment: editTreatment || null,
      })
      .eq("id", recordId)
    setEditingRecord(null)
    mutateHistory()
    setIsLoading(false)
  }

  return (
    <div className="p-4 pb-24">
      {/* Pet Header */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <img
            src={patient.image_url || "/placeholder.svg?height=64&width=64&query=cat"}
            alt={patient.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">
              {patient.breed} • {patient.age}
            </p>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
              En consulta
            </span>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Weight className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Peso</h3>
        </div>
        <p className="text-2xl font-bold text-foreground mb-3">
          {patient.weight ? `${patient.weight} kg` : "No registrado"}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: 4.5"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <Button onClick={handleUpdateWeight} disabled={!newWeight.trim() || isLoading}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Vaccines */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Syringe className="w-5 h-5 text-success" />
          <h3 className="font-semibold text-foreground">Vacunas</h3>
        </div>
        <div className="space-y-2 mb-3">
          {patient.vaccines && patient.vaccines.length > 0 ? (
            patient.vaccines.map((v, i) => (
              <div key={i} className="flex items-center justify-between bg-success/10 p-2 rounded-lg">
                <span className="text-sm text-foreground">{v}</span>
                <button
                  onClick={() => handleRemoveVaccine(i)}
                  className="text-destructive hover:text-destructive/80"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sin vacunas registradas</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nueva vacuna..." value={newVaccine} onChange={(e) => setNewVaccine(e.target.value)} />
          <Button onClick={handleAddVaccine} disabled={!newVaccine.trim() || isLoading}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Medical Notes */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Notas Médicas</h3>
        </div>
        {patient.notes && (
          <div className="bg-warning/10 p-3 rounded-lg mb-3">
            <p className="text-sm text-foreground whitespace-pre-line">{patient.notes}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Nueva nota..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
          <Button onClick={handleAddNote} disabled={!newNote.trim() || isLoading}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Past Consultations - Editable */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Edit2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Consultas Anteriores</h3>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin consultas registradas</p>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {new Date(record.date).toLocaleDateString("es-CO")}
                  </span>
                  {editingRecord !== record.id && (
                    <Button variant="ghost" size="sm" onClick={() => startEditRecord(record)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
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
                      <p className="text-sm text-foreground">
                        <strong>Dx:</strong> {record.diagnosis}
                      </p>
                    )}
                    {record.treatment && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Tx:</strong> {record.treatment}
                      </p>
                    )}
                    {!record.diagnosis && !record.treatment && (
                      <p className="text-sm text-muted-foreground italic">Sin diagnóstico ni tratamiento registrado</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
