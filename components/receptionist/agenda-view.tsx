'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  Search,
  X,
  Cat
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { CreatableSelect } from '@/components/ui/creatable-select'
import type { Appointment, Patient } from '@/lib/types'
import { mockPets } from '@/lib/store'

interface AgendaViewProps {
  appointments: Appointment[]
  onUpdate: () => void
}

export function AgendaView({ appointments, onUpdate }: AgendaViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isNewPet, setIsNewPet] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointmentReasons, setAppointmentReasons] = useState<string[]>([
    'Control',
    'Vacunación',
    'Consulta',
    'Desparasitación',
    'Cirugía',
    'Emergencia'
  ])
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    breed: '',
    age: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: ''
  })
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const appointmentReasons_ = useMemo(async () => {
    const supabase = createClient()
    const res = await supabase.from('appointment_reasons').select('*')

  }, [])

  // Formatear fecha para mostrar
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const loadPatients = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('patients')
      .select('*, owner:owners(*)')
      .order('name')
    setPatients(data || [])
  }

  const filterPatients = (patient: Patient, searchTerm: string) => {
    if (!searchTerm.trim()) return true

    const term = searchTerm.toLowerCase().trim()
    const patientName = patient.name.toLowerCase()
    const ownerName = patient.owner?.name?.toLowerCase() || ''
    const ownerPhone = patient.owner?.phone?.toLowerCase() || ''
    const ownerEmail = patient.owner?.email?.toLowerCase() || ''

    return (
      patientName.includes(term) ||
      ownerName.includes(term) ||
      ownerPhone.includes(term) ||
      ownerEmail.includes(term)
    )
  }

  const handleOpenDialog = () => {
    loadPatients()
    setIsOpen(true)
  }

  const handleCreateAppointment = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      let patientId = selectedPatientId

      if (isNewPet) {
        // Create owner first
        const { data: owner, error: ownerError } = await supabase
          .from('owners')
          .insert({
            name: newPatientData.ownerName,
            phone: newPatientData.ownerPhone,
            email: newPatientData.ownerEmail || null
          })
          .select()
          .single()

        if (ownerError) throw ownerError

        // Create patient
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .insert({
            name: newPatientData.name,
            breed: newPatientData.breed,
            age: newPatientData.age,
            owner_id: owner.id,
            vaccines: []
          })
          .select()
          .single()

        if (patientError) throw patientError
        patientId = patient.id
      }

      // Create appointment
      await supabase.from('appointments').insert({
        patient_id: patientId,
        date: appointmentData.date,
        time: appointmentData.time,
        reason: appointmentData.reason,
        status: 'scheduled'
      })

      onUpdate()
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setIsNewPet(false)
    setSelectedPatientId('')
    setNewPatientData({
      name: '',
      breed: '',
      age: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: ''
    })
    setAppointmentData({
      date: today,
      time: '',
      reason: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-muted text-muted-foreground',
      waiting: 'bg-warning/20 text-warning',
      in_consultation: 'bg-primary/20 text-primary',
      completed: 'bg-success/20 text-success'
    }
    const labels: Record<string, string> = {
      scheduled: 'Agendada',
      waiting: 'En espera',
      in_consultation: 'En consulta',
      completed: 'Completada'
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Agenda de Hoy
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={handleOpenDialog}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nueva Cita</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  variant={!isNewPet ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsNewPet(false)}
                  className="flex-1"
                >
                  Existente
                </Button>
                <Button
                  variant={isNewPet ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsNewPet(true)}
                  className="flex-1"
                >
                  Nuevo
                </Button>
              </div>

              {!isNewPet ? (
                <>
                  <CreatableSelect
                    items={patients}
                    getLabel={(patient) => patient.name}
                    getValue={(patient) => patient.id}
                    placeholder="Buscar por mascota, dueño, etc..."
                    label="Seleccionar Paciente"
                    icon={Search}
                    onSelect={(patient) => setSelectedPatientId(patient.id)}
                    filterItems={filterPatients}
                    selectedValue={selectedPatientId}
                    onClear={() => setSelectedPatientId('')}
                    allowCreate={false}
                    renderItem={(patient) => (
                      <>
                        <div className="font-semibold">{patient.name}</div>
                        <Cat className="absolute end-0 me-4 text-muted-foreground" />
                        {patient.breed && (
                          <div className="text-xs text-muted-foreground">
                            {patient.breed}
                            {patient.age && ` • ${patient.age}`}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {patient.owner?.name}
                          {patient.owner?.phone && ` • ${patient.owner.phone}`}
                          {patient.owner?.email && ` • ${patient.owner.email}`}
                        </div>
                      </>
                    )}
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre Mascota</Label>
                      <Input
                        value={newPatientData.name}
                        onChange={(e) =>
                          setNewPatientData({
                            ...newPatientData,
                            name: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Raza</Label>
                      <Input
                        value={newPatientData.breed}
                        onChange={(e) =>
                          setNewPatientData({
                            ...newPatientData,
                            breed: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Edad</Label>
                    <Input
                      value={newPatientData.age}
                      onChange={(e) =>
                        setNewPatientData({
                          ...newPatientData,
                          age: e.target.value
                        })
                      }
                      placeholder="2 años"
                    />
                  </div>
                  <div>
                    <Label>Nombre Dueño</Label>
                    <Input
                      value={newPatientData.ownerName}
                      onChange={(e) =>
                        setNewPatientData({
                          ...newPatientData,
                          ownerName: e.target.value
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={newPatientData.ownerPhone}
                      onChange={(e) =>
                        setNewPatientData({
                          ...newPatientData,
                          ownerPhone: e.target.value
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={appointmentData.date}
                  min={today}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      date: e.target.value
                    })
                  }
                />
                {appointmentData.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateForDisplay(appointmentData.date)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        time: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <CreatableSelect
                    items={appointmentReasons}
                    getLabel={(reason) => reason}
                    getValue={(reason) => reason}
                    placeholder="Control, Vacunación, etc..."
                    label="Motivo"
                    onSelect={(reason) =>
                      setAppointmentData({ ...appointmentData, reason })
                    }
                    onCreate={async (newReason) => {
                      setAppointmentReasons([...appointmentReasons, newReason])
                      setAppointmentData({
                        ...appointmentData,
                        reason: newReason
                      })

                      const supabase = createClient()
                      try {
                        const createdReazon = await supabase
                          .from('appointment_reason')
                          .upsert(newReason)

                        console.log(`DEBUG:createdReazon:`, createdReazon)
                      } catch (error) {
                        console.error('creating reason', error)
                      }
                    }}
                    selectedValue={appointmentData.reason}
                    allowCreate={true}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateAppointment}
                disabled={
                  isLoading ||
                  (!isNewPet && !selectedPatientId) ||
                  (isNewPet && !newPatientData.name) ||
                  !appointmentData.date ||
                  !appointmentData.time
                }
              >
                {isLoading ? 'Creando...' : 'Confirmar Cita'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-accent rounded-xl">
        <Phone className="w-4 h-4 text-accent-foreground" />
        <span className="text-sm text-accent-foreground">Teléfono / </span>
        <MessageCircle className="w-4 h-4 text-accent-foreground" />
        <span className="text-sm text-accent-foreground">WhatsApp</span>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay citas agendadas para hoy
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    apt.patient?.image_url ||
                    '/placeholder.svg?height=48&width=48&query=cat'
                  }
                  alt={apt.patient?.name}
                  className="w-12 h-12 rounded-xl object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {apt.patient?.name}
                    </h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {apt.patient?.owner?.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Clock className="w-4 h-4" />
                    {apt.time?.slice(0, 5)}
                  </div>
                  <p className="text-xs text-muted-foreground">{apt.reason}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
