import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Flame,
  Grid,
  Info,
  Pill,
  Settings2,
  ShieldCheck,
  TrendingDown,
  XCircle,
} from 'lucide-react'
import './App.css'

const tabs = [
  { id: 'parametros', icon: ClipboardList, label: 'Perfil' },
  { id: 'resultados', icon: Grid, label: 'KDIGO' },
  { id: 'tratamiento', icon: Pill, label: 'Decisión' },
]

const CLINICAL_THRESHOLDS = {
  albuminuriaA2: 30,
  albuminuriaA3: 300,
  egfrG4Referral: 30,
  egfrSglt2Start: 20,
  nonDiabeticSglt2Albuminuria: 200,
  potassiumReferral: 5.5,
  refractorySystolicBp: 130,
}

const kdigoRows = [
  { stage: 'G1', label: '>=90', risks: ['Bajo', 'Moderado', 'Alto'] },
  { stage: 'G2', label: '60-89', risks: ['Bajo', 'Moderado', 'Alto'] },
  { stage: 'G3a', label: '45-59', risks: ['Moderado', 'Alto', 'Muy alto'] },
  { stage: 'G3b', label: '30-44', risks: ['Alto', 'Muy alto', 'Muy alto'] },
  { stage: 'G4', label: '15-29', risks: ['Muy alto', 'Muy alto', 'Muy alto'] },
  { stage: 'G5', label: '<15', risks: ['Muy alto', 'Muy alto', 'Muy alto'] },
]

function numeric(value) {
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function getGStage(egfr) {
  const value = numeric(egfr)
  if (!value) return '-'
  if (value >= 90) return 'G1'
  if (value >= 60) return 'G2'
  if (value >= 45) return 'G3a'
  if (value >= 30) return 'G3b'
  if (value >= 15) return 'G4'
  return 'G5'
}

function getAStage(albuminuria) {
  const value = numeric(albuminuria)
  if (!value && albuminuria !== '0') return '-'
  if (value < CLINICAL_THRESHOLDS.albuminuriaA2) return 'A1'
  if (value <= CLINICAL_THRESHOLDS.albuminuriaA3) return 'A2'
  return 'A3'
}

function getRisk(gStage, aStage) {
  const row = kdigoRows.find((item) => item.stage === gStage)
  const column = ['A1', 'A2', 'A3'].indexOf(aStage)
  if (!row || column < 0) return 'Pendiente'
  return row.risks[column]
}

function estimateEgfr(age, sex, creatinine) {
  const ageValue = numeric(age)
  const cr = numeric(creatinine)
  if (!ageValue || !cr) return ''

  const isFemale = sex === 'F'
  const kappa = isFemale ? 0.7 : 0.9
  const alpha = isFemale ? -0.241 : -0.302
  const min = Math.min(cr / kappa, 1) ** alpha
  const max = Math.max(cr / kappa, 1) ** -1.2
  const sexFactor = isFemale ? 1.012 : 1
  return Math.round(142 * min * max * 0.9938 ** ageValue * sexFactor).toString()
}

function hasCkdCriteria(egfr, albuminuria, hematuria) {
  const egfrValue = numeric(egfr)
  const albuminuriaValue = numeric(albuminuria)
  if (!egfrValue && !albuminuriaValue && !hematuria) return false
  return egfrValue < 60 || albuminuriaValue >= CLINICAL_THRESHOLDS.albuminuriaA2 || hematuria
}

function InputField({ label, warning, ...props }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input inputMode="decimal" {...props} />
      {warning ? <span className="field-warning">{warning}</span> : null}
    </div>
  )
}

function CheckboxPill({ checked, onChange, label, color = 'blue' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`checkbox-pill ${checked ? 'is-checked' : ''} tone-${color}`}
      aria-pressed={checked}
    >
      <span className="check-dot">{checked ? <CheckCircle2 size={15} /> : null}</span>
      <span>{label}</span>
    </button>
  )
}

function KidneyIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M24.2 8.7c-7.4 1.2-13.4 8.1-14 16.4-.6 8.9 4.4 17.2 11 23.2 3.3 3 6.6 1 6.6-3.4V33.2c0-4.4 2.2-7.8 5.1-10.6 2-1.9 2.2-5.2.4-7.4-2.1-2.6-5.3-7.1-9.1-6.5Z"
        fill="currentColor"
        opacity="0.96"
      />
      <path
        d="M39.8 8.7c7.4 1.2 13.4 8.1 14 16.4.6 8.9-4.4 17.2-11 23.2-3.3 3-6.6 1-6.6-3.4V33.2c0-4.4-2.2-7.8-5.1-10.6-2-1.9-2.2-5.2-.4-7.4 2.1-2.6 5.3-7.1 9.1-6.5Z"
        fill="currentColor"
        opacity="0.78"
      />
      <path
        d="M30.3 24.2c-3.6 3.1-5.4 6.9-5.4 11.5m8.8-11.5c3.6 3.1 5.4 6.9 5.4 11.5"
        stroke="#EAF1F8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 22.7v-7.4"
        stroke="#EAF1F8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('parametros')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('M')
  const [creatinine, setCreatinine] = useState('')
  const [manualEgfr, setManualEgfr] = useState('')
  const [albuminuria, setAlbuminuria] = useState('')
  const [potassium, setPotassium] = useState('')
  const [pas, setPas] = useState('')
  const [hasDM, setHasDM] = useState(false)
  const [hasHTA, setHasHTA] = useState(false)
  const [hasIC, setHasIC] = useState(false)
  const [priorSGLT2, setPriorSGLT2] = useState(false)
  const [hematuria, setHematuria] = useState(false)
  const [rapidDecline, setRapidDecline] = useState(false)

  const calculatedEgfr = useMemo(
    () => estimateEgfr(age, sex, creatinine),
    [age, sex, creatinine],
  )
  const egfr = manualEgfr || calculatedEgfr
  const gStage = getGStage(egfr)
  const aStage = getAStage(albuminuria)
  const riskLevel = getRisk(gStage, aStage)
  const meetsCkdCriteria = hasCkdCriteria(egfr, albuminuria, hematuria)
  function getReferralCriteria() {
    const criteria = []
    if (hematuria) {
      criteria.push({ type: 'danger', text: 'Derivación si microhematuria glomerular tras descartar causa urológica.' })
    }
    if (rapidDecline) {
      criteria.push({ type: 'danger', text: 'Derivación: progresión acelerada si descenso de FGe >25% o ≥15 ml/min/1,73 m² en un año.' })
    }
    if (numeric(egfr) < CLINICAL_THRESHOLDS.egfrG4Referral && egfr) {
      criteria.push({ type: 'danger', text: 'ERC G4-G5: valorar nefrología y plan de seguimiento estrecho.' })
    }
    if (numeric(albuminuria) > CLINICAL_THRESHOLDS.albuminuriaA3) {
      criteria.push({ type: 'danger', text: 'Albuminuria A3: confirmar persistencia y considerar derivación.' })
    }
    if (!meetsCkdCriteria && egfr && albuminuria !== '') {
      criteria.push({ type: 'info', text: 'Con FGe ≥60 y CACu <30 mg/g no hay criterios de ERC con los datos actuales; confirmar si existen otros marcadores de daño renal.' })
    }
    if (!criteria.length) {
      criteria.push({ type: 'success', text: 'Manejo en Atención Primaria con control periódico según riesgo KDIGO.' })
    }
    return criteria
  }

  function getActionableRecommendations() {
    const egfrValue = numeric(egfr)
    const albuminuriaValue = numeric(albuminuria)
    const sglt2Indicated =
      egfrValue >= CLINICAL_THRESHOLDS.egfrSglt2Start
      && (
        hasIC
        || (hasDM && meetsCkdCriteria)
        || (!hasDM && albuminuriaValue >= CLINICAL_THRESHOLDS.nonDiabeticSglt2Albuminuria)
        || (!hasDM && egfrValue >= 20 && egfrValue <= 45 && meetsCkdCriteria)
      )
    const raasIndicated =
      albuminuriaValue >= CLINICAL_THRESHOLDS.albuminuriaA2
      || (hasDM && hasHTA && egfrValue > 0 && egfrValue < 60)

    const bulletsBase = [
      {
        type: numeric(pas) > CLINICAL_THRESHOLDS.refractorySystolicBp ? 'warning' : 'info',
        text: numeric(pas) > CLINICAL_THRESHOLDS.refractorySystolicBp
          ? 'PAS >130 mmHg: revisar control tensional. La derivación por HTA exige refractariedad pese a tres fármacos, incluido diurético.'
          : 'Presión arterial sistólica sin criterio de alerta por el umbral local revisado.',
      },
      {
        type: numeric(potassium) > CLINICAL_THRESHOLDS.potassiumReferral ? 'warning' : 'info',
        text: numeric(potassium) > CLINICAL_THRESHOLDS.potassiumReferral
          ? 'K+ >5,5 mEq/L: confirmar persistencia y revisar seguridad antes de intensificar fármacos nefroprotectores.'
          : 'Potasio sin criterio local de derivación por alteración persistente >5,5 mEq/L.',
      },
    ]

    const renalProtection = []
    if (sglt2Indicated) {
      renalProtection.push({
        type: priorSGLT2 ? 'success' : 'info',
        text: priorSGLT2
          ? 'Mantener iSGLT2 si hay tolerancia, indicación y ausencia de contraindicaciones.'
          : 'Valorar iSGLT2: indicado con FGe ≥20 si DM2 con ERC, insuficiencia cardíaca, CACu ≥200 mg/g sin DM o FGe 20-45 con ERC.',
      })
    } else {
      renalProtection.push({
        type: 'info',
        text: 'Revisar indicación nefroprotectora cuando se complete perfil clínico y analítico.',
      })
    }
    if (raasIndicated) {
      renalProtection.push({
        type: numeric(potassium) > CLINICAL_THRESHOLDS.potassiumReferral ? 'warning' : 'info',
        text: 'Considerar IECA/ARA-II si albuminuria confirmada o perfil DM+HTA+FGe <60, con control de creatinina y potasio.',
      })
    }

    return [
      { step: 1, title: 'Seguridad y objetivos', bullets: bulletsBase },
      { step: 2, title: 'Nefroprotección', bullets: renalProtection },
      {
        step: 3,
        title: 'Seguimiento',
        bullets: [
          {
            type: riskLevel === 'Muy alto' || riskLevel === 'Alto' ? 'warning' : 'info',
            text: `Riesgo KDIGO ${riskLevel.toLowerCase()}: ajustar frecuencia de eGFR, albuminuria y revisión terapéutica.`,
          },
        ],
      },
    ]
  }

  function getBulletStyles(type) {
    if (type === 'danger') return { className: 'bullet danger', icon: <XCircle size={17} /> }
    if (type === 'warning') return { className: 'bullet warning', icon: <AlertTriangle size={17} /> }
    if (type === 'success') return { className: 'bullet success', icon: <CheckCircle2 size={17} /> }
    return { className: 'bullet info', icon: <Info size={17} /> }
  }

  function renderKdigoTable() {
    return (
      <div className="kdigo-wrap" aria-label="Matriz de riesgo KDIGO">
        <div className="kdigo-table">
          <div className="kdigo-head empty" />
          <div className="kdigo-head">A1<br /><span>&lt;30</span></div>
          <div className="kdigo-head">A2<br /><span>30-300</span></div>
          <div className="kdigo-head">A3<br /><span>&gt;300</span></div>
          {kdigoRows.map((row) => (
            <div className="kdigo-row" key={row.stage}>
              <div className={`kdigo-stage ${gStage === row.stage ? 'active-stage' : ''}`}>
                {row.stage}<span>{row.label}</span>
              </div>
              {row.risks.map((risk, index) => {
                const isActive = gStage === row.stage && aStage === ['A1', 'A2', 'A3'][index]
                return (
                  <div key={`${row.stage}-${risk}-${index}`} className={`risk-cell risk-${risk.replace(' ', '-').toLowerCase()} ${isActive ? 'active-cell' : ''}`}>
                    {risk}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function resetPatient() {
    setAge('')
    setCreatinine('')
    setManualEgfr('')
    setAlbuminuria('')
    setPas('')
    setPotassium('')
    setHasDM(false)
    setHasHTA(false)
    setHasIC(false)
    setPriorSGLT2(false)
    setHematuria(false)
    setRapidDecline(false)
    setActiveTab('parametros')
    window.scrollTo(0, 0)
  }

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <header className="app-header">
          <div className="header-glow" />
          <div className="header-content">
            <div className="header-icon">
              <KidneyIcon size={34} />
            </div>
            <div>
              <h1>CDSS ERC</h1>
              <p><ShieldCheck size={14} /> Algoritmo KDIGO / ADA 2026</p>
            </div>
          </div>
        </header>

        <nav className="tabs">
          <div className="tabs-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <main className="content">
          {activeTab === 'parametros' && (
            <div className="tab-panel">
              <section className="form-section">
                <h2><span className="section-index blue">1</span> Fisiometría</h2>
                <div className="grid two">
                  <InputField label="Edad" placeholder="Ej: 65" value={age} onChange={(event) => setAge(event.target.value)} warning={numeric(age) < 18 && age !== '' ? 'Validado >=18 años' : null} />
                  <div className="field">
                    <label>Sexo</label>
                    <select value={sex} onChange={(event) => setSex(event.target.value)}>
                      <option value="M">Hombre</option>
                      <option value="F">Mujer</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="form-section">
                <h2><span className="section-index sky">2</span> Analítica renal y vitales</h2>
                <div className="grid two">
                  <InputField label="Cr sérica (mg/dL)" placeholder="Ej: 1.2" value={creatinine} onChange={(event) => setCreatinine(event.target.value)} />
                  <InputField label="eGFR (ml/min)" placeholder={calculatedEgfr ? `Auto: ${calculatedEgfr}` : 'Auto/manual'} value={manualEgfr} onChange={(event) => setManualEgfr(event.target.value)} />
                  <InputField label="Albuminuria (mg/g)" placeholder="Ej: 45" value={albuminuria} onChange={(event) => setAlbuminuria(event.target.value)} />
                  <InputField label="Potasio (mEq/L)" placeholder="Ej: 4.5" value={potassium} onChange={(event) => setPotassium(event.target.value)} />
                </div>
                <div className="half-field">
                  <InputField label="PA sistólica (mmHg)" placeholder="Ej: 130" value={pas} onChange={(event) => setPas(event.target.value)} />
                </div>
              </section>

              <section className="form-section">
                <h2><span className="section-index slate">3</span> Perfil clínico</h2>
                <div className="grid two clinical-grid">
                  <CheckboxPill checked={hasDM} onChange={() => setHasDM(!hasDM)} label="Diabetes Mellitus Tipo 2" />
                  <CheckboxPill checked={hasHTA} onChange={() => setHasHTA(!hasHTA)} label="Hipertensión Arterial" />
                  <CheckboxPill checked={hasIC} onChange={() => setHasIC(!hasIC)} label="Insuficiencia Cardíaca" />
                  <CheckboxPill checked={priorSGLT2} onChange={() => setPriorSGLT2(!priorSGLT2)} label="Toma iSGLT2 previo" color="amber" />
                </div>
                <div className="alarm-box">
                  <p><TrendingDown size={14} /> Signos de alarma (derivación)</p>
                  <div className="grid two">
                    <CheckboxPill checked={hematuria} onChange={() => setHematuria(!hematuria)} label="Hematuria / Sedimento" color="rose" />
                    <CheckboxPill checked={rapidDecline} onChange={() => setRapidDecline(!rapidDecline)} label="Descenso FGe >25% o ≥15 ml/min/año" color="rose" />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'resultados' && (
            <div className="tab-panel">
              <div className="summary-grid">
                <div className="summary-card">
                  <Activity size={58} className="summary-watermark" />
                  <span>Filtrado (eGFR)</span>
                  <strong>{egfr || '-'}</strong>
                  <em>Estadio {gStage}</em>
                </div>
                <div className="summary-card">
                  <Flame size={58} className="summary-watermark" />
                  <span>Albuminuria</span>
                  <strong>{albuminuria || '-'}</strong>
                  <em>Categoría {aStage}</em>
                </div>
              </div>

              <section className="result-card">
                <div className="risk-heading">
                  <h2>Riesgo global KDIGO evaluado</h2>
                  <div className={`risk-badge risk-${riskLevel.replace(' ', '-').toLowerCase()}`}>{riskLevel}</div>
                  {!meetsCkdCriteria && egfr && albuminuria !== '' ? (
                    <p className="criteria-note">FGe ≥60 con CACu &lt;30 mg/g no confirma ERC sin otros marcadores de daño renal.</p>
                  ) : null}
                </div>
                {renderKdigoTable()}
              </section>
            </div>
          )}

          {activeTab === 'tratamiento' && (
            <div className="tab-panel">
              <section className={`route-card ${getReferralCriteria().some((criterion) => criterion.type === 'danger') ? 'has-danger' : ''}`}>
                <h2>
                  <span><AlertTriangle size={16} /></span>
                  Ruta del paciente
                </h2>
                <div className="bullet-list">
                  {getReferralCriteria().map((criterion, index) => {
                    const styles = getBulletStyles(criterion.type)
                    return (
                      <div key={`${criterion.text}-${index}`} className={styles.className}>
                        {styles.icon}
                        <span>{criterion.text}</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="treatment-card">
                <div className="treatment-head">
                  <h2><Pill size={18} /> Pauta personalizada</h2>
                  <p>Perfil ajustado: PAS {pas || '-'} | K+ {potassium || '-'} | eGFR {egfr || '-'}</p>
                </div>
                <div className="timeline">
                  {getActionableRecommendations().map((rec) => (
                    <div className="timeline-item" key={rec.step}>
                      <div className="timeline-step">{rec.step}</div>
                      <div className="timeline-body">
                        <h3>{rec.title}</h3>
                        {rec.bullets.map((bullet, index) => {
                          const styles = getBulletStyles(bullet.type)
                          return (
                            <div key={`${bullet.text}-${index}`} className={styles.className}>
                              {styles.icon}
                              <span>{bullet.text}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>

        <div className="bottom-actions">
          {activeTab !== 'parametros' ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'tratamiento' ? 'resultados' : 'parametros')}
              className="button secondary icon-only"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          ) : null}

          {activeTab === 'parametros' ? (
            <button type="button" onClick={() => { setActiveTab('resultados'); window.scrollTo(0, 0) }} className="button primary">
              Evaluar paciente <ArrowRight size={18} />
            </button>
          ) : null}
          {activeTab === 'resultados' ? (
            <button type="button" onClick={() => { setActiveTab('tratamiento'); window.scrollTo(0, 0) }} className="button dark">
              Decisión clínica <Settings2 size={18} />
            </button>
          ) : null}
          {activeTab === 'tratamiento' ? (
            <button type="button" onClick={resetPatient} className="button primary">
              Nuevo paciente <KidneyIcon size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default App
