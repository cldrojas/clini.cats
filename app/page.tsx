"use client"

import { redirect } from "next/navigation"
import { useState } from "react"
import { RoleSelector } from "@/components/role-selector"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { AgendaView } from "@/components/receptionist/agenda-view"
import { WaitingRoomCheckin } from "@/components/receptionist/waiting-room-checkin"
import { PatientsListShared } from "@/components/shared/patients-list-shared"
import { WaitingRoomView } from "@/components/doctor/waiting-room-view"
import { ConsultationPanel } from "@/components/doctor/consultation-panel"
import { PetDataEditor } from "@/components/assistant/pet-data-editor"
import type { UserRole } from "@/lib/store"

export default function ClinicApp() {
  redirect("/dashboard")

  const [role, setRole] = useState<UserRole | null>(null)
  const [activeTab, setActiveTab] = useState("agenda")
  const [currentConsultationId, setCurrentConsultationId] = useState<string | null>(null)

  if (!role) {
    return <RoleSelector onSelectRole={setRole} />
  }

  const handleBack = () => {
    setRole(null)
    setActiveTab("agenda")
    setCurrentConsultationId(null)
  }

  const handleStartConsultation = (appointmentId: string) => {
    setCurrentConsultationId(appointmentId)
    setActiveTab("consultation")
  }

  const getTitle = () => {
    if (role === "receptionist") {
      if (activeTab === "agenda") return "Agenda"
      if (activeTab === "waiting") return "Sala de Espera"
      return "Pacientes"
    }
    if (role === "doctor") {
      if (activeTab === "waiting") return "Sala de Espera"
      if (activeTab === "patients") return "Pacientes"
      return "Consulta"
    }
    if (role === "assistant") {
      if (activeTab === "consultation") return "Datos del Paciente"
      return "Pacientes"
    }
    return null
  }

  const renderContent = () => {
    if (role === "receptionist") {
      if (activeTab === "agenda") return <AgendaView />
      if (activeTab === "waiting") return <WaitingRoomCheckin />
      return <PatientsListShared />
    }

    if (role === "doctor") {
      if (activeTab === "waiting") {
        return <WaitingRoomView onStartConsultation={handleStartConsultation} />
      }
      if (activeTab === "patients") {
        return <PatientsListShared />
      }
      return <ConsultationPanel appointmentId={currentConsultationId} />
    }

    if (role === "assistant") {
      if (activeTab === "consultation") return <PetDataEditor />
      return <PatientsListShared />
    }

    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header role={role} title={getTitle()} onBack={handleBack} />
      <main>{renderContent()}</main>
      <BottomNav role={role} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
