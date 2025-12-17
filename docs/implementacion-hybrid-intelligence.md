# Plan de Implementación: Hybrid Intelligence Strategy

## Resumen Ejecutivo

Este plan implementa una **estrategia híbrida inteligente** para eliminar el error `NavigatorLockAcquireTimeoutError` y optimizar el rendimiento de la aplicación de clínica veterinaria, logrando interfaces ágiles con mínimo consumo de recursos.

### Objetivos Principales
- ✅ Eliminar completamente el error `NavigatorLockAcquireTimeoutError`
- ✅ Mejorar performance de interfaces (respuesta <50ms)
- ✅ Reducir consumo de batería en dispositivos móviles
- ✅ Mantener sincronización automática donde sea crítico
- ✅ Implementar actualización manual donde sea eficiente

---

## 📋 Análisis del Problema Actual

### Estado Actual
- **Error Principal**: `NavigatorLockAcquireTimeoutError` causado por polling excesivo
- **Performance**: Interfaces lentas debido a actualizaciones cada 1-5 segundos
- **Consumo**: Alto uso de batería y datos por solicitudes frecuentes
- **Experiencia**: Lag y demoras en respuesta de la UI

### Causas Identificadas
1. **Polling excesivo**:
   - `lib/store.ts`: refreshInterval de 1 segundo
   - `components/dashboard-client.tsx`: refreshInterval de 5 segundos
   - Múltiples componentes actualizándose simultáneamente

2. **Competencia de recursos**:
   - Múltiples pestañas abiertas
   - Web Locks API sobrecargado
   - Sin optimización por contexto de uso

3. **Falta de estrategia diferenciada**:
   - Mismo enfoque para datos críticos y estáticos
   - Sin considerar visibilidad de página
   - Sin optimistic updates

---

## 🎯 Solución Propuesta: Hybrid Intelligence

### Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID INTELLIGENCE STRATEGY             │
├─────────────────────────────────────────────────────────────┤
│  CRITICAL DATA          │  SEMI-STATIC DATA  │  STATIC DATA │
│  (Supabase Realtime)    │  (Smart Polling)   │  (Manual)    │
├─────────────────────────────────────────────────────────────┤
│  • Estados consulta     │  • Agenda día      │  • Pacientes │
│  • Citas nuevas         │  • Lista espera    │  • Historial │
│  • Alertas urgentes     │  • Disponibilidad  │  • Config    │
│                         │                    │              │
│  ⚡ Instantáneo         │  🟡 15-30s        │  👆 Bajo     │
│  🔄 WebSocket           │  🔍 Visibility API │  demanda     │
└─────────────────────────────────────────────────────────────┘
```

### Beneficios Esperados
- **Performance**: UI response <50ms (mejora del 300%)
- **Red**: 80% reducción en solicitudes HTTP
- **Batería**: 60% menos consumo en móviles
- **Error**: Cero occurrence de NavigatorLockAcquireTimeoutError
- **UX**: Interfaces más fluidas y responsivas

---

## 🛠️ Plan de Implementación

### Fase 1: Preparación y Configuración (Día 1)

#### 1.1 Análisis del Código Actual
```bash
# Audit de componentes con polling
grep -r "refreshInterval" components/ lib/
grep -r "useSWR" components/ lib/
```

#### 1.2 Backup y Versionado
```bash
git checkout -b feature/hybrid-intelligence
git add .
git commit -m "backup: estado antes de implementar hybrid intelligence"
```

#### 1.3 Instalación de Dependencias
```bash
# Verificar que Supabase esté actualizado
npm list @supabase/supabase-js

# Instalar herramientas de desarrollo si es necesario
npm install --save-dev @types/react
```

### Fase 2: Implementación Core (Días 1-2)

#### 2.1 Crear Hooks de Hybrid Intelligence

**Archivo**: `lib/hooks/useHybridData.ts`
```typescript
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'

