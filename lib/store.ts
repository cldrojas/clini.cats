import useSWR, { mutate } from 'swr'

// Types
export interface Pet {
  id: string
  name: string
  species: 'cat'
  breed: string
  age: string
  weight: string
  ownerName: string
  ownerPhone: string
  photo: string
  vaccines: string[]
  medicalNotes: string[]
}

export interface MedicalRecord {
  id: string
  date: string
  reason: string
  notes: string[]
  voiceNotes: string[]
  weight: string
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
const mockPets: Pet[] = [
  {
    id: '1',
    name: 'Michi',
    species: 'cat',
    breed: 'Persa',
    age: '3 años',
    weight: '4.2 kg',
    ownerName: 'María García',
    ownerPhone: '+57 300 123 4567',
    photo: '/persian-cat-face.jpg',
    vaccines: ['Triple felina', 'Rabia'],
    medicalNotes: ['Alergia leve a pollo']
  },
  {
    id: '2',
    name: 'Luna',
    species: 'cat',
    breed: 'Siamés',
    age: '5 años',
    weight: '3.8 kg',
    ownerName: 'Carlos Rodríguez',
    ownerPhone: '+57 310 987 6543',
    photo: '/siamese-cat-face.jpg',
    vaccines: ['Triple felina', 'Rabia', 'Leucemia'],
    medicalNotes: []
  },
  {
    id: '3',
    name: 'Simba',
    species: 'cat',
    breed: 'Naranja Común',
    age: '2 años',
    weight: '5.1 kg',
    ownerName: 'Ana Martínez',
    ownerPhone: '+57 320 456 7890',
    photo: '/orange-tabby-cat-face.jpg',
    vaccines: ['Triple felina'],
    medicalNotes: ['Tendencia a obesidad']
  },
  {
    id: '4',
    name: 'Nala',
    species: 'cat',
    breed: 'Maine Coon',
    age: '4 años',
    weight: '6.5 kg',
    ownerName: 'Pedro Sánchez',
    ownerPhone: '+57 315 111 2222',
    photo: '/maine-coon-cat-face.jpg',
    vaccines: ['Triple felina', 'Rabia'],
    medicalNotes: ['Revisión dental pendiente']
  }
]

const today = new Date().toISOString().split('T')[0]

const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    petId: '1',
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
    petId: '2',
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
    petId: '3',
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
    petId: '4',
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

  // Update pet medical notes if there's a diagnosis
  if (appointment.diagnosis) {
    const summaryNote = `${new Date().toLocaleDateString()}: ${
      appointment.diagnosis
    }`
    pets = pets.map((p) =>
      p.id === appointment.petId
        ? { ...p, medicalNotes: [summaryNote, ...p.medicalNotes].slice(0, 5) }
        : p
    )
    appointments = appointments.map((a) =>
      a.petId === appointment.petId
        ? {
            ...a,
            pet: {
              ...a.pet,
              medicalNotes: [summaryNote, ...a.pet.medicalNotes].slice(0, 5)
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
