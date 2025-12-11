"use client"

import { Search } from "lucide-react"
import { useState } from "react"
import { usePets } from "@/lib/store"
import { Input } from "@/components/ui/input"

export function PatientsList() {
  const { pets } = usePets()
  const [search, setSearch] = useState("")

  const filteredPets = pets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 pb-24">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Pacientes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o dueño..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredPets.map((pet) => (
          <div key={pet.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <img
              src={pet.photo || "/placeholder.svg"}
              alt={pet.name}
              className="w-12 h-12 rounded-xl object-cover bg-muted"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{pet.name}</h3>
              <p className="text-sm text-muted-foreground">
                {pet.breed} • {pet.age}
              </p>
              <p className="text-xs text-muted-foreground">{pet.ownerName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{pet.weight || "—"}</p>
              <p className="text-xs text-muted-foreground">{pet.vaccines.length} vacunas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
