export type Role = "receptionist" | "doctor" | "assistant"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface Owner {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  created_at: string
}

export interface Patient {
  id: string
  name: string
  breed?: string
  age?: string
  weight?: number
  color?: string
  owner_id: string
  owner?: Owner
  vaccines: string[]
  notes?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  patient?: Patient
  date: string
  time: string
  reason?: string
  status: "scheduled" | "waiting" | "in_consultation" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  appointment_id?: string
  date: string
  weight?: number
  diagnosis?: string
  treatment?: string
  notes?: string
  doctor_id?: string
  documents?: Document[]
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  medical_record_id?: string
  patient_id: string
  name: string
  url: string
  type?: string
  size?: number
  uploaded_by?: string
  created_at: string
}