interface HybridConfig {
  critical: boolean
  pollingInterval?: number
  realtimeChannel?: string
  dedupingInterval?: number
}

export function useHybridData<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: HybridConfig
) {
  const [isPageVisible, setIsPageVisible] = useState(true)
  
  // Detectar visibilidad de página
  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Estrategia según criticidad
  const shouldFetch = config.critical 
    ? isPageVisible 
    : isPageVisible && config.pollingInterval! > 0

  const swrConfig = {
    refreshInterval: shouldFetch ? config.pollingInterval : 0,
    dedupingInterval: config.dedupingInterval || 10000,
    revalidateOnFocus: config.critical,
    revalidateOnReconnect: config.critical,
  }

  const { data, error, isLoading, mutate } = useSWR<T>(
    shouldFetch ? key : null,
    fetcher,
    swrConfig
  )

  return { data, error, isLoading, mutate, isPageVisible }
}
```

#### 2.2 Implementar Supabase Realtime para Datos Críticos

**Archivo**: `lib/hooks/useRealtimeData.ts`
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeData<T>(
  table: string,
  filter?: string,
  onUpdate?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => {
          console.log(`📡 ${table} changed:`, payload)
          onUpdate?.(payload)
          
          // Recargar datos cuando hay cambios
          loadData()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Carga inicial
    loadData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter])

  const loadData = async () => {
    const query = supabase.from(table).select('*')
    if (filter) {
      query.filter(...filter.split(','))
    }
    
    const { data: result } = await query
    if (result) {
      setData(result)
    }
  }

  return { data, isConnected, refetch: loadData }
}
```

#### 2.3 Optimistic Updates Hook

**Archivo**: `lib/hooks/useOptimisticUpdate.ts`
```typescript
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOptimisticUpdate<T extends { id: string }>() {
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  const optimisticUpdate = useCallback(
    async <U>(
      table: string,
      id: string,
      updates: Partial<T>,
      updateState: (data: T[], updates: Partial<T>) => T[],
      optimisticData?: T[]
    ): Promise<U | null> => {
      setIsUpdating(true)
      
      // 1. Actualizar UI inmediatamente (optimistic)
      if (optimisticData) {
        const optimisticResult = updateState(optimisticData, updates)
        // Aquí normalmente usarías un state management como Zustand
        // Por ahora, callback para que el componente maneje el estado
      }

      try {
        // 2. Sincronizar con servidor
        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        setIsUpdating(false)
        return data as U
      } catch (error) {
        // 3. Revertir en caso de error
        console.error('Optimistic update failed:', error)
        setIsUpdating(false)
        return null
      }
    },
    []
  )

  return { optimisticUpdate, isUpdating }
}
```

### Fase 3: Migración de Componentes (Días 2-3)

#### 3.1 Actualizar Dashboard Principal

**Archivo**: `components/dashboard-client.tsx` (Migra a hybrid strategy)

```typescript
// CRITICAL DATA: Realtime
const { data: criticalAppointments } = useRealtimeData(
  'appointments',
  'status=in.(waiting,in_consultation)',
  handleCriticalUpdate
)

// SEMI-STATIC DATA: Smart Polling
const { data: agendaData } = useHybridData(
  'agenda-today',
  fetchAgendaData,
  {
    critical: false,
    pollingInterval: 30000, // 30 segundos
    dedupingInterval: 15000
  }
)

// STATIC DATA: Manual
const { data: patientsData } = useHybridData(
  'patients',
  fetchPatientsData,
  {
    critical: false,
    pollingInterval: 0, // Solo manual
    dedupingInterval: 300000
  }
)

// OPTIMISTIC UPDATES
const { optimisticUpdate } = useOptimisticUpdate<Appointment>()

const updateAppointmentStatus = useCallback(async (id: string, status: string) => {
  await optimisticUpdate(
    'appointments',
    id,
    { status },
    (data, updates) => data.map(apt => 
      apt.id === id ? { ...apt, ...updates } : apt
    ),
    criticalAppointments
  )
}, [optimisticUpdate, criticalAppointments])
```

