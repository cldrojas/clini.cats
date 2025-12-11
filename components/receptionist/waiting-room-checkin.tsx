"use client"

import { Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Appointment } from "@/lib/types"

interface WaitingRoomCheckinProps {
  appointments: Appointment[]
  onUpdate: () => void
}

export function WaitingRoomCheckin({ appointments, onUpdate }: WaitingRoomCheckinProps) {
  const scheduledAppointments = appointments.filter((a) => a.status === "scheduled")
  const waitingAppointments = appointments.filter((a) => a.status === "waiting")

  const handleCheckin = async (id: string) => {
    const supabase = createClient()
    await supabase.from("appointments").update({ status: "waiting" }).eq("id", id)
    onUpdate()
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Registrar Llegada</h2>
        <p className="text-sm text-muted-foreground">Selecciona la mascota que acaba de llegar</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Citas Agendadas ({scheduledAppointments.length})
        </h3>

        {scheduledAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted rounded-xl">
            No hay citas pendientes de llegada
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {scheduledAppointments.map((apt) => (
              <button
                key={apt.id}
                onClick={() => handleCheckin(apt.id)}
                className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all group"
              >
                <img
                  src={apt.patient?.image_url || "/placeholder.svg?height=64&width=64&query=cat"}
                  alt={apt.patient?.name}
                  className="w-16 h-16 rounded-xl object-cover bg-muted mx-auto mb-3"
                />
                <h4 className="font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                  {apt.patient?.name}
                </h4>
                <p className="text-xs text-muted-foreground text-center">
                  {apt.time?.slice(0, 5)} - {apt.reason}
                </p>
                <div className="mt-3 flex items-center justify-center">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    Registrar llegada
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          En Sala de Espera ({waitingAppointments.length})
        </h3>

        {waitingAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted rounded-xl">La sala de espera está vacía</div>
        ) : (
          <div className="space-y-2">
            {waitingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center gap-3"
              >
                <img
                  src={apt.patient?.image_url || "/placeholder.svg?height=40&width=40&query=cat"}
                  alt={apt.patient?.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{apt.patient?.name}</h4>
                  <p className="text-xs text-muted-foreground">Llegó a las {apt.time?.slice(0, 5)}</p>
                </div>
                <div className="flex items-center gap-1 text-warning">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Esperando</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
