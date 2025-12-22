# Historias de Usuario Refinadas - Clínica Veterinaria Felina

## 📋 Resumen Ejecutivo

Este documento contiene las historias de usuario refinadas y mejoradas para el desarrollo de nuevas funcionalidades en la aplicación de clínica veterinaria felina. Las historias incluyen especificaciones técnicas detalladas, criterios de aceptación específicos, casos de prueba y mockups de interfaz.

## 🎯 Índice de Historias de Usuario

### 🔴 PRIORIDAD ALTA

1. [US-001: Prevención de Duplicados de Propietarios](#us-001)
2. [US-002: Campos Adicionales de Consulta (Temperatura, Presión)](#us-002)
3. [US-003: Vista de Receta Detallada](#us-003)

### 🟡 PRIORIDAD MEDIA

4. [US-004: Generación de PDFs para Recetas/Tratamientos](#us-004)
5. [US-005: Motivos de Consulta Predefinidos](#us-005)
6. [US-006: Gestión de Anamnesis](#us-006)

### 🟢 PRIORIDAD BAJA

7. [US-007: Programación de Próximas Citas](#us-007)
8. [US-008: Vista de Odontología](#us-008)

## 📊 Resumen de Estimaciones

| Prioridad | Historias | Días Totales | Porcentaje |
|-----------|-----------|--------------|------------|
| Alta      | 3         | 7-9 días     | 35%        |
| Media     | 3         | 7-9 días     | 35%        |
| Baja      | 2         | 7-10 días    | 30%        |
| **Total** | **8**     | **21-28 días** | **100%**  |

---

## US-001: Prevención de Duplicados de Propietarios {#us-001}

### Información General
- **ID:** US-001
- **Prioridad:** Alta
- **Estimación:** 2-3 días
- **Sprint:** 1
- **Roles:** Recepcionista
- **Epic:** Gestión de Propietarios

### Descripción
Como recepcionista, quiero que el sistema me ayude a evitar crear propietarios duplicados al agendar citas, para mantener la base de datos limpia y organizada, reduciendo inconsistencias y mejorando la eficiencia del flujo de trabajo.

### Criterios de Aceptación

#### Escenario 1: Búsqueda automática al agendar
**Dado que** estoy agendando una nueva cita
**Cuando** empiezo a escribir el nombre del propietario
**Entonces** el sistema debe mostrar sugerencias de propietarios existentes que coincidan con al menos 3 caracteres

**Casos de Prueba:**
- ✅ Búsqueda "Mar" → Muestra "María García", "Marcos López"
- ✅ Búsqueda "gar" → Muestra propietarios con "García" en el nombre
- ✅ Búsqueda "" (vacía) → No muestra sugerencias hasta 3 caracteres

#### Escenario 2: Validación por teléfono
**Dado que** estoy agendando una cita con un propietario que ya existe
**Cuando** ingreso un número de teléfono que coincide con un propietario existente
**Entonces** el sistema debe alertarme con un badge "Coincidencia exacta" y permitir usar los datos existentes

**Casos de Prueba:**
- ✅ Teléfono "+56912345678" → Coincide con "+56 9 1234 5678" → Mostrar alerta
- ✅ Teléfono "912345678" → Coincide con "+56912345678" → Mostrar alerta
- ❌ Teléfono diferente → No mostrar alerta

#### Escenario 3: Auto-completado de datos
**Dado que** selecciono un propietario existente de las sugerencias
**Cuando** procedo con la cita
**Entonces** todos los datos del propietario deben auto-completarse sin permitir edición, mostrando un badge "Usando datos existentes"

#### Escenario 4: Confirmación de duplicado
**Dado que** el sistema detecta un posible duplicado
**Cuando** intento crear un nuevo propietario
**Entonces** debo ver una confirmación modal explicando por qué se detectó el duplicado con opciones "Usar existente" o "Crear nuevo"

### Especificaciones Técnicas

#### Algoritmo de Detección Mejorado
```typescript
interface OwnerSearchResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  similarityScore: number;
  matchType: 'exact' | 'high' | 'medium' | 'low';
  matchedFields: string[];
}

function calculateSimilarityScore(
  inputData: Partial<Owner>,
  existingOwner: Owner
): OwnerSearchResult {
  let score = 0;
  const matchedFields: string[] = [];
  
  // Nombre (40% weight)
  if (inputData.name && existingOwner.name) {
    const nameSim = calculateStringSimilarity(inputData.name, existingOwner.name);
    if (nameSim > 0.7) {
      score += nameSim * 0.4;
      matchedFields.push('name');
    }
  }
  
  // Teléfono (35% weight)
  if (inputData.phone && existingOwner.phone) {
    const normalizedInput = normalizePhoneNumber(inputData.phone);
    const normalizedExisting = normalizePhoneNumber(existingOwner.phone);
    
    if (normalizedInput === normalizedExisting) {
      score += 0.35;
      matchedFields.push('phone');
    } else if (fuzzyPhoneMatch(normalizedInput, normalizedExisting)) {
      score += 0.25;
      matchedFields.push('phone');
    }
  }
  
  // Email (25% weight)
  if (inputData.email && existingOwner.email) {
    const normalizedInput = inputData.email.toLowerCase().trim();
    const normalizedExisting = existingOwner.email.toLowerCase().trim();
    
    if (normalizedInput === normalizedExisting) {
      score += 0.25;
      matchedFields.push('email');
    } else if (fuzzyEmailMatch(normalizedInput, normalizedExisting)) {
      score += 0.15;
      matchedFields.push('email');
    }
  }
  
  const matchType: OwnerSearchResult['matchType'] = 
    score >= 0.8 ? 'exact' :
    score >= 0.6 ? 'high' :
    score >= 0.4 ? 'medium' : 'low';
  
  return {
    id: existingOwner.id,
    name: existingOwner.name,
    phone: existingOwner.phone,
    email: existingOwner.email,
    address: existingOwner.address,
    similarityScore: score,
    matchType,
    matchedFields
  };
}
```

#### API Endpoint
```typescript
// GET /api/owners/search?q={searchTerm}&limit={limit}
interface SearchOwnersRequest {
  searchTerm: string;
  limit?: number;
}

interface SearchOwnersResponse {
  results: OwnerSearchResult[];
  total: number;
  took: number; // tiempo de búsqueda en ms
}
```

#### Base de Datos - Índices Optimizados
```sql
-- Índices para búsqueda rápida
CREATE INDEX CONCURRENTLY idx_owners_name_gin ON owners USING gin(to_tsvector('spanish', name));
CREATE INDEX CONCURRENTLY idx_owners_phone_btree ON owners(phone);
CREATE INDEX CONCURRENTLY idx_owners_email_btree ON owners(email);

-- Función para búsqueda full-text
CREATE OR REPLACE FUNCTION search_owners(search_query text, max_results int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  address text,
  rank real
) 
LANGUAGE sql
AS $$
  SELECT 
    o.id,
    o.name,
    o.phone,
    o.email,
    o.address,
    ts_rank(to_tsvector('spanish', o.name || ' ' || COALESCE(o.email, '')), plainto_tsquery('spanish', search_query)) as rank
  FROM owners o
  WHERE 
    to_tsvector('spanish', o.name || ' ' || COALESCE(o.email, '')) @@ plainto_tsquery('spanish', search_query)
    OR o.name ILIKE '%' || search_query || '%'
    OR o.phone LIKE '%' || search_query || '%'
  ORDER BY rank DESC, o.name ASC
  LIMIT max_results;
$$;
```

#### Componente UI Refinado
```tsx
interface OwnerSearchProps {
  onSelect: (owner: OwnerSearchResult) => void;
  onCreateNew: () => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

function OwnerSearch({ onSelect, onCreateNew, placeholder, className, disabled }: OwnerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<OwnerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Perform search
  useEffect(() => {
    if (debouncedSearchTerm.length >= 3) {
      searchOwners(debouncedSearchTerm).then(setResults);
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);
  
  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (results.length + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? results.length : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            onSelect(results[selectedIndex]);
          } else {
            onCreateNew();
          }
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Spinner className="w-4 h-4" />
          ) : searchTerm.length >= 3 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateNew}
              className="text-primary hover:text-primary/80"
            >
              Nuevo
            </Button>
          ) : null}
        </div>
      </div>
      
      {showDropdown && (results.length > 0 || searchTerm.length >= 3) && (
        <Dropdown className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Resultados de búsqueda */}
          {results.map((result, index) => (
            <DropdownItem
              key={result.id}
              onClick={() => {
                onSelect(result);
                setShowDropdown(false);
              }}
              className={`cursor-pointer ${selectedIndex === index ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{result.name}</span>
                    <Badge variant={getMatchTypeVariant(result.matchType)} className="text-xs">
                      {result.matchType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">{result.phone}</span>
                    {result.email && (
                      <>
                        <Mail className="w-3 h-3 ml-2" />
                        <span className="truncate">{result.email}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {result.matchedFields.map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field === 'name' ? 'Nombre' : field === 'phone' ? 'Teléfono' : 'Email'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
              </div>
            </DropdownItem>
          ))}
          
          {/* Opción crear nuevo */}
          <DropdownItem
            onClick={() => {
              onCreateNew();
              setShowDropdown(false);
            }}
            className={`cursor-pointer border-t ${selectedIndex === results.length ? 'bg-accent' : ''}`}
          >
            <div className="flex items-center gap-2 text-primary">
              <Plus className="w-4 h-4" />
              <span>Crear nuevo propietario</span>
            </div>
          </DropdownItem>
        </Dropdown>
      )}
    </div>
  );
}

function getMatchTypeVariant(matchType: string): BadgeVariant {
  switch (matchType) {
    case 'exact': return 'default'; // verde
    case 'high': return 'secondary'; // azul
    case 'medium': return 'outline'; // amarillo
    default: return 'outline'; // gris
  }
}
```

#### Casos de Prueba Detallados
```typescript
describe('Owner Search System', () => {
  describe('Search Functionality', () => {
    it('should find owners by name partial match', async () => {
      const results = await searchOwners('Mar');
      expect(results).toHaveLength(2);
      expect(results[0].name).toContain('María');
      expect(results[0].matchType).toBe('high');
    });
    
    it('should find owners by phone number', async () => {
      const results = await searchOwners('912345678');
      expect(results).toHaveLength(1);
      expect(results[0].matchType).toBe('exact');
      expect(results[0].matchedFields).toContain('phone');
    });
    
    it('should not show results for less than 3 characters', async () => {
      const results = await searchOwners('Ma');
      expect(results).toHaveLength(0);
    });
  });
  
  describe('Duplicate Detection', () => {
    it('should detect exact phone match', async () => {
      const inputOwner = { phone: '+56912345678' };
      const existingOwner = { phone: '+56 9 1234 5678' };
      const result = calculateSimilarityScore(inputOwner, existingOwner);
      expect(result.matchType).toBe('exact');
      expect(result.matchedFields).toContain('phone');
    });
    
    it('should detect high name similarity', async () => {
      const inputOwner = { name: 'María García López' };
      const existingOwner = { name: 'María García' };
      const result = calculateSimilarityScore(inputOwner, existingOwner);
      expect(result.matchType).toBe('high');
      expect(result.similarityScore).toBeGreaterThan(0.7);
    });
  });
  
  describe('UI Interactions', () => {
    it('should show dropdown when typing', async () => {
      render(<OwnerSearch onSelect={jest.fn()} onCreateNew={jest.fn()} />);
      const input = screen.getByPlaceholderText('Buscar propietario...');
      
      fireEvent.change(input, { target: { value: 'María' } });
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
    
    it('should allow keyboard navigation', async () => {
      render(<OwnerSearch onSelect={jest.fn()} onCreateNew={jest.fn()} />);
      const input = screen.getByPlaceholderText('Buscar propietario...');
      
      fireEvent.change(input, { target: { value: 'María' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Should highlight first result
      expect(screen.getByText('María García')).toHaveClass('bg-accent');
    });
  });
});
```

### Tareas de Desarrollo
- [ ] Crear función de búsqueda optimizada en base de datos
- [ ] Implementar algoritmo de similitud
- [ ] Desarrollar componente OwnerSearch
- [ ] Crear API endpoints de búsqueda
- [ ] Implementar casos de prueba
- [ ] Testing de performance con dataset grande

### Dependencias
- Tabla owners existente
- Componente de autocompletado
- Sistema de normalización de teléfonos

---

## US-002: Campos Adicionales de Consulta (Temperatura, Presión) {#us-002}

### Información General
- **ID:** US-002
- **Prioridad:** Alta
- **Estimación:** 1-2 días
- **Sprint:** 1
- **Roles:** Doctor, Asistente
- **Epic:** Signos Vitales

### Descripción
Como doctor/asistente, quiero registrar la temperatura, presión arterial y frecuencia cardíaca de las mascotas durante la consulta, para tener un registro completo de signos vitales que me permita hacer un diagnóstico más preciso y seguir la evolución del paciente.

### Criterios de Aceptación

#### Escenario 1: Registro de temperatura
**Dado que** estoy finalizando una consulta
**Cuando** ingreso la temperatura del paciente
**Entonces** el sistema debe validar que esté en un rango razonable (35-42°C para gatos) y mostrar advertencias para valores fuera del rango normal (37.5-39.5°C)

**Casos de Prueba:**
- ✅ Temperatura normal: 38.5°C → Aceptar sin warnings
- ✅ Temperatura límite: 35.0°C → Aceptar con warning
- ✅ Temperatura límite: 42.0°C → Aceptar con warning
- ❌ Temperatura baja: 34.5°C → Mostrar error
- ❌ Temperatura alta: 42.5°C → Mostrar error
- ❌ Formato inválido: "abc" → Mostrar error

#### Escenario 2: Registro de presión arterial
**Dado que** estoy finalizando una consulta
**Cuando** ingreso la presión arterial
**Entonces** el sistema debe aceptar formatos como "120/80", "120 sistólica / 80 diastólica" o texto libre

**Casos de Prueba:**
- ✅ Formato estándar: "120/80" → Aceptar
- ✅ Con texto: "120 sistólica / 80 diastólica" → Aceptar
- ✅ Solo sistólica: "120" → Aceptar con warning
- ✅ Formato con espacio: "120 / 80" → Aceptar
- ❌ Formato inválido: "abc/def" → Mostrar error
- ❌ Valores imposibles: "300/200" → Mostrar warning

#### Escenario 3: Frecuencia cardíaca
**Dado que** estoy finalizando una consulta
**Cuando** ingreso la frecuencia cardíaca
**Entonces** el sistema debe validar que esté en un rango razonable para felinos (60-200 lpm)

**Casos de Prueba:**
- ✅ Frecuencia normal: 140 lpm → Aceptar
- ✅ Frecuencia baja: 65 lpm → Aceptar con warning
- ✅ Frecuencia alta: 195 lpm → Aceptar con warning
- ❌ Frecuencia muy baja: 45 lpm → Mostrar error
- ❌ Frecuencia muy alta: 250 lpm → Mostrar error

#### Escenario 4: Campos opcionales
**Dado que** no tengo todos los datos vitales
**Cuando** dejo algunos campos vacíos
**Entonces** la consulta debe guardarse sin errores y mostrar campos vacíos en el historial

**Casos de Prueba:**
- ✅ Solo temperatura: 38.5°C → Guardar exitosamente
- ✅ Solo presión: "120/80" → Guardar exitosamente
- ✅ Completos: temperatura + presión + frecuencia → Guardar exitosamente
- ✅ Todos vacíos → Guardar exitosamente

#### Escenario 5: Historial con signos vitales
**Dado que** reviso el historial médico de un paciente
**Cuando** veo consultas anteriores
**Entonces** debo poder ver todos los signos vitales registrados en cada consulta con indicadores visuales para valores anormales

**Visualización Esperada:**
```
📅 15 Nov 2024 - Consulta General
   🌡️  38.5°C    💓  120/80 mmHg    ❤️  140 lpm    ⚖️  4.2 kg
   ✅ Todos los signos vitales dentro de rango normal
   
📅 10 Nov 2024 - Vacunación  
   🌡️  38.2°C    💓  --            ❤️  --        ⚖️  4.1 kg
   ⚠️  Temperatura ligeramente baja, valores no registrados
   
📅 05 Nov 2024 - Control
   🌡️  39.8°C    💓  140/90 mmHg    ❤️  160 lpm    ⚖️  4.0 kg
   ⚠️  Temperatura y presión elevadas - seguimiento necesario
```

### Especificaciones Técnicas

#### Esquema de Base de Datos
```sql
-- Migración para medical_records
ALTER TABLE medical_records 
ADD COLUMN temperature DECIMAL(4,1) 
    CHECK (temperature IS NULL OR (temperature >= 30.0 AND temperature <= 45.0))
    COMMENT 'Temperatura corporal en Celsius (35-42°C normal para felinos)',

ADD COLUMN blood_pressure VARCHAR(50)
    COMMENT 'Presión arterial en formato sistólica/diastólica o texto libre',

ADD COLUMN heart_rate INTEGER
    CHECK (heart_rate IS NULL OR (heart_rate >= 40 AND heart_rate <= 250))
    COMMENT 'Frecuencia cardíaca en latidos por minuto (60-200 normal)',

ADD COLUMN respiratory_rate INTEGER
    CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 10 AND respiratory_rate <= 60))
    COMMENT 'Frecuencia respiratoria en respiraciones por minuto',

ADD COLUMN capillary_refill_time INTEGER
    CHECK (capillary_refill_time IS NULL OR (capillary_refill_time >= 1 AND capillary_refill_time <= 4))
    COMMENT 'Tiempo de llenado capilar en segundos';

-- Índices para performance
CREATE INDEX idx_medical_records_temperature ON medical_records(temperature);
CREATE INDEX idx_medical_records_blood_pressure ON medical_records(blood_pressure);
CREATE INDEX idx_medical_records_heart_rate ON medical_records(heart_rate);

-- Vista para rangos normales
CREATE VIEW vital_signs_normal_ranges AS
SELECT 
  'temperature' as vital_sign,
  37.5 as normal_min,
  39.5 as normal_max,
  35.0 as critical_min,
  42.0 as critical_max
UNION ALL
SELECT 
  'heart_rate' as vital_sign,
  120 as normal_min,
  140 as normal_max,
  60 as critical_min,
  200 as critical_max
UNION ALL
SELECT 
  'respiratory_rate' as vital_sign,
  20 as normal_min,
  30 as normal_max,
  10 as critical_min,
  60 as critical_max;

-- Función para evaluar signos vitales
CREATE OR REPLACE FUNCTION evaluate_vital_signs(
  temp DECIMAL,
  bp VARCHAR,
  hr INTEGER,
  rr INTEGER,
  crt INTEGER
)
RETURNS TABLE (
  vital_sign TEXT,
  value TEXT,
  status TEXT,
  message TEXT,
  severity TEXT
)
LANGUAGE sql
AS $$
  SELECT 
    'temperature' as vital_sign,
    temp::TEXT as value,
    CASE 
      WHEN temp IS NULL THEN 'not_recorded'
      WHEN temp < 35.0 OR temp > 45.0 THEN 'critical'
      WHEN temp < 37.5 OR temp > 39.5 THEN 'warning'
      ELSE 'normal'
    END as status,
    CASE 
      WHEN temp IS NULL THEN 'Temperatura no registrada'
      WHEN temp < 35.0 THEN 'Hipotermia severa'
      WHEN temp < 37.5 THEN 'Temperatura baja'
      WHEN temp > 42.0 THEN 'Hipertemia severa'
      WHEN temp > 39.5 THEN 'Temperatura elevada'
      ELSE 'Temperatura normal'
    END as message,
    CASE 
      WHEN temp IS NULL THEN 'info'
      WHEN temp < 35.0 OR temp > 42.0 THEN 'error'
      WHEN temp < 37.5 OR temp > 39.5 THEN 'warning'
      ELSE 'success'
    END as severity
  WHERE temp IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'heart_rate' as vital_sign,
    hr::TEXT as value,
    CASE 
      WHEN hr IS NULL THEN 'not_recorded'
      WHEN hr < 60 OR hr > 200 THEN 'critical'
      WHEN hr < 120 OR hr > 140 THEN 'warning'
      ELSE 'normal'
    END as status,
    CASE 
      WHEN hr IS NULL THEN 'Frecuencia cardíaca no registrada'
      WHEN hr < 60 THEN 'Bradicardia severa'
      WHEN hr < 120 THEN 'Frecuencia cardíaca baja'
      WHEN hr > 200 THEN 'Taquicardia severa'
      WHEN hr > 140 THEN 'Frecuencia cardíaca elevada'
      ELSE 'Frecuencia cardíaca normal'
    END as message,
    CASE 
      WHEN hr IS NULL THEN 'info'
      WHEN hr < 60 OR hr > 200 THEN 'error'
      WHEN hr < 120 OR hr > 140 THEN 'warning'
      ELSE 'success'
    END as severity
  WHERE hr IS NOT NULL;
$$;
```

#### Tipos TypeScript
```typescript
interface VitalSigns {
  temperature?: number; // 35.0 - 45.0°C
  bloodPressure?: string; // "120/80" o texto libre
  heartRate?: number; // 60 - 200 lpm
  respiratoryRate?: number; // 20 - 30 rpm
  capillaryRefillTime?: number; // 1-2 segundos normal
}

interface VitalSignEvaluation {
  vitalSign: 'temperature' | 'heartRate' | 'respiratoryRate' | 'bloodPressure' | 'capillaryRefillTime';
  value: string;
  status: 'normal' | 'warning' | 'critical' | 'not_recorded';
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface VitalSignsValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  evaluations: VitalSignEvaluation[];
}

interface ValidationError {
  field: keyof VitalSigns;
  message: string;
  code: string;
  severity: 'error';
}

interface ValidationWarning {
  field: keyof VitalSigns;
  message: string;
  severity: 'info' | 'warning';
}

interface NormalRange {
  vitalSign: string;
  normalMin: number;
  normalMax: number;
  criticalMin: number;
  criticalMax: number;
}
```

#### Validaciones Frontend
```typescript
function validateVitalSigns(vitals: VitalSigns): VitalSignsValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const evaluations: VitalSignEvaluation[] = [];
  
  // Rangos normales para felinos
  const normalRanges: Record<string, NormalRange> = {
    temperature: { vitalSign: 'temperature', normalMin: 37.5, normalMax: 39.5, criticalMin: 35.0, criticalMax: 42.0 },
    heartRate: { vitalSign: 'heartRate', normalMin: 120, normalMax: 140, criticalMin: 60, criticalMax: 200 },
    respiratoryRate: { vitalSign: 'respiratoryRate', normalMin: 20, normalMax: 30, criticalMin: 10, criticalMax: 60 }
  };
  
  // Validar temperatura
  if (vitals.temperature !== undefined) {
    const range = normalRanges.temperature;
    
    if (vitals.temperature < range.criticalMin || vitals.temperature > range.criticalMax) {
      errors.push({
        field: 'temperature',
        message: `Temperatura crítica: ${vitals.temperature}°C (normal: ${range.normalMin}-${range.normalMax}°C)`,
        code: 'TEMP_CRITICAL',
        severity: 'error'
      });
      evaluations.push({
        vitalSign: 'temperature',
        value: `${vitals.temperature}°C`,
        status: 'critical',
        message: 'Temperatura fuera de rango seguro',
        severity: 'error'
      });
    } else if (vitals.temperature < range.normalMin || vitals.temperature > range.normalMax) {
      warnings.push({
        field: 'temperature',
        message: `Temperatura fuera del rango normal: ${vitals.temperature}°C`,
        severity: 'warning'
      });
      evaluations.push({
        vitalSign: 'temperature',
        value: `${vitals.temperature}°C`,
        status: 'warning',
        message: 'Temperatura ligeramente fuera del rango normal',
        severity: 'warning'
      });
    } else {
      evaluations.push({
        vitalSign: 'temperature',
        value: `${vitals.temperature}°C`,
        status: 'normal',
        message: 'Temperatura normal',
        severity: 'success'
      });
    }
  } else {
    evaluations.push({
      vitalSign: 'temperature',
      value: '--',
      status: 'not_recorded',
      message: 'Temperatura no registrada',
      severity: 'info'
    });
  }
  
  // Validar presión arterial
  if (vitals.bloodPressure) {
    const bpPattern = /^(\d+)\s*\/\s*(\d+)$/;
    const match = vitals.bloodPressure.match(bpPattern);
    
    if (!match) {
      warnings.push({
        field: 'bloodPressure',
        message: 'Formato no estándar. Use formato sistólica/diastólica (ej: 120/80)',
        severity: 'info'
      });
      evaluations.push({
        vitalSign: 'bloodPressure',
        value: vitals.bloodPressure,
        status: 'warning',
        message: 'Formato de presión no estándar',
        severity: 'warning'
      });
    } else {
      const systolic = parseInt(match[1]);
      const diastolic = parseInt(match[2]);
      
      if (systolic >= 200 || diastolic >= 120) {
        warnings.push({
          field: 'bloodPressure',
          message: 'Presión arterial muy elevada - verificar medición',
          severity: 'warning'
        });
        evaluations.push({
          vitalSign: 'bloodPressure',
          value: vitals.bloodPressure,
          status: 'warning',
          message: 'Presión arterial elevada',
          severity: 'warning'
        });
      } else {
        evaluations.push({
          vitalSign: 'bloodPressure',
          value: vitals.bloodPressure,
          status: 'normal',
          message: 'Presión arterial dentro de rango',
          severity: 'success'
        });
      }
    }
  } else {
    evaluations.push({
      vitalSign: 'bloodPressure',
      value: '--',
      status: 'not_recorded',
      message: 'Presión arterial no registrada',
      severity: 'info'
    });
  }
  
  // Validar frecuencia cardíaca
  if (vitals.heartRate !== undefined) {
    const range = normalRanges.heartRate;
    
    if (vitals.heartRate < range.criticalMin || vitals.heartRate > range.criticalMax) {
      errors.push({
        field: 'heartRate',
        message: `Frecuencia cardíaca crítica: ${vitals.heartRate} lpm (normal: ${range.normalMin}-${range.normalMax} lpm)`,
        code: 'HR_CRITICAL',
        severity: 'error'
      });
      evaluations.push({
        vitalSign: 'heartRate',
        value: `${vitals.heartRate} lpm`,
        status: 'critical',
        message: 'Frecuencia cardíaca crítica',
        severity: 'error'
      });
    } else if (vitals.heartRate < range.normalMin || vitals.heartRate > range.normalMax) {
      warnings.push({
        field: 'heartRate',
        message: `Frecuencia cardíaca fuera del rango normal: ${vitals.heartRate} lpm`,
        severity: 'warning'
      });
      evaluations.push({
        vitalSign: 'heartRate',
        value: `${vitals.heartRate} lpm`,
        status: 'warning',
        message: 'Frecuencia cardíaca fuera del rango normal',
        severity: 'warning'
      });
    } else {
      evaluations.push({
        vitalSign: 'heartRate',
        value: `${vitals.heartRate} lpm`,
        status: 'normal',
        message: 'Frecuencia cardíaca normal',
        severity: 'success'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    evaluations
  };
}
```

#### Componente UI Refinado
```tsx
interface VitalSignsFormProps {
  vitals: VitalSigns;
  onChange: (vitals: VitalSigns) => void;
  validation: VitalSignsValidation;
  readonly?: boolean;
  compact?: boolean;
}

function VitalSignsForm({ vitals, onChange, validation, readonly = false, compact = false }: VitalSignsFormProps) {
  const getFieldClassName = (field: keyof VitalSigns) => {
    const evaluation = validation.evaluations.find(e => e.vitalSign === field);
    const hasError = validation.errors.some(e => e.field === field);
    const hasWarning = validation.warnings.some(e => e.field === field);
    
    if (hasError) return 'border-destructive focus:border-destructive';
    if (hasWarning) return 'border-yellow-500 focus:border-yellow-500';
    if (evaluation?.status === 'normal') return 'border-green-500 focus:border-green-500';
    return '';
  };
  
  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-card rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Thermometer className={`w-4 h-4 ${getIconColor('temperature')}`} />
            <span className="text-xs text-muted-foreground">Temp</span>
          </div>
          <span className={`text-sm font-medium ${getValueColor('temperature')}`}>
            {vitals.temperature ? `${vitals.temperature}°C` : '--'}
          </span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Heart className={`w-4 h-4 ${getIconColor('heartRate')}`} />
            <span className="text-xs text-muted-foreground">FC</span>
          </div>
          <span className={`text-sm font-medium ${getValueColor('heartRate')}`}>
            {vitals.heartRate ? `${vitals.heartRate}` : '--'}
          </span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className={`w-4 h-4 ${getIconColor('bloodPressure')}`} />
            <span className="text-xs text-muted-foreground">PA</span>
          </div>
          <span className={`text-sm font-medium ${getValueColor('bloodPressure')}`}>
            {vitals.bloodPressure || '--'}
          </span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Wind className={`w-4 h-4 ${getIconColor('respiratoryRate')}`} />
            <span className="text-xs text-muted-foreground">FR</span>
          </div>
          <span className={`text-sm font-medium ${getValueColor('respiratoryRate')}`}>
            {vitals.respiratoryRate ? `${vitals.respiratoryRate}` : '--'}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Signos Vitales
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-muted-foreground">Crítico</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperatura */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Temperatura (°C)
          </Label>
          <Input
            type="number"
            step="0.1"
            min="30"
            max="45"
            value={vitals.temperature || ''}
            onChange={(e) => onChange({
              ...vitals,
              temperature: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            placeholder="38.5"
            disabled={readonly}
            className={getFieldClassName('temperature')}
          />
          <p className="text-xs text-muted-foreground">
            Rango normal: 37.5 - 39.5°C
          </p>
          {getFieldMessage('temperature')}
        </div>
        
        {/* Frecuencia Cardíaca */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Frecuencia Cardíaca (lpm)
          </Label>
          <Input
            type="number"
            min="40"
            max="250"
            value={vitals.heartRate || ''}
            onChange={(e) => onChange({
              ...vitals,
              heartRate: e.target.value ? parseInt(e.target.value) : undefined
            })}
            placeholder="140"
            disabled={readonly}
            className={getFieldClassName('heartRate')}
          />
          <p className="text-xs text-muted-foreground">
            Rango normal: 120 - 140 lpm
          </p>
          {getFieldMessage('heartRate')}
        </div>
        
        {/* Presión Arterial */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Presión Arterial
          </Label>
          <Input
            value={vitals.bloodPressure || ''}
            onChange={(e) => onChange({
              ...vitals,
              bloodPressure: e.target.value
            })}
            placeholder="120/80"
            disabled={readonly}
            className={getFieldClassName('bloodPressure')}
          />
          <p className="text-xs text-muted-foreground">
            Formato: sistólica/diastólica
          </p>
          {getFieldMessage('bloodPressure')}
        </div>
        
        {/* Frecuencia Respiratoria */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wind className="w-4 h-4" />
            Frecuencia Respiratoria (rpm)
          </Label>
          <Input
            type="number"
            min="10"
            max="60"
            value={vitals.respiratoryRate || ''}
            onChange={(e) => onChange({
              ...vitals,
              respiratoryRate: e.target.value ? parseInt(e.target.value) : undefined
            })}
            placeholder="25"
            disabled={readonly}
            className={getFieldClassName('respiratoryRate')}
          />
          <p className="text-xs text-muted-foreground">
            Rango normal: 20 - 30 rpm
          </p>
          {getFieldMessage('respiratoryRate')}
        </div>
        
        {/* Tiempo de Llenado Capilar */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Llenado Capilar (seg)
          </Label>
          <Input
            type="number"
            min="1"
            max="4"
            step="0.5"
            value={vitals.capillaryRefillTime || ''}
            onChange={(e) => onChange({
              ...vitals,
              capillaryRefillTime: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            placeholder="1.5"
            disabled={readonly}
            className={getFieldClassName('capillaryRefillTime')}
          />
          <p className="text-xs text-muted-foreground">
            Rango normal: 1 - 2 seg
          </p>
          {getFieldMessage('capillaryRefillTime')}
        </div>
      </div>
      
      {/* Resumen de evaluaciones */}
      {validation.evaluations.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Resumen de Signos Vitales</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {validation.evaluations.map(eval => (
              <div key={eval.vitalSign} className="flex items-center gap-2">
                {getStatusIcon(eval.severity)}
                <span>{eval.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getFieldMessage(field: keyof VitalSigns) {
  return ({ validation }: { validation: VitalSignsValidation }) => {
    const error = validation.errors.find(e => e.field === field);
    const warning = validation.warnings.find(w => w.field === field);
    
    if (error) {
      return <p className="text-sm text-destructive">{error.message}</p>;
    }
    if (warning) {
      return <p className="text-sm text-yellow-600">{warning.message}</p>;
    }
    return null;
  };
}

function getIconColor(vitalSign: string) {
  return ({ validation }: { validation: VitalSignsValidation }) => {
    const evaluation = validation.evaluations.find(e => e.vitalSign === vitalSign);
    switch (evaluation?.severity) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };
}

function getValueColor(vitalSign: string) {
  return ({ validation }: { validation: VitalSignsValidation }) => {
    const evaluation = validation.evaluations.find(e => e.vitalSign === vitalSign);
    switch (evaluation?.severity) {
      case 'success': return 'text-green-700';
      case 'warning': return 'text-yellow-700';
      case 'error': return 'text-red-700';
      default: return 'text-muted-foreground';
    }
  };
}

function getStatusIcon(severity: string) {
  switch (severity) {
    case 'success': return <CheckCircle className="w-3 h-3 text-green-500" />;
    case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-500" />;
    case 'error': return <XCircle className="w-3 h-3 text-red-500" />;
    default: return <Info className="w-3 h-3 text-blue-500" />;
  }
}
```

### Tareas de Desarrollo
- [ ] Crear migración de base de datos con validaciones
- [ ] Implementar funciones de evaluación de signos vitales
- [ ] Desarrollar componente VitalSignsForm
- [ ] Crear API endpoints para signos vitales
- [ ] Implementar validaciones en tiempo real
- [ ] Testing de casos edge y validación de rangos

### Dependencias
- Tabla medical_records existente
- Componentes de input y validación
- Iconos médicos (lucide-react)

---

## US-003: Vista de Receta Detallada {#us-003}

### Información General
- **ID:** US-003
- **Prioridad:** Alta
- **Estimación:** 3-4 días
- **Sprint:** 2
- **Roles:** Doctor
- **Epic:** Sistema de Recetas

### Descripción
Como doctor, quiero crear recetas detalladas con información específica sobre medicamentos, duración, frecuencia e indicaciones, para proporcionar instrucciones claras al propietario y generar documentos profesionales para la farmacia.

### Criterios de Aceptación

#### Escenario 1: Crear receta simple
**Dado que** estoy finalizando una consulta con tratamiento médico
**Cuando** selecciono "Solo receta"
**Entonces** debo poder agregar un medicamento con nombre, dosis, duración, frecuencia e indicaciones, validando que todos los campos obligatorios estén completos

**Casos de Prueba:**
- ✅ Receta completa válida → Guardar exitosamente
- ✅ Medicamento: "Omeprazol", Dosis: "10mg", Duración: "5 días" → Aceptar
- ❌ Campo medicamento vacío → Mostrar error
- ❌ Duración inválida → Mostrar error

#### Escenario 2: Receta con tratamiento
**Dado que** estoy finalizando una consulta compleja
**Cuando** selecciono "Receta + Tratamiento"
**Entonces** debo poder agregar múltiples medicamentos y un texto de tratamiento general que incluya cuidados adicionales

**Casos de Prueba:**
- ✅ Múltiples medicamentos + tratamiento general → Guardar exitosamente
- ✅ Agregar/eliminar medicamentos dinámicamente → Interfaz responsiva
- ✅ Cálculo automático de duración total → Mostrar resumen

#### Escenario 3: Validación de medicamentos
**Dado que** estoy ingresando un medicamento
**Cuando** el medicamento no está en la base de datos
**Entonces** el sistema debe permitir agregarlo pero marcarlo como "medicamento personalizado"

**Casos de Prueba:**
- ✅ Medicamento existente → Autocompletado con datos estándar
- ✅ Medicamento nuevo → Permitir ingreso manual
- ⚠️ Medicamento potencialmente peligroso → Mostrar advertencia

#### Escenario 4: Modificar receta existente
**Dado que** necesito editar una receta ya guardada
**Cuando** accedo a la consulta desde el historial
**Entonces** debo poder modificar los medicamentos, eliminar algunos y agregar nuevos

**Casos de Prueba:**
- ✅ Editar medicamento existente → Cambios guardados
- ✅ Eliminar medicamento → Confirmación requerida
- ✅ Agregar nuevo medicamento → Funciona correctamente

### Especificaciones Técnicas

#### Esquema de Base de Datos
```sql
-- Tabla de medicamentos
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  generic_name VARCHAR(255),
  category VARCHAR(100), -- 'antibiotico', 'antiinflamatorio', 'analgésico', etc.
  dosage_forms TEXT[], -- ['tableta', 'jarabe', 'inyectable']
  typical_dosages TEXT[], -- ['5mg', '10mg', '20mg']
  contraindications TEXT[],
  side_effects TEXT[],
  is_controlled BOOLEAN DEFAULT false, -- medicamentos controlados
  requires_prescription BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de recetas
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  prescription_type VARCHAR(20) NOT NULL CHECK (prescription_type IN ('medication_only', 'medication_and_treatment')),
  general_treatment TEXT, -- Tratamiento general en texto libre
  total_duration VARCHAR(100), -- Duración total calculada
  veterinarian_signature TEXT, -- Firma digital del veterinario
  pharmacy_instructions TEXT, -- Instrucciones especiales para la farmacia
  is_controlled_substance BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de medicamentos en recetas (muchos a muchos)
CREATE TABLE prescription_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id),
  custom_medication_name VARCHAR(255), -- Para medicamentos no predefinidos
  dosage VARCHAR(100) NOT NULL, -- ej: "10mg", "5ml"
  frequency VARCHAR(100) NOT NULL, -- ej: "cada 12 horas", "2 veces al día"
  duration VARCHAR(100) NOT NULL, -- ej: "5 días", "1 semana"
  quantity VARCHAR(50), -- ej: "15 tabletas", "100ml"
  instructions TEXT, -- Indicaciones especiales para este medicamento
  is_controlled BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de frecuencia predefinidas
CREATE TABLE prescription_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency_text VARCHAR(100) NOT NULL UNIQUE,
  daily_doses DECIMAL(3,1), -- cuántas veces al día
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER
);

-- Tabla de duración predefinidas
CREATE TABLE prescription_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_text VARCHAR(100) NOT NULL UNIQUE,
  days_count INTEGER, -- cuántos días representa
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER
);

-- Índices
CREATE INDEX idx_prescriptions_medical_record ON prescriptions(medical_record_id);
CREATE INDEX idx_prescription_medications_prescription ON prescription_medications(prescription_id);
CREATE INDEX idx_prescription_medications_medication ON prescription_medications(medication_id);
CREATE INDEX idx_medications_name ON medications(name);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Datos Iniciales
```sql
-- Medicamentos comunes
INSERT INTO medications (name, generic_name, category, dosage_forms, typical_dosages) VALUES
('Omeprazol', 'Omeprazol', 'Antiulceroso', ARRAY['tableta', 'cápsula'], ARRAY['5mg', '10mg', '20mg']),
('Amoxicilina', 'Amoxicilina', 'Antibiótico', ARRAY['tableta', 'suspensión'], ARRAY['125mg', '250mg', '500mg']),
('Meloxicam', 'Meloxicam', 'Antiinflamatorio', ARRAY['tableta', 'suspensión'], ARRAY['1mg', '1.5mg']),
('Tramadol', 'Tramadol', 'Analgésico', ARRAY['tableta', 'gotas'], ARRAY['25mg', '50mg']);

-- Frecuencias predefinidas
INSERT INTO prescription_frequencies (frequency_text, daily_doses, description, sort_order) VALUES
('cada 8 horas', 3.0, 'Tres veces al día', 1),
('cada 12 horas', 2.0, 'Dos veces al día', 2),
('cada 24 horas', 1.0, 'Una vez al día', 3),
('2 veces al día', 2.0, 'Cada 12 horas', 4),
('3 veces al día', 3.0, 'Cada 8 horas', 5),
('según necesidad', 0.5, 'Solo si es necesario', 6);

-- Duraciones predefinidas
INSERT INTO prescription_durations (duration_text, days_count, description, sort_order) VALUES
('3 días', 3, 'Tratamiento corto', 1),
('5 días', 5, 'Tratamiento estándar', 2),
('7 días', 7, 'Una semana', 3),
('10 días', 10, 'Tratamiento prolongado', 4),
('14 días', 14, 'Dos semanas', 5),
('1 mes', 30, 'Tratamiento de larga duración', 6),
('hasta nueva orden', -1, 'Tratamiento indefinido', 7);
```

#### Tipos TypeScript
```typescript
interface Medication {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  dosageForms: string[];
  typicalDosages: string[];
  contraindications?: string[];
  sideEffects?: string[];
  isControlled: boolean;
  requiresPrescription: boolean;
}

interface PrescriptionFrequency {
  id: string;
  frequencyText: string;
  dailyDoses: number;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface PrescriptionDuration {
  id: string;
  durationText: string;
  daysCount: number;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface PrescriptionMedication {
  id: string;
  medicationId?: string;
  customMedicationName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: string;
  instructions?: string;
  isControlled: boolean;
  sortOrder: number;
  medication?: Medication; // populate from medicationId
}

interface Prescription {
  id: string;
  medicalRecordId: string;
  prescriptionType: 'medication_only' | 'medication_and_treatment';
  generalTreatment?: string;
  totalDuration?: string;
  veterinarianSignature?: string;
  pharmacyInstructions?: string;
  isControlledSubstance: boolean;
  status: 'active' | 'dispensed' | 'cancelled';
  medications: PrescriptionMedication[];
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionFormData {
  prescriptionType: 'medication_only' | 'medication_and_treatment';
  medications: Omit<PrescriptionMedication, 'id' | 'sortOrder'>[];
  generalTreatment?: string;
  pharmacyInstructions?: string;
}

interface PrescriptionValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  controlledSubstances: PrescriptionMedication[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning';
}
```

#### API Endpoints
```typescript
// GET /api/medications
interface GetMedicationsResponse {
  medications: Medication[];
  total: number;
}

// GET /api/medications/search?q={query}
interface SearchMedicationsResponse {
  medications: Medication[];
  suggestions: string[];
}

// POST /api/prescriptions
interface CreatePrescriptionRequest {
  medicalRecordId: string;
  prescription: PrescriptionFormData;
}

interface CreatePrescriptionResponse {
  prescription: Prescription;
}

// PUT /api/prescriptions/[id]
interface UpdatePrescriptionRequest {
  prescription: PrescriptionFormData;
}

interface UpdatePrescriptionResponse {
  prescription: Prescription;
}

// GET /api/prescriptions/[id]
interface GetPrescriptionResponse {
  prescription: Prescription;
}

// DELETE /api/prescriptions/[id]
interface DeletePrescriptionResponse {
  success: boolean;
}
```

#### Validaciones
```typescript
function validatePrescription(prescription: PrescriptionFormData): PrescriptionValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const controlledSubstances: PrescriptionMedication[] = [];
  
  // Validar tipo de receta
  if (!prescription.prescriptionType) {
    errors.push({
      field: 'prescriptionType',
      message: 'Tipo de receta es obligatorio',
      code: 'PRESCRIPTION_TYPE_REQUIRED'
    });
  }
  
  // Validar medicamentos
  if (!prescription.medications || prescription.medications.length === 0) {
    errors.push({
      field: 'medications',
      message: 'Debe incluir al menos un medicamento',
      code: 'MEDICATIONS_REQUIRED'
    });
  }
  
  prescription.medications.forEach((med, index) => {
    const medicationIndex = `medications[${index}]`;
    
    // Validar nombre del medicamento
    if (!med.customMedicationName && !med.medicationId) {
      errors.push({
        field: `${medicationIndex}.medication`,
        message: 'Nombre del medicamento es obligatorio',
        code: 'MEDICATION_NAME_REQUIRED'
      });
    }
    
    // Validar dosis
    if (!med.dosage) {
      errors.push({
        field: `${medicationIndex}.dosage`,
        message: 'Dosis es obligatoria',
        code: 'DOSAGE_REQUIRED'
      });
    }
    
    // Validar frecuencia
    if (!med.frequency) {
      errors.push({
        field: `${medicationIndex}.frequency`,
        message: 'Frecuencia es obligatoria',
        code: 'FREQUENCY_REQUIRED'
      });
    }
    
    // Validar duración
    if (!med.duration) {
      errors.push({
        field: `${medicationIndex}.duration`,
        message: 'Duración es obligatoria',
        code: 'DURATION_REQUIRED'
      });
    }
    
    // Verificar sustancias controladas
    if (med.isControlled) {
      controlledSubstances.push(med as PrescriptionMedication);
      warnings.push({
        field: `${medicationIndex}.controlled`,
        message: 'Medicamento controlado - requiere firma especial',
        severity: 'warning'
      });
    }
  });
  
  // Validar tratamiento general si es necesario
  if (prescription.prescriptionType === 'medication_and_treatment') {
    if (!prescription.generalTreatment || prescription.generalTreatment.trim().length < 10) {
      warnings.push({
        field: 'generalTreatment',
        message: 'Descripción del tratamiento es muy corta',
        severity: 'info'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    controlledSubstances
  };
}
```

#### Componente UI Refinado
```tsx
interface PrescriptionFormProps {
  initialData?: Prescription;
  medicalRecordId: string;
  onSave: (prescription: PrescriptionFormData) => Promise<void>;
  onCancel: () => void;
  readonly?: boolean;
}

function PrescriptionForm({ initialData, medicalRecordId, onSave, onCancel, readonly = false }: PrescriptionFormProps) {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    prescriptionType: initialData?.prescriptionType || 'medication_only',
    medications: initialData?.medications || [],
    generalTreatment: initialData?.generalTreatment || '',
    pharmacyInstructions: initialData?.pharmacyInstructions || ''
  });
  
  const [validation, setValidation] = useState<PrescriptionValidation>({
    isValid: false,
    errors: [],
    warnings: [],
    controlledSubstances: []
  });
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [frequencies, setFrequencies] = useState<PrescriptionFrequency[]>([]);
  const [durations, setDurations] = useState<PrescriptionDuration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Validar en cada cambio
  useEffect(() => {
    const validationResult = validatePrescription(formData);
    setValidation(validationResult);
  }, [formData]);
  
  const loadInitialData = async () => {
    try {
      const [medicationsRes, frequenciesRes, durationsRes] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/prescription-frequencies'),
        fetch('/api/prescription-durations')
      ]);
      
      const medicationsData = await medicationsRes.json();
      const frequenciesData = await frequenciesRes.json();
      const durationsData = await durationsRes.json();
      
      setMedications(medicationsData.medications);
      setFrequencies(frequenciesData.frequencies);
      setDurations(durationsData.durations);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };
  
  const addMedication = () => {
    const newMedication: Omit<PrescriptionMedication, 'id' | 'sortOrder'> = {
      medicationId: undefined,
      customMedicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: '',
      isControlled: false
    };
    
    setFormData({
      ...formData,
      medications: [...formData.medications, newMedication]
    });
  };
  
  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };
  
  const updateMedication = (index: number, field: string, value: any) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    
    // Si selecciona un medicamento predefinido, cargar sus datos
    if (field === 'medicationId' && value) {
      const selectedMedication = medications.find(m => m.id === value);
      if (selectedMedication) {
        updatedMedications[index].isControlled = selectedMedication.isControlled;
        updatedMedications[index].customMedicationName = selectedMedication.name;
      }
    }
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };
  
  const calculateTotalDuration = (): string => {
    if (formData.medications.length === 0) return '';
    
    const durations = formData.medications.map(m => m.duration).filter(Boolean);
    if (durations.length === 0) return '';
    
    // Lógica para calcular duración total (simplificada)
    const maxDuration = Math.max(...durations.map(d => getDurationInDays(d)));
    return `${maxDuration} días`;
  };
  
  const handleSave = async () => {
    if (!validation.isValid) return;
    
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving prescription:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="w-6 h-6 text-primary" />
          {initialData ? 'Editar Receta' : 'Nueva Receta'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!validation.isValid || isLoading || readonly}>
            {isLoading ? 'Guardando...' : 'Guardar Receta'}
          </Button>
        </div>
      </div>
      
      {/* Tipo de receta */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Receta</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.prescriptionType}
            onValueChange={(value) => setFormData({ ...formData, prescriptionType: value as any })}
            disabled={readonly}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medication_only" id="medication_only" />
              <Label htmlFor="medication_only">
                Solo Receta
                <p className="text-sm text-muted-foreground">Solo medicamentos</p>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medication_and_treatment" id="medication_and_treatment" />
              <Label htmlFor="medication_and_treatment">
                Receta + Tratamiento
                <p className="text-sm text-muted-foreground">Medicamentos y tratamiento general</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Medicamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medicamentos</CardTitle>
            {!readonly && (
              <Button onClick={addMedication} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Medicamento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.medications.map((medication, index) => (
              <PrescriptionMedicationRow
                key={index}
                medication={medication}
                medications={medications}
                frequencies={frequencies}
                durations={durations}
                index={index}
                onUpdate={(field, value) => updateMedication(index, field, value)}
                onRemove={() => removeMedication(index)}
                readonly={readonly}
              />
            ))}
            
            {formData.medications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay medicamentos agregados</p>
                <p className="text-sm">Haz clic en "Agregar Medicamento" para comenzar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tratamiento general */}
      {formData.prescriptionType === 'medication_and_treatment' && (
        <Card>
          <CardHeader>
            <CardTitle>Tratamiento General</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.generalTreatment}
              onChange={(e) => setFormData({ ...formData, generalTreatment: e.target.value })}
              placeholder="Describe el tratamiento general, cuidados especiales, dieta, reposo, etc."
              rows={4}
              disabled={readonly}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Instrucciones para farmacia */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones para Farmacia</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.pharmacyInstructions}
            onChange={(e) => setFormData({ ...formData, pharmacyInstructions: e.target.value })}
            placeholder="Instrucciones especiales para el farmacéutico (opcional)"
            rows={2}
            disabled={readonly}
          />
        </CardContent>
      </Card>
      
      {/* Resumen */}
      {formData.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de la Receta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Medicamentos:</span> {formData.medications.length}
              </div>
              <div>
                <span className="font-medium">Duración total:</span> {calculateTotalDuration()}
              </div>
              <div>
                <span className="font-medium">Sustancias controladas:</span> {validation.controlledSubstances.length}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {
                  formData.prescriptionType === 'medication_only' ? 'Solo medicamentos' : 'Medicamentos + tratamiento'
                }
              </div>
            </div>
            
            {validation.controlledSubstances.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Sustancias Controladas</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Esta receta contiene {validation.controlledSubstances.length} sustancia(s) controlada(s). 
                  Requiere firma especial y seguimiento regulatorio.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Errores y advertencias */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Validación</CardTitle>
          </CardHeader>
          <CardContent>
            {validation.errors.length > 0 && (
              <div className="space-y-2 mb-4">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">{error.message}</span>
                  </div>
                ))}
              </div>
            )}
            
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{warning.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para cada fila de medicamento
function PrescriptionMedicationRow({
  medication,
  medications,
  frequencies,
  durations,
  index,
  onUpdate,
  onRemove,
  readonly
}: {
  medication: Omit<PrescriptionMedication, 'id' | 'sortOrder'>;
  medications: Medication[];
  frequencies: PrescriptionFrequency[];
  durations: PrescriptionDuration[];
  index: number;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  readonly: boolean;
}) {
  const [showCustomName, setShowCustomName] = useState(!medication.medicationId);
  
  return (
    <div className="p-4 border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Medicamento {index + 1}</h4>
        {!readonly && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector de medicamento */}
        <div className="space-y-2">
          <Label>Medicamento</Label>
          {!showCustomName ? (
            <Select
              value={medication.medicationId || ''}
              onValueChange={(value) => {
                onUpdate('medicationId', value);
                setShowCustomName(false);
              }}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar medicamento..." />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{med.name}</span>
                      {med.isControlled && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Controlado
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                value={medication.customMedicationName || ''}
                onChange={(e) => onUpdate('customMedicationName', e.target.value)}
                placeholder="Nombre del medicamento"
                disabled={readonly}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomName(false)}
                disabled={readonly}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {medication.medicationId && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                onUpdate('medicationId', '');
                setShowCustomName(true);
              }}
              className="p-0 h-auto"
            >
              Usar medicamento personalizado
            </Button>
          )}
        </div>
        
        {/* Dosis */}
        <div className="space-y-2">
          <Label>Dosis</Label>
          <Input
            value={medication.dosage}
            onChange={(e) => onUpdate('dosage', e.target.value)}
            placeholder="ej: 10mg, 5ml"
            disabled={readonly}
          />
        </div>
        
        {/* Frecuencia */}
        <div className="space-y-2">
          <Label>Frecuencia</Label>
          <Select
            value={medication.frequency}
            onValueChange={(value) => onUpdate('frequency', value)}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar frecuencia..." />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq.id} value={freq.frequencyText}>
                  {freq.frequencyText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Duración */}
        <div className="space-y-2">
          <Label>Duración</Label>
          <Select
            value={medication.duration}
            onValueChange={(value) => onUpdate('duration', value)}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar duración..." />
            </SelectTrigger>
            <SelectContent>
              {durations.map((duration) => (
                <SelectItem key={duration.id} value={duration.durationText}>
                  {duration.durationText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Cantidad */}
        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input
            value={medication.quantity || ''}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            placeholder="ej: 15 tabletas, 100ml"
            disabled={readonly}
          />
        </div>
        
        {/* Sustancia controlada */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Checkbox
              checked={medication.isControlled}
              onCheckedChange={(checked) => onUpdate('isControlled', checked)}
              disabled={readonly}
            />
            Sustancia controlada
          </Label>
        </div>
      </div>
      
      {/* Instrucciones especiales */}
      <div className="space-y-2">
        <Label>Instrucciones especiales</Label>
        <Textarea
          value={medication.instructions || ''}
          onChange={(e) => onUpdate('instructions', e.target.value)}
          placeholder="Instrucciones especiales para este medicamento"
          rows={2}
          disabled={readonly}
        />
      </div>
    </div>
  );
}
```

### Tareas de Desarrollo
- [ ] Crear tablas de base de datos con relaciones
- [ ] Poblar datos iniciales de medicamentos y frecuencias
- [ ] Desarrollar componente PrescriptionForm
- [ ] Implementar API endpoints completos
- [ ] Crear validaciones robustas
- [ ] Testing de casos edge y validaciones

### Dependencias
- Tabla medical_records existente
- Sistema de autenticación para veterinarios
- Componentes de formulario avanzados

---

*Continuará con las historias de usuario restantes...*

---

## 📈 Métricas de Éxito

### Técnicas
- Tiempo de respuesta de búsqueda < 200ms
- Precisión de detección de duplicados > 95%
- Validación en tiempo real < 100ms
- Cobertura de tests > 90%

### Usuario
- Reducción 80% tiempo de agendamiento
- 0% duplicados de propietarios
- 100% recetas con información completa
- Satisfacción del equipo médico > 4.5/5

### Negocio
- Eficiencia operativa +25%
- Tiempo de consulta -15%
- Errores de datos -90%
- ROI del sistema > 300%

---

*Documento refinado generado: 2025-12-19*  
*Versión: 2.0*  
*Estado: Listo para implementación*