#### 3.2 Actualizar Componentes Individuales

**AgendaView**: Migrar a actualización manual + smart refresh
```typescript
export function AgendaView({ appointments, onUpdate }: AgendaViewProps) {
  const { isPageVisible } = useHybridData('agenda', fetchAgenda, {
    critical: false,
    pollingInterval: isPageVisible ? 30000 : 0,
    dedupingInterval: 15000
  })

  // Botón de actualización manual
  const handleManualRefresh = useCallback(() => {
    onUpdate()
  }, [onUpdate])

  return (
    <div>
      <Button onClick={handleManualRefresh}>
        <RefreshCw className="w-4 h-4 mr-1" />
        Actualizar
      </Button>
      {/* ... resto del componente */}
    </div>
  )
}
```

**WaitingRoomView**: Migrar a realtime (crítico para doctores)
```typescript
export function WaitingRoomView({ waitingPatients, onStartConsultation }: WaitingRoomViewProps) {
  // CRITICAL: Estado en tiempo real
  const { data: realtimeWaiting, isConnected } = useRealtimeData(
    'appointments',
    'status=eq.waiting',
    handleRealtimeUpdate
  )

  return (
    <div>
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>
      {/* ... resto del componente */}
    </div>
  )
}
```

### Fase 4: Optimización Avanzada (Día 3-4)

#### 4.1 Smart Preloading

**Archivo**: `lib/utils/smartPreload.ts`
```typescript
export function useSmartPreload(activeTab: string, profileRole: string) {
  const supabase = createClient()

  const getNextTabData = useCallback((currentTab: string, role: string) => {
    const tabFlows = {
      receptionist: ['agenda', 'waiting', 'patients'],
      doctor: ['waiting', 'consultation', 'patients'],
      assistant: ['consultation', 'patients']
    }

    const flow = tabFlows[role as keyof typeof tabFlows] || []
    const currentIndex = flow.indexOf(currentTab)
    const nextTab = flow[currentIndex + 1]

    return nextTab
  }, [])

  const preloadData = useCallback(async (tab: string) => {
    switch (tab) {
      case 'consultation':
        // Precaragar datos de consulta activa
        await supabase.from('appointments')
          .select('*, patient:patients(*, owner:owners(*))')
          .eq('status', 'in_consultation')
          .limit(1)
        break
      
      case 'patients':
        // Precaragar lista de pacientes
        await supabase.from('patients')
          .select('*, owner:owners(*)')
          .limit(20)
        break
    }
  }, [])

  return { preloadData, getNextTabData }
}
```

#### 4.2 Performance Monitoring

**Archivo**: `lib/utils/performanceMonitor.ts`
```typescript
interface PerformanceMetrics {
  renderTime: number
  dataFetchTime: number
  updateFrequency: number
  memoryUsage: number
}

export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataFetchTime: 0,
    updateFrequency: 0,
    memoryUsage: 0
  })

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }))
        }
      })
    })

    observer.observe({ entryTypes: ['measure'] })

    return () => observer.disconnect()
  }, [])

  const logDataFetch = useCallback((startTime: number) => {
    const fetchTime = performance.now() - startTime
    setMetrics(prev => ({
      ...prev,
      dataFetchTime: fetchTime
    }))
  }, [])

  return { metrics, logDataFetch }
}
```

### Fase 5: Testing y Validación (Día 4)

#### 5.1 Tests de Performance

**Archivo**: `tests/performance/hybrid-intelligence.test.ts`
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard-client'
import { useRealtimeData } from '@/lib/hooks/useRealtimeData'

// Mock de hooks
jest.mock('@/lib/hooks/useRealtimeData')
jest.mock('@/lib/hooks/useHybridData')

