import useSWR, { mutate } from 'swr'

// Types
export interface Pet {
  id: string
  name: string
  breed: string
  age: string
  weight: number
  color: string
  owner_id: string
  vaccines: string[]
  notes: string[]
  image_url: string
}

export interface MedicalRecord {
  id: string
  date: string
  reason: string
  notes: string[]
  voiceNotes: string[]
  weight: number
  diagnosis?: string
  treatment?: string
}

export interface Appointment {
  id: string
  petId: string
  pet: Pet
  date: string
  time: string
  reason: string
  status: 'scheduled' | 'waiting' | 'in-consultation' | 'completed'
  notes: string[]
  voiceNotes: string[]
  diagnosis?: string
  treatment?: string
}

// Mock data
export const mockPets: Pet[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Michi',
    breed: 'Persa',
    age: '3 años',
    weight: 4.2,
    color: 'Gris',
    owner_id: '1391428a-43c5-4fc7-b8b1-728beca27636',
    vaccines: ['Triple felina', 'Rabia'],
    notes: ['Alergia leve a pollo'],
    image_url: '/persian-cat-face.jpg'
  },
  {
    id: 'b2c3d4e5-f678-9012-bcde-f23456789012',
    name: 'Luna',
    breed: 'Siamés',
    age: '5 años',
    weight: 3.8,
    color: 'Crema',
    owner_id: '1391428a-43c5-4fc7-b8b1-728beca27636',
    vaccines: ['Triple felina', 'Rabia', 'Leucemia'],
    notes: [],
    image_url: '/siamese-cat-face.jpg'
  },
  {
    id: 'c3d4e5f6-7890-1234-cdef-345678901234',
    name: 'Simba',
    breed: 'Naranja Común',
    age: '2 años',
    weight: 5.1,
    color: 'Naranja',
    owner_id: '1391428a-43c5-4fc7-b8b1-728beca27636',
    vaccines: ['Triple felina'],
    notes: ['Tendencia a obesidad'],
    image_url: '/orange-tabby-cat-face.jpg'
  },
  {
    id: 'd4e5f678-9012-3456-def0-456789012345',
    name: 'Nala',
    breed: 'Maine Coon',
    age: '4 años',
    weight: 6.5,
    color: 'Marrón',
    owner_id: '1391428a-43c5-4fc7-b8b1-728beca27636',
    vaccines: ['Triple felina', 'Rabia'],
    notes: ['Revisión dental pendiente'],
    image_url: '/maine-coon-cat-face.jpg'
  }
]

export const seedAppointmentTypes = ['Control', 'Emergencia']

const today = new Date().toISOString().split('T')[0]

const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    petId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    pet: mockPets[0],
    date: today,
    time: '09:00',
    reason: 'Control general',
    status: 'scheduled',
    notes: [],
    voiceNotes: []
  },
  {
    id: 'a2',
    petId: 'b2c3d4e5-f678-9012-bcde-f23456789012',
    pet: mockPets[1],
    date: today,
    time: '09:30',
    reason: 'Vacunación anual',
    status: 'scheduled',
    notes: [],
    voiceNotes: []
  },
  {
    id: 'a3',
    petId: 'c3d4e5f6-7890-1234-cdef-345678901234',
    pet: mockPets[2],
    date: today,
    time: '10:00',
    reason: 'Problema digestivo',
    status: 'waiting',
    notes: [],
    voiceNotes: []
  },
  {
    id: 'a4',
    petId: 'd4e5f678-9012-3456-def0-456789012345',
    pet: mockPets[3],
    date: today,
    time: '10:30',
    reason: 'Limpieza dental',
    status: 'scheduled',
    notes: [],
    voiceNotes: []
  }
]

// In-memory store (simulates real-time sync)
let appointments = [...mockAppointments]
let pets = [...mockPets]
const medicalHistory: Record<string, MedicalRecord[]> = {}

// Data fetcher
const fetcher = (key: string) => {
  if (key === 'appointments') return Promise.resolve(appointments)
  if (key === 'pets') return Promise.resolve(pets)
  if (key.startsWith('history-')) {
    const petId = key.replace('history-', '')
    return Promise.resolve(medicalHistory[petId] || [])
  }
  return Promise.resolve(null)
}

