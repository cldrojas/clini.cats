"use client"

import { Calendar, Users, Clock, Cat } from "lucide-react"
import type { UserRole } from "@/lib/store"

interface BottomNavProps {
  role: UserRole
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabsByRole = {
  receptionist: [
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "waiting", label: "Espera", icon: Clock },
    { id: "patients", label: "Pacientes", icon: Cat },
  ],
  doctor: [
    { id: "waiting", label: "Sala", icon: Clock },
    { id: "consultation", label: "Consulta", icon: Users },
    { id: "patients", label: "Pacientes", icon: Cat },
  ],
  assistant: [
    { id: "consultation", label: "Consulta", icon: Users },
    { id: "patients", label: "Pacientes", icon: Cat },
  ],
}

export function BottomNav({ role, activeTab, onTabChange }: BottomNavProps) {
  const tabs = tabsByRole[role]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 pb-safe">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