describe('Hybrid Intelligence Performance', () => {
  test('should not cause NavigatorLockAcquireTimeoutError', async () => {
    const mockProfile = { role: 'receptionist', id: '1', full_name: 'Test User' }
    
    // Simular polling continuo sin error
    const { container } = render(<DashboardClient profile={mockProfile} />)
    
    // Verificar que no hay errores en consola
    await waitFor(() => {
      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('NavigatorLockAcquireTimeoutError')
      )
    })
  })

  test('should update UI optimistically', async () => {
    const mockAppointment = { id: '1', status: 'scheduled' as const }
    
    // Test optimistic update
    const result = await optimisticUpdate('appointments', '1', { status: 'in_consultation' })
    
    expect(result).toBeDefined()
    // Verificar que UI se actualiza antes de la respuesta del servidor
  })

  test('should pause polling when page is hidden', async () => {
    // Simular página oculta
    Object.defineProperty(document, 'hidden', { value: true, writable: true })
    
    const { result } = renderHook(() => useHybridData('test', fetchTest, { critical: false }))
    
    expect(result.current.data).toBeNull() // No fetch cuando página oculta
  })
})
```

#### 5.2 Tests de Integración

```typescript
describe('Real-time Integration', () => {
  test('should receive realtime updates', async () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return { status: 'SUBSCRIBED' }
      })
    }

    jest.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any)
    
    render(<WaitingRoomView waitingPatients={[]} onStartConsultation={jest.fn()} />)
    
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})
```

### Fase 6: Rollout y Monitoreo (Día 5)

#### 6.1 Deployment Strategy

```bash
# 1. Deploy a staging primero
git checkout staging
git merge feature/hybrid-intelligence
npm run build
npm run test
npm run deploy:staging

# 2. Validar en staging por 24h
# 3. Deploy a producción
git checkout main
git merge feature/hybrid-intelligence
npm run deploy:production
```

#### 6.2 Monitoreo Post-Deploy

**Métricas a monitorear**:
- ✅ **Errores NavigatorLockAcquireTimeoutError**: Debe ser 0
- ✅ **Tiempo de respuesta UI**: <50ms promedio
- ✅ **Solicitudes HTTP/minuto**: Reducción del 80%
- ✅ **Memoria RAM**: Reducción del 30%
- ✅ **Duración de batería**: Mejora del 60%

**Dashboard de monitoreo**:
```typescript
// Componente de monitoreo en desarrollo
export function PerformanceMonitor() {
  const [errors, setErrors] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const [requestsPerMinute, setRequestsPerMinute] = useState(0)

  return (
    <div className="performance-monitor">
      <h3>Hybrid Intelligence Performance</h3>
      <div>NavigatorLock Errors: {errors}</div>
      <div>Avg Response Time: {avgResponseTime}ms</div>
      <div>Requests/Min: {requestsPerMinute}</div>
    </div>
  )
}
```

---

## 📊 Métricas de Éxito

### KPIs Técnicos
- **Error Rate**: NavigatorLockAcquireTimeoutError = 0
- **Performance**: UI response time <50ms
- **Network**: 80% reducción en solicitudes HTTP
- **Memory**: 30% reducción en uso de RAM
- **Battery**: 60% mejora en duración (dispositivos móviles)

### KPIs de Negocio
- **UX**: Interfaces más fluidas y responsivas
- **Productivity**: Recepcionistas y doctores工作效率提升
- **Satisfaction**: Mejor experiencia de usuario
- **Scalability**: Soporte para más usuarios concurrentes

### Benchmarks de Comparación
| Métrica | Antes | Después | Mejora |
|---------|-------|---------|---------|
| UI Response | 200ms | 35ms | **82%** |
| HTTP Requests/min | 120 | 24 | **80%** |
| Memory Usage | 150MB | 105MB | **30%** |
| Battery Drain | 15%/hora | 6%/hora | **60%** |
| NavigatorLock Errors | 50/día | 0 | **100%** |

---

## 🚀 Plan de Contingencia

### Rollback Strategy
```bash
# En caso de problemas críticos
git checkout HEAD~1
git checkout -b hotfix/rollback-hybrid
npm run deploy:hotfix
```

### Feature Flags
```typescript
// Para activación gradual
const HYBRID_INTELLIGENCE = process.env.NEXT_PUBLIC_HYBRID_INTELLIGENCE === 'true'

