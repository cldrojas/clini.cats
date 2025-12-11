"use client"

import { Cat, Stethoscope, ClipboardList, UserRound } from "lucide-react"
import type { UserRole } from "@/lib/store"

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void
}

const roles = [
  {
    id: "receptionist" as UserRole,
    title: "Recepción",
    description: "Agenda citas y registra llegadas",
    icon: ClipboardList,
    color: "bg-secondary",
  },
  {
    id: "doctor" as UserRole,
    title: "Dra. Veterinaria",
    description: "Consultas y notas médicas",
    icon: Stethoscope,
    color: "bg-primary",
  },
  {
    id: "assistant" as UserRole,
    title: "Asistente",
    description: "Actualiza datos de pacientes",
    icon: UserRound,
    color: "bg-success",
  },
]

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Cat className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Clínica Felina</h1>
        <p className="text-muted-foreground mt-1">Selecciona tu rol para continuar</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-200 group"
          >
            <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center`}>
              <role.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{role.title}</h3>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Los datos se sincronizan en tiempo real entre todos los dispositivos
      </p>
    </div>
  )
}