// Hooks
export function useAppointments() {
  const { data, error, isLoading } = useSWR<Appointment[]>(
    'appointments',
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 15000
    }
  )
  return { appointments: data || [], error, isLoading }
}

export function usePets() {
  const { data, error, isLoading } = useSWR<Pet[]>('pets', fetcher, {
    refreshInterval: 60000,
    dedupingInterval: 30000
  })
  return { pets: data || [], error, isLoading }
}

export function useMedicalHistory(petId: string) {
  const { data, error, isLoading } = useSWR<MedicalRecord[]>(
    `history-${petId}`,
    fetcher,
    {
      refreshInterval: 1000
    }
  )
  return { history: data || [], error, isLoading }
}

// Actions
export function updateAppointmentStatus(
  id: string,
  status: Appointment['status']
) {
  appointments = appointments.map((a) => (a.id === id ? { ...a, status } : a))
  mutate('appointments')
}

export function addAppointmentNote(id: string, note: string) {
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, notes: [...a.notes, note] } : a
  )
  mutate('appointments')
}

export function addVoiceNote(id: string, voiceNote: string) {
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, voiceNotes: [...a.voiceNotes, voiceNote] } : a
  )
  mutate('appointments')
}

export function updatePetData(petId: string, updates: Partial<Pet>) {
  pets = pets.map((p) => (p.id === petId ? { ...p, ...updates } : p))
  appointments = appointments.map((a) =>
    a.petId === petId ? { ...a, pet: { ...a.pet, ...updates } } : a
  )
  mutate('pets')
  mutate('appointments')
}

export function addAppointment(
  appointment: Omit<Appointment, 'id' | 'notes' | 'voiceNotes'>
) {
  const newAppointment: Appointment = {
    ...appointment,
    id: `a${Date.now()}`,
    notes: [],
    voiceNotes: []
  }
  appointments = [...appointments, newAppointment]
  mutate('appointments')
}

export function addPet(pet: Omit<Pet, 'id'>) {
  const newPet: Pet = {
    ...pet,
    id: `${Date.now()}`
  }
  pets = [...pets, newPet]
  mutate('pets')
  return newPet
}

export function updateConsultationDetails(
  id: string,
  details: { diagnosis?: string; treatment?: string }
) {
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, ...details } : a
  )
  mutate('appointments')
}

export function finalizeConsultation(appointmentId: string) {
  const appointment = appointments.find((a) => a.id === appointmentId)
  if (!appointment) return

  // Create medical record from consultation
  const record: MedicalRecord = {
    id: `rec-${Date.now()}`,
    date: new Date().toISOString(),
    reason: appointment.reason,
    notes: appointment.notes,
    voiceNotes: appointment.voiceNotes,
    weight: appointment.pet.weight,
    diagnosis: appointment.diagnosis,
    treatment: appointment.treatment
  }

  // Add to history
  if (!medicalHistory[appointment.petId]) {
    medicalHistory[appointment.petId] = []
  }
  medicalHistory[appointment.petId].unshift(record)

  // Update appointment status
  appointments = appointments.map((a) =>
    a.id === appointmentId ? { ...a, status: 'completed' as const } : a
  )

  // Update pet notes if there's a diagnosis
  if (appointment.diagnosis) {
    const summaryNote = `${new Date().toLocaleDateString()}: ${
      appointment.diagnosis
    }`
    pets = pets.map((p) =>
      p.id === appointment.petId
        ? { ...p, notes: [summaryNote, ...p.notes].slice(0, 5) }
        : p
    )
    appointments = appointments.map((a) =>
      a.petId === appointment.petId
        ? {
            ...a,
            pet: {
              ...a.pet,
              notes: [summaryNote, ...a.pet.notes].slice(0, 5)
            }
          }
        : a
    )
  }

  mutate('appointments')
  mutate('pets')
  mutate(`history-${appointment.petId}`)

  return record
}