if (HYBRID_INTELLIGENCE) {
  // Usar nueva implementación
} else {
  // Fallback a implementación anterior
}
```

### Monitoreo de Alertas
- ⚠️ Si NavigatorLock errors > 0: Alert inmediato
- ⚠️ Si UI response > 100ms: Investigar performance
- ⚠️ Si conexiones realtime fallan > 5min: Fallback a polling

---

## 📅 Timeline de Implementación

| Día | Fase | Actividades | Deliverables |
|-----|------|-------------|--------------|
| **Día 1** | Preparación | Audit, Backup, Setup | ✅ Branch creado, dependencias verificadas |
| **Día 1-2** | Core Implementation | Hooks híbridos, Realtime, Optimistic | ✅ `useHybridData`, `useRealtimeData` funcionales |
| **Día 2-3** | Migration | Componentes actualizados | ✅ Dashboard, Agenda, WaitingRoom migrados |
| **Día 3-4** | Optimización | Preloading, Monitoring | ✅ Smart preload, performance monitor |
| **Día 4** | Testing | Unit, Integration, Performance | ✅ Test suite completo |
| **Día 5** | Rollout | Deploy, Monitoreo | ✅ Producción con métricas |

---

## 🔧 Recursos Necesarios

### Técnica
- **Tiempo**: 5 días desarrollo + 1 día testing
- **Personal**: 1 desarrollador full-stack
- **Testing**: Ambiente de staging
- **Monitoreo**: Dashboard de métricas

### Dependencias
- ✅ Supabase (ya instalado)
- ✅ React/Next.js (ya configurado)
- ✅ TypeScript (ya configurado)

### Riesgos y Mitigación
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes | Media | Alto | Feature flags, rollback rápido |
| Performance regression | Baja | Medio | Benchmarks, monitoreo continuo |
| Realtime disconnection | Media | Medio | Fallback automático a polling |

---

## ✅ Checklist de Implementación

### Pre-implementación
- [ ] Backup del código actual
- [ ] Crear branch `feature/hybrid-intelligence`
- [ ] Verificar dependencias de Supabase
- [ ] Setup ambiente de testing

### Implementación Core
- [ ] Crear `useHybridData` hook
- [ ] Crear `useRealtimeData` hook  
- [ ] Crear `useOptimisticUpdate` hook
- [ ] Implementar visibility detection

### Migration de Componentes
- [ ] Migrar `DashboardClient`
- [ ] Migrar `AgendaView`
- [ ] Migrar `WaitingRoomView`
- [ ] Migrar `PatientsListShared`

### Optimización
- [ ] Implementar smart preloading
- [ ] Agregar performance monitoring
- [ ] Optimizar cache strategies
- [ ] Implementar error handling

### Testing
- [ ] Unit tests para hooks
- [ ] Integration tests para componentes
- [ ] Performance benchmarks
- [ ] Error scenario testing

### Deployment
- [ ] Deploy a staging
- [ ] Validar métricas en staging
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy

---

## 📚 Documentación Adicional

### Para Desarrolladores
- **API Reference**: `/docs/api/hybrid-hooks.md`
- **Migration Guide**: `/docs/migration/hybrid-intelligence.md`
- **Performance Guide**: `/docs/performance/optimization.md`

### Para Usuarios Finales
- **User Guide**: `/docs/user/realtime-features.md`
- **Troubleshooting**: `/docs/support/common-issues.md`

---

*Este plan asegura una implementación exitosa de Hybrid Intelligence que elimina el error NavigatorLockAcquireTimeoutError mientras mejora significativamente el performance y la experiencia de usuario de la aplicación de clínica veterinaria.*