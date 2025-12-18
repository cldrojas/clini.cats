"use client"

import { Search, Cat } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PatientDetail } from "./patient-detail"
import type { Patient, Role } from "@/lib/types"

interface PatientsListSharedProps {
  patients: Patient[]
  role: Role
  onUpdate: () => void
}

export function PatientsListShared({ patients, role, onUpdate }: PatientsListSharedProps) {
  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  if (selectedPatient) {
    return (
      <PatientDetail
        patient={selectedPatient}
        role={role}
        onBack={() => setSelectedPatient(null)}
        onUpdate={onUpdate}
      />
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Todos los Pacientes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o dueño..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <Cat className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
            >
              <picture>
                <source
                  srcSet={patient.image_url || "/placeholder.svg?height=48&width=48&query=cat"}
                  type="image/webp"
                />
                <source
                  srcSet={patient.image_url || "/placeholder.svg?height=48&width=48&query=cat"}
                  type="image/jpeg"
                />
                <img
                  src={patient.image_url || "/placeholder.svg?height=48&width=48&query=cat"}
                  alt={patient.name}
                  className="w-12 h-12 rounded-xl object-cover bg-muted"
                />
              </picture>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{patient.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {patient.breed} • {patient.age}
                </p>
                <p className="text-xs text-muted-foreground truncate">{patient.owner?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">{patient.weight ? `${patient.weight} kg` : "—"}</p>
                <p className="text-xs text-muted-foreground">{patient.vaccines?.length || 0} vacunas</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
