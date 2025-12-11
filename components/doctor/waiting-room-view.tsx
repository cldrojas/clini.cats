"use client"

import { Clock, ArrowRight } from "lucide-react"
import type { Appointment } from "@/lib/types"

interface WaitingRoomViewProps {
  waitingPatients: Appointment[]
  onStartConsultation: (appointment: Appointment) => void
}

export function WaitingRoomView({ waitingPatients, onStartConsultation }: WaitingRoomViewProps) {
  return (
    <div className="p-4 pb-24">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Sala de Espera</h2>
        <p className="text-sm text-muted-foreground mb-4">{waitingPatients.length} pacientes esperando</p>

        {waitingPatients.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-xl">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay pacientes en espera</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingPatients.map((apt, index) => (
              <button
                key={apt.id}
                onClick={() => onStartConsultation(apt)}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-bold text-sm">
                  {index + 1}
                </div>
                <img
                  src={apt.patient?.image_url || "/placeholder.svg?height=56&width=56&query=cat"}
                  alt={apt.patient?.name}
                  className="w-14 h-14 rounded-xl object-cover bg-muted"
                />
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {apt.patient?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {apt.patient?.breed} • {apt.patient?.age}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{apt.reason}</p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-sm font-medium">Atender</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
