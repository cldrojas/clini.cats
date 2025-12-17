import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardClient } from '@/components/dashboard-client'

// export default function ClinicApp() {
//   redirect("/dashboard")

//   const [role, setRole] = useState<UserRole | null>(null)
//   const [activeTab, setActiveTab] = useState("agenda")
//   const [currentConsultationId, setCurrentConsultationId] = useState<string | null>(null)

//   if (!role) {
//     return <RoleSelector onSelectRole={setRole} />
//   }

//   const handleBack = () => {
//     setRole(null)
//     setActiveTab("agenda")
//     setCurrentConsultationId(null)
//   }

//   const handleStartConsultation = (appointmentId: string) => {
//     setCurrentConsultationId(appointmentId)
//     setActiveTab("consultation")
//   }

//   const getTitle = () => {
//     if (role === "receptionist") {
//       if (activeTab === "agenda") return "Agenda"
//       if (activeTab === "waiting") return "Sala de Espera"
//       return "Pacientes"
//     }
//     if (role === "doctor") {
//       if (activeTab === "waiting") return "Sala de Espera"
//       if (activeTab === "patients") return "Pacientes"
//       return "Consulta"
//     }
//     if (role === "assistant") {
//       if (activeTab === "consultation") return "Datos del Paciente"
//       return "Pacientes"
//     }
//     return null
//   }

//   const renderContent = () => {
//     if (role === "receptionist") {
//       if (activeTab === "agenda") return <AgendaView />
//       if (activeTab === "waiting") return <WaitingRoomCheckin />
//       return <PatientsListShared />
//     }

//     if (role === "doctor") {
//       if (activeTab === "waiting") {
//         return <WaitingRoomView onStartConsultation={handleStartConsultation} />
//       }
//       if (activeTab === "patients") {
//         return <PatientsListShared />
//       }
//       return <ConsultationPanel appointmentId={currentConsultationId} />
//     }

//     if (role === "assistant") {
//       if (activeTab === "consultation") return <PetDataEditor />
//       return <PatientsListShared />
//     }

//     return null
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Header role={role} title={getTitle()} onBack={handleBack} />
//       <main>{renderContent()}</main>
//       <BottomNav role={role} activeTab={activeTab} onTabChange={setActiveTab} />
//     </div>
//   )
// }

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log(`DEBUG:user, userError:`, user, userError)
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If no profile exists, redirect to login with error
    redirect('/auth/login?error=no_profile')
  }

  return <DashboardClient profile={profile} />
}
