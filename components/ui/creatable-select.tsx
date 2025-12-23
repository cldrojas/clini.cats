'use client'

import { useState, useMemo } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreatableSelectProps<T> {
  items: T[]
  getLabel: (item: T) => string
  getValue: (item: T) => string
  placeholder: string
  label?: string
  onSelect: (item: T) => void
  onCreate?: (newItem: string) => void
  allowCreate?: boolean
  selectedValue?: string
  onClear?: () => void
  renderItem?: (item: T) => React.ReactNode
  className?: string
  icon?: React.ComponentType<{ className?: string }>
  filterItems?: (item: T, searchTerm: string) => boolean
}

export function CreatableSelect<T>({
  items,
  getLabel,
  getValue,
  placeholder,
  label,
  onSelect,
  onCreate,
  allowCreate = false,
  selectedValue,
  onClear,
  className = '',
  icon,
  filterItems,
  renderItem
}: CreatableSelectProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const inputClassName = icon
    ? 'pl-9 pr-10 placeholder:text-ellipsis'
    : 'pl-3 pr-10 placeholder:text-ellipsis'
  const IconComponent = icon

  // Función para filtrar items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items

    const term = searchTerm.toLowerCase().trim()
    return items.filter((item) => {
      if (filterItems) {
        return filterItems(item, term)
      } else {
        const label = getLabel(item).toLowerCase()
        return label.includes(term)
      }
    })
  }, [items, searchTerm, getLabel, filterItems])

  // Obtener el item seleccionado
  const selectedItem = useMemo(() => {
    return items.find((item) => getValue(item) === selectedValue)
  }, [items, selectedValue, getValue])

  // Manejar selección de item
  const handleSelectItem = (item: T) => {
    onSelect(item)
    setSearchTerm(getLabel(item))
    setShowDropdown(false)
  }

  // Manejar creación de nuevo item
  const handleCreateItem = () => {
    if (onCreate && searchTerm.trim()) {
      onCreate(searchTerm.trim())
      setShowDropdown(false)
    }
  }

  // Limpiar selección
  const clearSelection = () => {
    if (onClear) onClear()
    setSearchTerm('')
    setShowDropdown(false)
  }

  const hasExactMatch = filteredItems.some(
    (item) => getLabel(item).toLowerCase() === searchTerm.toLowerCase().trim()
  )

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <div className="relative">
          {IconComponent && (
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          )}
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
            className={inputClassName}
          />
          {selectedItem && searchTerm && (
            <button
              onClick={clearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-popover rounded-sm shadow-lg max-h-60 overflow-y-auto">
            {filteredItems.length === 0 && !allowCreate ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchTerm.trim()
                  ? 'No se encontraron resultados'
                  : 'Escribe para buscar...'}
              </div>
            ) : (
              <>
                {filteredItems.map((item) => (
                  <button
                    key={getValue(item)}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left px-4 py-2 text-sm hover:cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                      selectedValue === getValue(item)
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                  >
                    {renderItem ? renderItem(item) : getLabel(item)}
                  </button>
                ))}
                {allowCreate && searchTerm.trim() && !hasExactMatch && (
                  <button
                    onClick={handleCreateItem}
                    className="w-full text-left px-4 py-2 text-sm hover:cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border-t border-border"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Crear "{searchTerm.trim()}"</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
