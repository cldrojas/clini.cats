"use client"

import { Cat, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Role } from "@/lib/types"

interface HeaderProps {
  role: Role
  userName: string
}

const roleColors = {
  receptionist: "bg-secondary",
  doctor: "bg-primary",
  assistant: "bg-success",
}

const roleLabels = {
  receptionist: "Recepción",
  doctor: "Dra. Veterinaria",
  assistant: "Asistente",
}

export function Header({ role, userName }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Cat className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{userName}</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
            <span className="text-xs text-muted-foreground">{roleLabels[role]}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
