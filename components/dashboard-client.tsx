'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { AgendaView } from '@/components/receptionist/agenda-view'
import { WaitingRoomCheckin } from '@/components/receptionist/waiting-room-checkin'
import { WaitingRoomView } from '@/components/doctor/waiting-room-view'
import { ConsultationPanel } from '@/components/doctor/consultation-panel'
import { PetDataEditor } from '@/components/assistant/pet-data-editor'
import { PatientsListShared } from '@/components/shared/patients-list-shared'
import type { Profile, Patient, Appointment } from '@/lib/types'
import useSWR from 'swr'

interface DashboardClientProps {
  profile: Profile
}

const fetcher = async (key: string) => {
  const supabase = createClient()

  if (key === 'appointments') {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('*, patient:patients(*, owner:owners(*))')
      .eq('date', today)
      .order('time')
    return data || []
  }

  if (key === 'patients') {
    const { data } = await supabase
      .from('patients')
      .select('*, owner:owners(*)')
      .order('name')
    return data || []
  }

  return []
}

export function DashboardClient({ profile }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState(
    profile.role === 'doctor' ? 'waiting' : 'agenda'
  )
  const [currentConsultation, setCurrentConsultation] = useState<{
    patient: Patient
    appointment: Appointment
  } | null>(null)

  const { data: appointments = [], mutate: mutateAppointments } = useSWR<
    Appointment[]
  >('appointments', fetcher, {
    refreshInterval: 15000,
    dedupingInterval: 10000,
    revalidateOnFocus: false
  })

  const { data: patients = [], mutate: mutatePatients } = useSWR<Patient[]>(
    'patients',
    fetcher,
    {
      refreshInterval: 30000
    }
  )

  const waitingPatients = appointments.filter((a) => a.status === 'waiting')
  const inConsultation = appointments.find(
    (a) => a.status === 'in_consultation'
  )

  // Sync current consultation with appointments
  useEffect(() => {
    if (inConsultation && inConsultation.patient) {
      setCurrentConsultation({
        patient: inConsultation.patient as Patient,
        appointment: inConsultation
      })
    }
  }, [inConsultation])

  const handleStartConsultation = async (appointment: Appointment) => {
    const supabase = createClient()
    await supabase
      .from('appointments')
      .update({ status: 'in_consultation' })
      .eq('id', appointment.id)

    if (appointment.patient) {
      setCurrentConsultation({
        patient: appointment.patient as Patient,
        appointment
      })
    }
    mutateAppointments()
  }

  const handleEndConsultation = () => {
    setCurrentConsultation(null)
    mutateAppointments()
    mutatePatients()
  }

  const renderContent = () => {
    switch (profile.role) {
      case 'receptionist':
        switch (activeTab) {
          case 'agenda':
            return (
              <AgendaView
                appointments={appointments}
                onUpdate={mutateAppointments}
              />
            )
          case 'waiting':
            return (
              <WaitingRoomCheckin
                appointments={appointments}
                onUpdate={mutateAppointments}
              />
            )
          case 'patients':
            return (
              <PatientsListShared
                patients={patients}
                role={profile.role}
                onUpdate={mutatePatients}
              />
            )
          default:
            return null
        }

      case 'doctor':
        switch (activeTab) {
          case 'waiting':
            return (
              <WaitingRoomView
                waitingPatients={waitingPatients}
                onStartConsultation={handleStartConsultation}
              />
            )
          case 'consultation':
            return currentConsultation ? (
              <ConsultationPanel
                patient={currentConsultation.patient}
                appointment={currentConsultation.appointment}
                doctorId={profile.id}
                onEndConsultation={handleEndConsultation}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay paciente en consulta
              </div>
            )
          case 'patients':
            return (
              <PatientsListShared
                patients={patients}
                role={profile.role}
                onUpdate={mutatePatients}
              />
            )
          default:
            return null
        }

      case 'assistant':
        switch (activeTab) {
          case 'consultation':
            return currentConsultation ? (
              <PetDataEditor
                patient={currentConsultation.patient}
                onUpdate={mutatePatients}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay paciente en consulta
              </div>
            )
          case 'patients':
            return (
              <PatientsListShared
                patients={patients}
                role={profile.role}
                onUpdate={mutatePatients}
              />
            )
          default:
            return null
        }

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        role={profile.role}
        userName={profile.full_name}
      />
      <main className="flex-1 p-4 pb-20">{renderContent()}</main>
      <BottomNav
        role={profile.role}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
