import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2, X, Edit2, Check, Search, Layers, Image, FolderOpen, Eye, EyeOff, ChevronRight, Download, Upload, Sun, Moon, Camera, GripVertical, Link, Users, List } from 'lucide-react'
import './App.css'

interface LifeEvent {
  id: string
  year: number
  title: string
  description: string
  category: 'birth' | 'death' | 'career' | 'personal' | 'achievement' | 'education' | 'other'
  imageUrl?: string
}

interface Person {
  id: string
  name: string
  birthYear: number
  deathYear: number | null
  color: string
  events: LifeEvent[]
  description: string
  groupIds?: string[]
  notes?: string
}

interface Group {
  id: string
  name: string
  visible: boolean
  color: string
}

interface Connection {
  fromId: string
  toId: string
  label: string
  color: string
}

interface Era {
  id: string
  name: string
  startYear: number
  endYear: number
  color: string
}

const ERA_COLORS = ['#3b82f680','#ef444480','#10b98180','#f59e0b80','#8b5cf680','#ec489980','#06b6d480','#f9731680']

const initialEras: Era[] = [
  { id: 'era1', name: 'Renaissance', startYear: 1400, endYear: 1600, color: '#10b98160' },
  { id: 'era2', name: 'Enlightenment', startYear: 1685, endYear: 1815, color: '#3b82f660' },
  { id: 'era3', name: 'Industrial Revolution', startYear: 1760, endYear: 1840, color: '#f59e0b60' },
  { id: 'era4', name: 'Modern Era', startYear: 1900, endYear: 2000, color: '#8b5cf660' },
]

const GROUP_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#6366f1']
const CONNECTION_COLORS = ['#f472b6','#60a5fa','#34d399','#fbbf24','#a78bfa','#fb923c','#2dd4bf','#818cf8','#f87171','#4ade80']

const initialGroups: Group[] = [
  { id: 'g1', name: 'Scientists', visible: true, color: '#3b82f6' },
  { id: 'g2', name: 'Artists & Musicians', visible: true, color: '#ec4899' },
  { id: 'g3', name: 'Leaders & Royalty', visible: true, color: '#f59e0b' },
]

const CC: Record<LifeEvent['category'], string> = { birth: '#10b981', death: '#6b7280', career: '#3b82f6', personal: '#f59e0b', achievement: '#8b5cf6', education: '#ec4899', other: '#64748b' }
const CL: Record<LifeEvent['category'], string> = { birth: 'Birth', death: 'Death', career: 'Career', personal: 'Personal', achievement: 'Achievement', education: 'Education', other: 'Other' }
const PERSON_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#6366f1','#84cc16','#e11d48','#0ea5e9','#a855f7','#22c55e']

const initialConnections: Connection[] = [
  { fromId: '7', toId: '1', label: 'Influenced', color: '#60a5fa' },
  { fromId: '11', toId: '7', label: 'Inspired', color: '#34d399' },
  { fromId: '4', toId: '5', label: 'Computing pioneers', color: '#a78bfa' },
]

const initialPeople: Person[] = [
  { id: '1', name: 'Albert Einstein', birthYear: 1879, deathYear: 1955, color: '#3b82f6', description: 'Theoretical physicist who developed the theory of relativity', groupIds: ['g1'], notes: 'His mass-energy equivalence formula E=mc2 is one of the most famous equations in physics.', events: [
    { id: 'e1', year: 1879, title: 'Born in Ulm', description: 'Born in Ulm, Kingdom of Wurttemberg, German Empire', category: 'birth' },
    { id: 'e2', year: 1896, title: 'Entered ETH Zurich', description: 'Enrolled at the Swiss Federal Polytechnic School in Zurich', category: 'education' },
    { id: 'e3', year: 1905, title: 'Annus Mirabilis Papers', description: 'Published four groundbreaking papers including special relativity and E=mc2', category: 'achievement' },
    { id: 'e4', year: 1915, title: 'General Relativity', description: 'Completed the general theory of relativity', category: 'achievement' },
    { id: 'e5', year: 1921, title: 'Nobel Prize in Physics', description: 'Awarded Nobel Prize for the photoelectric effect', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Albert_Einstein_%28Nobel%29.png/440px-Albert_Einstein_%28Nobel%29.png' },
    { id: 'e6', year: 1933, title: 'Emigrated to USA', description: 'Fled Nazi Germany and settled in Princeton, New Jersey', category: 'personal' },
    { id: 'e7', year: 1940, title: 'US Citizenship', description: 'Became a United States citizen', category: 'personal' },
    { id: 'e8', year: 1955, title: 'Died in Princeton', description: 'Died at Princeton Hospital, New Jersey', category: 'death' },
  ]},
  { id: '2', name: 'Marie Curie', birthYear: 1867, deathYear: 1934, color: '#ef4444', description: 'Physicist and chemist, pioneer in radioactivity research', groupIds: ['g1'], notes: 'First woman to win a Nobel Prize and the only person to win in two different sciences.', events: [
    { id: 'e9', year: 1867, title: 'Born in Warsaw', description: 'Born Maria Sklodowska in Warsaw, Russian Empire', category: 'birth' },
    { id: 'e10', year: 1891, title: 'Moved to Paris', description: 'Enrolled at the University of Paris to study physics', category: 'education' },
    { id: 'e11', year: 1895, title: 'Married Pierre Curie', description: 'Married fellow physicist Pierre Curie', category: 'personal' },
    { id: 'e12', year: 1898, title: 'Discovered Polonium and Radium', description: 'Discovered two new elements: polonium and radium', category: 'achievement' },
    { id: 'e13', year: 1903, title: 'Nobel Prize in Physics', description: 'First woman to win a Nobel Prize, shared with Pierre and Becquerel', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/440px-Marie_Curie_c._1920s.jpg' },
    { id: 'e14', year: 1906, title: 'First Female Professor at Sorbonne', description: 'Took over Pierre\'s teaching position after his death', category: 'career' },
    { id: 'e15', year: 1911, title: 'Nobel Prize in Chemistry', description: 'Second Nobel Prize, first person to win in two different sciences', category: 'achievement' },
    { id: 'e16', year: 1934, title: 'Died in Savoy', description: 'Died of aplastic anemia from radiation exposure', category: 'death' },
  ]},
  { id: '3', name: 'Leonardo da Vinci', birthYear: 1452, deathYear: 1519, color: '#10b981', description: 'Renaissance polymath: painter, sculptor, architect, scientist, and inventor', groupIds: ['g2'], notes: 'Leonardo kept extensive notebooks spanning roughly 13,000 pages.', events: [
    { id: 'e17', year: 1452, title: 'Born in Vinci', description: 'Born in Vinci, Republic of Florence', category: 'birth' },
    { id: 'e18', year: 1466, title: 'Apprenticed to Verrocchio', description: 'Began apprenticeship with artist Andrea del Verrocchio in Florence', category: 'education' },
    { id: 'e19', year: 1482, title: 'Moved to Milan', description: 'Entered the service of Ludovico Sforza, Duke of Milan', category: 'career' },
    { id: 'e20', year: 1490, title: 'Vitruvian Man', description: 'Created the iconic drawing of human proportions', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/300px-Da_Vinci_Vitruve_Luc_Viatour.jpg' },
    { id: 'e21', year: 1498, title: 'The Last Supper', description: 'Completed the famous mural painting in Milan', category: 'achievement' },
    { id: 'e22', year: 1503, title: 'Mona Lisa', description: 'Began painting the Mona Lisa', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/400px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
    { id: 'e23', year: 1519, title: 'Died in Amboise', description: 'Died at Chateau du Clos Luce, Amboise, France', category: 'death' },
  ]},
  { id: '4', name: 'Ada Lovelace', birthYear: 1815, deathYear: 1852, color: '#f59e0b', description: 'Mathematician, recognized as the first computer programmer', groupIds: ['g1'], notes: 'She wrote what is considered the first algorithm intended to be carried out by a machine.', events: [
    { id: 'e24', year: 1815, title: 'Born in London', description: 'Born Augusta Ada Byron, daughter of Lord Byron', category: 'birth' },
    { id: 'e25', year: 1833, title: 'Met Charles Babbage', description: 'Introduced to Charles Babbage and his Difference Engine', category: 'career' },
    { id: 'e26', year: 1835, title: 'Married Lord King', description: 'Married William King, later Earl of Lovelace', category: 'personal' },
    { id: 'e27', year: 1843, title: 'Published Algorithm', description: 'Published the first computer algorithm for Babbage\'s Analytical Engine', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/440px-Ada_Lovelace_portrait.jpg' },
    { id: 'e28', year: 1852, title: 'Died in London', description: 'Died of uterine cancer at age 36', category: 'death' },
  ]},
  { id: '5', name: 'Nikola Tesla', birthYear: 1856, deathYear: 1943, color: '#8b5cf6', description: 'Inventor, electrical engineer, and futurist known for AC power', groupIds: ['g1'], notes: 'Tesla held over 300 patents and developed the AC electrical system used worldwide.', events: [
    { id: 'e29', year: 1856, title: 'Born in Smiljan', description: 'Born in Smiljan, Austrian Empire (modern Croatia)', category: 'birth' },
    { id: 'e30', year: 1884, title: 'Arrived in America', description: 'Emigrated to the United States', category: 'personal' },
    { id: 'e31', year: 1887, title: 'Tesla Electric Company', description: 'Founded his own company for electrical equipment', category: 'career' },
    { id: 'e32', year: 1888, title: 'AC Motor Patent', description: 'Patented the alternating current induction motor', category: 'achievement' },
    { id: 'e33', year: 1891, title: 'Tesla Coil', description: 'Invented the Tesla coil, a resonant transformer circuit', category: 'achievement', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/N.Tesla.JPG/440px-N.Tesla.JPG' },
    { id: 'e34', year: 1893, title: 'Columbian Exposition', description: 'AC power demonstrated at the Chicago World\'s Fair', category: 'achievement' },
    { id: 'e35', year: 1899, title: 'Colorado Springs Lab', description: 'Conducted high-voltage, high-frequency experiments', category: 'career' },
    { id: 'e36', year: 1943, title: 'Died in New York', description: 'Died alone at the New Yorker Hotel, Manhattan', category: 'death' },
  ]},
  { id: '6', name: 'Frida Kahlo', birthYear: 1907, deathYear: 1954, color: '#ec4899', description: 'Mexican artist known for self-portraits and works inspired by nature', groupIds: ['g2'], notes: 'She painted 55 self-portraits, celebrated as emblematic of Mexican traditions.', events: [
    { id: 'e37', year: 1907, title: 'Born in Coyoacan', description: 'Born in Mexico City', category: 'birth' },
    { id: 'e38', year: 1925, title: 'Bus Accident', description: 'Suffered near-fatal bus accident that shaped her life and art', category: 'personal' },
    { id: 'e39', year: 1929, title: 'Married Diego Rivera', description: 'Married muralist Diego Rivera', category: 'personal' },
    { id: 'e40', year: 1938, title: 'First Solo Exhibition', description: 'First solo exhibition at Julien Levy Gallery in New York', category: 'achievement' },
    { id: 'e41', year: 1939, title: 'Exhibited in Paris', description: 'The Louvre acquired The Frame, first Mexican artist in collection', category: 'achievement' },
    { id: 'e42', year: 1953, title: 'Solo Exhibition in Mexico', description: 'First solo exhibition in Mexico, attended on her hospital bed', category: 'achievement' },
    { id: 'e43', year: 1954, title: 'Died in Coyoacan', description: 'Died at La Casa Azul, her family home', category: 'death' },
  ]},
  { id: '7', name: 'Isaac Newton', birthYear: 1643, deathYear: 1727, color: '#06b6d4', description: 'Mathematician, physicist, and astronomer who formulated the laws of motion', groupIds: ['g1'], notes: 'Newton\'s Principia formulated the laws of motion and universal gravitation.', events: [
    { id: 'e44', year: 1643, title: 'Born in Woolsthorpe', description: 'Born in Woolsthorpe Manor, Lincolnshire, England', category: 'birth' },
    { id: 'e45', year: 1661, title: 'Entered Cambridge', description: 'Admitted to Trinity College, Cambridge', category: 'education' },
    { id: 'e46', year: 1666, title: 'Annus Mirabilis', description: 'Developed calculus, optics theories, and law of gravitation', category: 'achievement' },
    { id: 'e47', year: 1687, title: 'Principia Published', description: 'Published Philosophiae Naturalis Principia Mathematica', category: 'achievement' },
    { id: 'e48', year: 1703, title: 'President of Royal Society', description: 'Elected President of the Royal Society', category: 'career' },
    { id: 'e49', year: 1727, title: 'Died in London', description: 'Died in his sleep in London', category: 'death' },
  ]},
  { id: '8', name: 'Cleopatra VII', birthYear: -69, deathYear: -30, color: '#f97316', description: 'Last active ruler of the Ptolemaic Kingdom of Egypt', groupIds: ['g3'], notes: 'She spoke multiple languages and was known for her intelligence and political acumen.', events: [
    { id: 'e50', year: -69, title: 'Born in Alexandria', description: 'Born in Alexandria, Ptolemaic Kingdom of Egypt', category: 'birth' },
    { id: 'e51', year: -51, title: 'Became Pharaoh', description: 'Ascended to the throne as co-ruler with her brother', category: 'career' },
    { id: 'e52', year: -48, title: 'Alliance with Caesar', description: 'Formed a political and romantic alliance with Julius Caesar', category: 'personal' },
    { id: 'e53', year: -41, title: 'Met Mark Antony', description: 'Began alliance with Roman general Mark Antony', category: 'personal' },
    { id: 'e54', year: -30, title: 'Died in Alexandria', description: 'Died by suicide after the fall of Egypt to Rome', category: 'death' },
  ]},
  { id: '9', name: 'Mozart', birthYear: 1756, deathYear: 1791, color: '#14b8a6', description: 'Prolific and influential composer of the Classical period', groupIds: ['g2'], notes: 'Mozart composed more than 600 works.', events: [
    { id: 'e55', year: 1756, title: 'Born in Salzburg', description: 'Born Wolfgang Amadeus Mozart in Salzburg, Austria', category: 'birth' },
    { id: 'e56', year: 1762, title: 'First European Tour', description: 'Began touring European courts as a child prodigy at age 6', category: 'career' },
    { id: 'e57', year: 1770, title: 'Italian Journey', description: 'Toured Italy, studying opera and gaining fame', category: 'education' },
    { id: 'e58', year: 1782, title: 'Married Constanze Weber', description: 'Married Constanze Weber in Vienna', category: 'personal' },
    { id: 'e59', year: 1786, title: 'The Marriage of Figaro', description: 'Premiered one of his greatest operas in Vienna', category: 'achievement' },
    { id: 'e60', year: 1791, title: 'The Magic Flute', description: 'Composed The Magic Flute and began the Requiem', category: 'achievement' },
    { id: 'e61', year: 1791, title: 'Died in Vienna', description: 'Died in Vienna at age 35 under mysterious circumstances', category: 'death' },
  ]},
  { id: '10', name: 'Martin Luther King Jr.', birthYear: 1929, deathYear: 1968, color: '#6366f1', description: 'American civil rights leader and Nobel Peace Prize laureate', groupIds: ['g3'], notes: 'King advanced civil rights through nonviolence and civil disobedience.', events: [
    { id: 'e62', year: 1929, title: 'Born in Atlanta', description: 'Born Michael King Jr. in Atlanta, Georgia', category: 'birth' },
    { id: 'e63', year: 1955, title: 'Montgomery Bus Boycott', description: 'Led the 381-day bus boycott in Montgomery, Alabama', category: 'achievement' },
    { id: 'e64', year: 1963, title: 'I Have a Dream', description: 'Delivered iconic speech at the March on Washington', category: 'achievement' },
    { id: 'e65', year: 1964, title: 'Nobel Peace Prize', description: 'Awarded the Nobel Peace Prize for nonviolent resistance', category: 'achievement' },
    { id: 'e66', year: 1964, title: 'Civil Rights Act', description: 'Helped secure passage of the Civil Rights Act of 1964', category: 'achievement' },
    { id: 'e67', year: 1968, title: 'Assassinated in Memphis', description: 'Assassinated at the Lorraine Motel in Memphis, Tennessee', category: 'death' },
  ]},
  { id: '11', name: 'Galileo Galilei', birthYear: 1564, deathYear: 1642, color: '#84cc16', description: 'Italian astronomer, physicist, and father of modern observational astronomy', groupIds: ['g1'], notes: 'Called the father of observational astronomy and modern physics.', events: [
    { id: 'e68', year: 1564, title: 'Born in Pisa', description: 'Born in Pisa, Duchy of Florence', category: 'birth' },
    { id: 'e69', year: 1589, title: 'Professor at Pisa', description: 'Appointed professor of mathematics at the University of Pisa', category: 'career' },
    { id: 'e70', year: 1609, title: 'Improved Telescope', description: 'Built an improved telescope and began astronomical observations', category: 'achievement' },
    { id: 'e71', year: 1610, title: 'Discovered Jupiter\'s Moons', description: 'Discovered four largest moons of Jupiter', category: 'achievement' },
    { id: 'e72', year: 1633, title: 'Trial by Inquisition', description: 'Found guilty of heresy for supporting heliocentrism', category: 'personal' },
    { id: 'e73', year: 1642, title: 'Died in Arcetri', description: 'Died under house arrest in Arcetri, near Florence', category: 'death' },
  ]},
  { id: '12', name: 'Queen Victoria', birthYear: 1819, deathYear: 1901, color: '#e11d48', description: 'Queen of the United Kingdom, longest-reigning British monarch of the 19th century', groupIds: ['g3'], notes: 'Her reign of 63 years is known as the Victorian era.', events: [
    { id: 'e74', year: 1819, title: 'Born at Kensington', description: 'Born at Kensington Palace, London', category: 'birth' },
    { id: 'e75', year: 1837, title: 'Became Queen', description: 'Ascended to the throne at age 18', category: 'career' },
    { id: 'e76', year: 1840, title: 'Married Prince Albert', description: 'Married her cousin Prince Albert of Saxe-Coburg', category: 'personal' },
    { id: 'e77', year: 1851, title: 'Great Exhibition', description: 'Opened the Great Exhibition at the Crystal Palace', category: 'achievement' },
    { id: 'e78', year: 1876, title: 'Empress of India', description: 'Proclaimed Empress of India by the Royal Titles Act', category: 'career' },
    { id: 'e79', year: 1901, title: 'Died at Osborne', description: 'Died at Osborne House, Isle of Wight', category: 'death' },
  ]},
]

function genId(): string { return Math.random().toString(36).substring(2, 9) }

function App() {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [viewStart, setViewStart] = useState(1400)
  const [viewEnd, setViewEnd] = useState(1970)
  const [hoveredEvent, setHoveredEvent] = useState<{event: LifeEvent; person: Person; x: number; y: number} | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartView, setDragStartView] = useState({start: 0, end: 0})
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [newPerson, setNewPerson] = useState({name: '', birthYear: '', deathYear: '', description: '', groupIds: [] as string[], notes: ''})
  const [showAddEvent, setShowAddEvent] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({year: '', title: '', description: '', category: 'other' as LifeEvent['category'], imageUrl: ''})
  const [editingEvent, setEditingEvent] = useState<{personId: string, event: LifeEvent} | null>(null)
  const [filterCategory, setFilterCategory] = useState<LifeEvent['category'] | 'all'>('all')
  const [compactMode, setCompactMode] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [sortBy, setSortBy] = useState<'custom' | 'birth'>('birth')
  const [sidebarTab, setSidebarTab] = useState<'groups' | 'people'>('groups')
  const [inlineNewGroupName, setInlineNewGroupName] = useState('')
  const [showInlineNewGroup, setShowInlineNewGroup] = useState<'add' | 'edit' | null>(null)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [darkMode, setDarkMode] = useState(true)
  const [showConnections, setShowConnections] = useState(true)
  const [hoveredConnectionIdx, setHoveredConnectionIdx] = useState<number | null>(null)
  const [showAddConnection, setShowAddConnection] = useState(false)
  const [newConnection, setNewConnection] = useState({fromId: '', toId: '', label: ''})
  const [dragPersonId, setDragPersonId] = useState<string | null>(null)
  const [personOrder, setPersonOrder] = useState<string[]>(initialPeople.map(p => p.id))
  const [eras, setEras] = useState<Era[]>(initialEras)
  const [showAddEra, setShowAddEra] = useState(false)
  const [newEra, setNewEra] = useState({name: '', startYear: '', endYear: ''})
  const [showEras, setShowEras] = useState(true)
  const [exportingPng, setExportingPng] = useState(false)
  const [hiddenPeopleIds, setHiddenPeopleIds] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleGroupIds = useMemo(() => {
    const s = new Set<string>()
    groups.forEach(g => { if (g.visible) s.add(g.id) })
    return s
  }, [groups])

  const filteredPeople = useMemo(() => {
    let r = people.filter(p => (!p.groupIds?.length || p.groupIds.some(gid => visibleGroupIds.has(gid))) && !hiddenPeopleIds.has(p.id))
    if (sidebarSearch) { const q = sidebarSearch.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(q)) }
    if (sortBy === 'birth') r = [...r].sort((a, b) => a.birthYear - b.birthYear)
    else { const m = new Map(personOrder.map((id, i) => [id, i])); r = [...r].sort((a, b) => (m.get(a.id) ?? 999) - (m.get(b.id) ?? 999)) }
    return r
  }, [people, sidebarSearch, sortBy, visibleGroupIds, personOrder, hiddenPeopleIds])

  const togglePersonVisibility = (pid: string) => {
    setHiddenPeopleIds(prev => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n })
  }

  const eraRows = useMemo(() => {
    const sorted = [...eras].sort((a, b) => a.startYear - b.startYear)
    const rows: Era[][] = []
    for (const era of sorted) {
      let placed = false
      for (const row of rows) {
        if (row.every(e => era.startYear >= e.endYear || era.endYear <= e.startYear)) {
          row.push(era); placed = true; break
        }
      }
      if (!placed) rows.push([era])
    }
    return rows
  }, [eras])

  const tw = useMemo(() => viewEnd - viewStart, [viewStart, viewEnd])
  const ytp = useCallback((year: number) => ((year - viewStart) / tw) * 100, [viewStart, tw])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.event-dot,.no-drag') || (e.target as HTMLElement).closest('button,input,select,textarea')) return
    setIsDragging(true); setDragStartX(e.clientX); setDragStartView({start: viewStart, end: viewEnd})
  }, [viewStart, viewEnd])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return
    const dx = e.clientX - dragStartX
    const shift = -(dx / timelineRef.current.getBoundingClientRect().width) * (dragStartView.end - dragStartView.start)
    setViewStart(Math.round(dragStartView.start + shift)); setViewEnd(Math.round(dragStartView.end + shift))
  }, [isDragging, dragStartX, dragStartView])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])
  useEffect(() => { const h = () => setIsDragging(false); window.addEventListener('mouseup', h); return () => window.removeEventListener('mouseup', h) }, [])

  const zoomIn = () => { const c = (viewStart + viewEnd) / 2, r = Math.max(20, tw * 0.7); setViewStart(Math.round(c - r / 2)); setViewEnd(Math.round(c + r / 2)) }
  const zoomOut = () => { const c = (viewStart + viewEnd) / 2, r = Math.min(3000, tw * 1.4); setViewStart(Math.round(c - r / 2)); setViewEnd(Math.round(c + r / 2)) }
  const resetView = () => {
    const visible = people.filter(p => (!p.groupIds?.length || p.groupIds.some(gid => visibleGroupIds.has(gid))) && !hiddenPeopleIds.has(p.id))
    if (!visible.length) { setViewStart(1400); setViewEnd(1970); return }
    const minY = Math.min(...visible.map(p => p.birthYear))
    const maxY = Math.max(...visible.map(p => p.deathYear ?? new Date().getFullYear()))
    const range = maxY - minY
    const namePad = Math.max(40, range * 0.15)
    setViewStart(Math.round(minY - namePad))
    setViewEnd(Math.round(maxY + 20))
  }
  const hideAllPeople = () => setHiddenPeopleIds(new Set(people.map(p => p.id)))
  const showAllPeople = () => setHiddenPeopleIds(new Set())
  const allPeopleVisible = hiddenPeopleIds.size === 0

  const getTickMarks = useMemo(() => {
    const range = viewEnd - viewStart
    const iv = range <= 30 ? 1 : range <= 80 ? 5 : range <= 200 ? 10 : range <= 500 ? 25 : range <= 1000 ? 50 : 100
    const ticks: number[] = []; const s = Math.ceil(viewStart / iv) * iv
    for (let y = s; y <= viewEnd; y += iv) ticks.push(y)
    return ticks
  }, [viewStart, viewEnd])

  const addPerson = () => {
    if (!newPerson.name || !newPerson.birthYear) return
    const by = parseInt(newPerson.birthYear), dy = newPerson.deathYear ? parseInt(newPerson.deathYear) : null
    if (isNaN(by)) return
    const p: Person = { id: genId(), name: newPerson.name, birthYear: by, deathYear: dy, color: PERSON_COLORS[people.length % PERSON_COLORS.length], description: newPerson.description, groupIds: newPerson.groupIds.length ? newPerson.groupIds : undefined, notes: newPerson.notes || undefined, events: [{ id: genId(), year: by, title: 'Born', description: newPerson.name + ' was born', category: 'birth' }, ...(dy ? [{ id: genId(), year: dy, title: 'Died', description: newPerson.name + ' died', category: 'death' as const }] : [])] }
    setPeople([...people, p]); setPersonOrder([...personOrder, p.id]); setNewPerson({name: '', birthYear: '', deathYear: '', description: '', groupIds: [], notes: ''}); setShowAddPerson(false)
  }

  const removePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id)); setPersonOrder(personOrder.filter(pid => pid !== id))
    setConnections(connections.filter(c => c.fromId !== id && c.toId !== id))
    if (selectedPerson?.id === id) setSelectedPerson(null); if (expandedPersonId === id) setExpandedPersonId(null)
  }

  const addEvent = (pid: string) => {
    if (!newEvent.year || !newEvent.title) return
    const y = parseInt(newEvent.year); if (isNaN(y)) return
    const ev: LifeEvent = { id: genId(), year: y, title: newEvent.title, description: newEvent.description, category: newEvent.category, imageUrl: newEvent.imageUrl || undefined }
    setPeople(people.map(p => p.id === pid ? { ...p, events: [...p.events, ev].sort((a, b) => a.year - b.year) } : p))
    setNewEvent({year: '', title: '', description: '', category: 'other', imageUrl: ''}); setShowAddEvent(null)
  }

  const removeEvent = (pid: string, eid: string) => setPeople(people.map(p => p.id === pid ? { ...p, events: p.events.filter(e => e.id !== eid) } : p))
  const saveEditEvent = () => { if (!editingEvent) return; setPeople(people.map(p => p.id === editingEvent.personId ? { ...p, events: p.events.map(e => e.id === editingEvent.event.id ? editingEvent.event : e).sort((a, b) => a.year - b.year) } : p)); setEditingEvent(null) }
  const startEditPerson = (p: Person) => setEditingPerson({ ...p })
  const saveEditPerson = () => { if (!editingPerson) return; setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p)); setEditingPerson(null) }
  const filteredEvents = (events: LifeEvent[]) => filterCategory === 'all' ? events : events.filter(e => e.category === filterCategory)

  const toggleGroupVis = (gid: string) => setGroups(groups.map(g => g.id === gid ? { ...g, visible: !g.visible } : g))
  const addGroup = (name?: string) => { const n = (name || newGroupName).trim(); if (!n) return; const g = { id: genId(), name: n, visible: true, color: GROUP_COLORS[groups.length % GROUP_COLORS.length] }; setGroups([...groups, g]); setNewGroupName(''); setShowAddGroup(false); return g }
  const hideAllGroups = () => setGroups(groups.map(g => ({ ...g, visible: false })))
  const showAllGroups = () => setGroups(groups.map(g => ({ ...g, visible: true })))
  const allGroupsVisible = groups.every(g => g.visible)
  const addInlineGroup = () => { if (!inlineNewGroupName.trim()) return; const g = addGroup(inlineNewGroupName.trim()); setInlineNewGroupName(''); setShowInlineNewGroup(null); return g }
  const deleteGroup = (gid: string) => { setGroups(groups.filter(g => g.id !== gid)); setPeople(people.map(p => p.groupIds?.includes(gid) ? { ...p, groupIds: p.groupIds.filter(id => id !== gid).length ? p.groupIds.filter(id => id !== gid) : undefined } : p)) }
  const saveGroupName = (gid: string) => { if (!editingGroupName.trim()) return; setGroups(groups.map(g => g.id === gid ? { ...g, name: editingGroupName.trim() } : g)); setEditingGroupId(null) }
  const toggleCollapseGroup = (gid: string) => { setCollapsedGroups(prev => { const n = new Set(prev); n.has(gid) ? n.delete(gid) : n.add(gid); return n }) }
  const formatYear = (y: number) => y < 0 ? Math.abs(y) + ' BC' : '' + y

  const addEra = () => {
    if (!newEra.name || !newEra.startYear || !newEra.endYear) return
    const sy = parseInt(newEra.startYear), ey = parseInt(newEra.endYear)
    if (isNaN(sy) || isNaN(ey) || sy >= ey) return
    setEras([...eras, {id: genId(), name: newEra.name, startYear: sy, endYear: ey, color: ERA_COLORS[eras.length % ERA_COLORS.length]}])
    setNewEra({name: '', startYear: '', endYear: ''}); setShowAddEra(false)
  }
  const removeEra = (id: string) => setEras(eras.filter(e => e.id !== id))

  const exportData = () => {
    const blob = new Blob([JSON.stringify({people, groups, connections, personOrder, eras}, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'timeline-' + new Date().toISOString().split('T')[0] + '.json'; a.click(); URL.revokeObjectURL(url)
  }
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); if (d.people) setPeople(d.people); if (d.groups) setGroups(d.groups); if (d.connections) setConnections(d.connections); if (d.personOrder) setPersonOrder(d.personOrder); if (d.eras) setEras(d.eras) } catch { alert('Invalid JSON file') } }
    reader.readAsText(file); e.target.value = ''
  }

  const exportAsPng = async () => {
    const el = exportRef.current; if (!el) return
    setExportingPng(true)
    // Auto fit-all before exporting
    const visible = people.filter(p => (!p.groupIds?.length || p.groupIds.some(gid => visibleGroupIds.has(gid))) && !hiddenPeopleIds.has(p.id))
    if (visible.length) {
      const minY = Math.min(...visible.map(p => p.birthYear))
      const maxY = Math.max(...visible.map(p => p.deathYear ?? new Date().getFullYear()))
      const range = maxY - minY
      const namePad = Math.max(40, range * 0.15)
      setViewStart(Math.round(minY - namePad)); setViewEnd(Math.round(maxY + 20))
    }
    await new Promise(r => setTimeout(r, 200))
    try {
      const mod = await import('html2canvas'); const html2canvas = mod.default
      const scrollParent = el.closest('.overflow-y-auto') as HTMLElement | null
      const mainParent = scrollParent?.closest('main') as HTMLElement | null
      const origStyles: {el: HTMLElement, height: string, overflow: string, maxHeight: string}[] = []
      if (scrollParent) { origStyles.push({el: scrollParent, height: scrollParent.style.height, overflow: scrollParent.style.overflow, maxHeight: scrollParent.style.maxHeight}); scrollParent.style.height = 'auto'; scrollParent.style.overflow = 'visible'; scrollParent.style.maxHeight = 'none' }
      if (mainParent) { origStyles.push({el: mainParent, height: mainParent.style.height, overflow: mainParent.style.overflow, maxHeight: mainParent.style.maxHeight}); mainParent.style.height = 'auto'; mainParent.style.overflow = 'visible'; mainParent.style.maxHeight = 'none' }
      const origPadBot = el.style.paddingBottom; el.style.paddingBottom = '80px'
      await new Promise(r => setTimeout(r, 50))
      const canvas = await html2canvas(el, {backgroundColor: darkMode ? '#030712' : '#ffffff', scale: 3, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: el.scrollWidth, windowHeight: el.scrollHeight + 100, width: el.scrollWidth, height: el.scrollHeight})
      el.style.paddingBottom = origPadBot
      origStyles.forEach(s => { s.el.style.height = s.height; s.el.style.overflow = s.overflow; s.el.style.maxHeight = s.maxHeight })
      const pad = 40
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = canvas.width + pad * 2; finalCanvas.height = canvas.height + pad * 2
      const ctx = finalCanvas.getContext('2d')!
      ctx.fillStyle = darkMode ? '#030712' : '#ffffff'; ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      ctx.drawImage(canvas, pad, pad)
      const link = document.createElement('a'); link.download = 'timeline-' + new Date().toISOString().split('T')[0] + '.png'; link.href = finalCanvas.toDataURL('image/png'); link.click()
    }
    catch (err) { console.error(err); alert('PNG export failed. Try Export JSON instead.') }
    finally { setExportingPng(false) }
  }

  const addConnection = () => {
    if (!newConnection.fromId || !newConnection.toId || newConnection.fromId === newConnection.toId) return
    setConnections([...connections, {fromId: newConnection.fromId, toId: newConnection.toId, label: newConnection.label || 'Connected', color: CONNECTION_COLORS[connections.length % CONNECTION_COLORS.length]}])
    setNewConnection({fromId: '', toId: '', label: ''}); setShowAddConnection(false)
  }
  const removeConnection = (idx: number) => setConnections(connections.filter((_, i) => i !== idx))

  const handleDragStart = (pid: string) => setDragPersonId(pid)
  const handleDragOver = (e: React.DragEvent, tid: string) => {
    e.preventDefault(); if (!dragPersonId || dragPersonId === tid) return
    const o = [...personOrder], fi = o.indexOf(dragPersonId), ti = o.indexOf(tid)
    if (fi === -1 || ti === -1) return; o.splice(fi, 1); o.splice(ti, 0, dragPersonId); setPersonOrder(o)
  }
  const handleDragEnd = () => setDragPersonId(null)

  const d = darkMode
  const bg = d ? 'bg-gray-950' : 'bg-gray-50'
  const text = d ? 'text-white' : 'text-gray-900'
  const hBg = d ? 'bg-gray-900' : 'bg-white'
  const bc = d ? 'border-gray-800' : 'border-gray-200'
  const sBg = d ? 'bg-gray-900' : 'bg-gray-50'
  const cBg = d ? 'bg-gray-900' : 'bg-white'
  const iBg = d ? 'bg-gray-800' : 'bg-gray-100'
  const iBo = d ? 'border-gray-700' : 'border-gray-300'
  const hov = d ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100'
  const mt = d ? 'text-gray-500' : 'text-gray-400'
  const st = d ? 'text-gray-400' : 'text-gray-500'
  const gl = d ? 'bg-gray-800/50' : 'bg-gray-200/50'
  const tc = d ? 'text-gray-500' : 'text-gray-400'
  const tl = d ? 'bg-gray-700' : 'bg-gray-300'
  const pBg = d ? 'bg-gray-900' : 'bg-white'
  const pBo = d ? 'border-gray-700' : 'border-gray-200'

  const barH = compactMode ? 28 : 48
  const rowH = compactMode ? 36 : 72
  const dotSz = compactMode ? 'w-3 h-3' : 'w-4 h-4'
  const barTh = compactMode ? 'h-5' : 'h-8'
  const barHvTh = compactMode ? 'h-6' : 'h-10'

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col`}>
      <header className={`${hBg} border-b ${bc} px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Interactive Timeline</h1>
            <p className={`text-xs ${st} mt-0.5`}>Explore the lives and achievements of remarkable people</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as LifeEvent['category'] | 'all')} className={`${iBg} border ${iBo} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <option value="all">All Events</option>
              {Object.entries(CL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button onClick={() => setDarkMode(!d)} className={`p-2 rounded-lg text-sm transition-colors ${iBg} ${hov}`} title={d ? 'Light Mode' : 'Dark Mode'}>
              {d ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setCompactMode(!compactMode)} className={`p-2 rounded-lg text-sm transition-colors ${compactMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : iBg + ' ' + hov}`} title={compactMode ? 'Normal View' : 'Compact View'}>
              <Layers size={16} />
            </button>
            <button onClick={() => setShowConnections(!showConnections)} className={`p-2 rounded-lg text-sm transition-colors ${showConnections ? 'bg-blue-600 hover:bg-blue-700 text-white' : iBg + ' ' + hov}`} title={showConnections ? 'Hide Connections' : 'Show Connections'}>
              <Link size={16} />
            </button>
            <button onClick={() => setShowAddPerson(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white">
              <Plus size={16} /> Add Person
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-56 ${sBg} border-r ${bc} flex flex-col flex-shrink-0`}>
          <div className={`p-3 border-b ${bc}`}>
            <div className="relative">
              <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${mt}`} />
              <input placeholder="Search people, groups, eras..." value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} className={`w-full ${iBg} border ${iBo} rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`} />
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${mt}`}>{filteredPeople.length} people</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${mt}`}>Sort:</span>
                  {(['custom', 'birth'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)} className={`px-1.5 py-0.5 text-xs rounded text-center capitalize ${sortBy === s ? (d ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : mt}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => setSidebarTab('groups')} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded transition-colors ${sidebarTab === 'groups' ? (d ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : mt + ' ' + hov}`}><Users size={12} /> Groups</button>
                <button onClick={() => setSidebarTab('people')} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded transition-colors ${sidebarTab === 'people' ? (d ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : mt + ' ' + hov}`}><List size={12} /> All People</button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sidebarTab === 'people' && (
              <div className="space-y-0.5 mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <button onClick={() => allPeopleVisible ? hideAllPeople() : showAllPeople()} className={`flex items-center gap-1 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors`} title={allPeopleVisible ? 'Hide all people' : 'Show all people'}>
                    {allPeopleVisible ? <EyeOff size={12} /> : <Eye size={12} />} {allPeopleVisible ? 'Hide All' : 'Show All'}
                  </button>
                </div>
                {people.filter(p => !sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase())).sort((a, b) => sortBy === 'birth' ? a.birthYear - b.birthYear : 0).map(person => (
                  <div key={person.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${hov} transition-all`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: person.color}} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${hiddenPeopleIds.has(person.id) ? 'line-through opacity-50' : ''}`}>{person.name}</p>
                      <p className={`text-xs ${mt}`}>{formatYear(person.birthYear)} - {person.deathYear ? formatYear(person.deathYear) : 'Present'}</p>
                    </div>
                    <button onClick={() => togglePersonVisibility(person.id)} className={`p-0.5 ${hov} rounded transition-colors flex-shrink-0`} title={hiddenPeopleIds.has(person.id) ? 'Show' : 'Hide'}>
                      {hiddenPeopleIds.has(person.id) ? <EyeOff size={10} className={mt} /> : <Eye size={10} className={st} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === 'groups' && (<div>
            <div className="space-y-1 mb-2">
              {groups.filter(g => !sidebarSearch || g.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || people.some(p => p.groupIds?.includes(g.id) && p.name.toLowerCase().includes((sidebarSearch || '').toLowerCase()))).map(group => {
                const gp = people.filter(p => p.groupIds?.includes(group.id)).filter(p => !sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
                const collapsed = collapsedGroups.has(group.id)
                return (
                  <div key={group.id}>
                    <div className={`flex items-center gap-1 px-1 py-1 rounded-md ${hov} group/grp`}>
                      <button onClick={() => toggleCollapseGroup(group.id)} className="p-0.5">
                        <ChevronRight size={12} className={`${mt} transition-transform ${collapsed ? '' : 'rotate-90'}`} />
                      </button>
                      {editingGroupId === group.id ? (
                        <input value={editingGroupName} onChange={e => setEditingGroupName(e.target.value)} onBlur={() => saveGroupName(group.id)} onKeyDown={e => { if (e.key === 'Enter') saveGroupName(group.id); if (e.key === 'Escape') setEditingGroupId(null) }} className={`flex-1 ${iBg} border ${iBo} rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`} autoFocus />
                      ) : (
                        <span className="flex-1 text-xs font-medium truncate cursor-pointer" style={{color: group.color}} onDoubleClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name) }}>
                          {group.name}<span className={`${mt} font-normal ml-1`}>({gp.length})</span>
                        </span>
                      )}
                      <button onClick={() => toggleGroupVis(group.id)} className={`p-0.5 ${hov} rounded transition-colors`} title={group.visible ? 'Hide group' : 'Show group'}>
                        {group.visible ? <Eye size={12} className={st} /> : <EyeOff size={12} className={mt} />}
                      </button>
                      <button onClick={() => deleteGroup(group.id)} className="p-0.5 hover:bg-red-500/20 rounded opacity-0 group-hover/grp:opacity-100 transition-all">
                        <Trash2 size={10} className="text-red-400" />
                      </button>
                    </div>
                    {!collapsed && group.visible && !sidebarSearch && (
                      <div className="ml-4 space-y-0.5">
                        {gp.map(person => (
                          <div key={person.id} draggable={sortBy === 'custom'} onDragStart={() => handleDragStart(person.id)} onDragOver={e => handleDragOver(e, person.id)} onDragEnd={handleDragEnd}
                            className={`group rounded-lg px-2 py-1.5 cursor-pointer transition-all ${selectedPerson?.id === person.id ? cBg + ' ring-1 ' + (d ? 'ring-gray-700' : 'ring-gray-300') : hov} ${dragPersonId === person.id ? 'opacity-50' : ''}`}
                            onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}>
                            <div className="flex items-center gap-2">
                              {sortBy === 'custom' && <GripVertical size={10} className={`${mt} flex-shrink-0 cursor-grab`} />}
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: person.color}} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${hiddenPeopleIds.has(person.id) ? 'line-through opacity-50' : ''}`}>{person.name}</p>
                                <p className={`text-xs ${mt}`}>{formatYear(person.birthYear)} - {person.deathYear ? formatYear(person.deathYear) : 'Present'}</p>
                              </div>
                              <button onClick={e => { e.stopPropagation(); startEditPerson(person) }} className={`opacity-0 group-hover:opacity-100 p-0.5 ${hov} rounded transition-all flex-shrink-0`} title="Edit person">
                                <Edit2 size={10} className={st} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); togglePersonVisibility(person.id) }} className={`p-0.5 ${hov} rounded transition-colors flex-shrink-0`} title={hiddenPeopleIds.has(person.id) ? 'Show' : 'Hide'}>
                                {hiddenPeopleIds.has(person.id) ? <EyeOff size={10} className={mt} /> : <Eye size={10} className={st} />}
                              </button>
                              <button onClick={e => { e.stopPropagation(); removePerson(person.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all">
                                <Trash2 size={10} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!collapsed && group.visible && sidebarSearch && gp.length > 0 && (
                      <div className="ml-4 space-y-0.5">
                        {gp.map(person => (
                          <div key={person.id} draggable={sortBy === 'custom'} onDragStart={() => handleDragStart(person.id)} onDragOver={e => handleDragOver(e, person.id)} onDragEnd={handleDragEnd}
                            className={`group rounded-lg px-2 py-1.5 cursor-pointer transition-all ${selectedPerson?.id === person.id ? cBg + ' ring-1 ' + (d ? 'ring-gray-700' : 'ring-gray-300') : hov} ${dragPersonId === person.id ? 'opacity-50' : ''}`}
                            onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}>
                            <div className="flex items-center gap-2">
                              {sortBy === 'custom' && <GripVertical size={10} className={`${mt} flex-shrink-0 cursor-grab`} />}
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: person.color}} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${hiddenPeopleIds.has(person.id) ? 'line-through opacity-50' : ''}`}>{person.name}</p>
                                <p className={`text-xs ${mt}`}>{formatYear(person.birthYear)} - {person.deathYear ? formatYear(person.deathYear) : 'Present'}</p>
                              </div>
                              <button onClick={e => { e.stopPropagation(); startEditPerson(person) }} className={`opacity-0 group-hover:opacity-100 p-0.5 ${hov} rounded transition-all flex-shrink-0`} title="Edit person">
                                <Edit2 size={10} className={st} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); togglePersonVisibility(person.id) }} className={`p-0.5 ${hov} rounded transition-colors flex-shrink-0`} title={hiddenPeopleIds.has(person.id) ? 'Show' : 'Hide'}>
                                {hiddenPeopleIds.has(person.id) ? <EyeOff size={10} className={mt} /> : <Eye size={10} className={st} />}
                              </button>
                              <button onClick={e => { e.stopPropagation(); removePerson(person.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all">
                                <Trash2 size={10} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {people.filter(p => !p.groupIds?.length).length > 0 && (
              <div className="mb-2">
                <div className={`px-1 py-1 text-xs ${mt} font-medium`}>Ungrouped</div>
                <div className="space-y-0.5">
                  {people.filter(p => !p.groupIds?.length).map(person => (
                    <div key={person.id} draggable={sortBy === 'custom'} onDragStart={() => handleDragStart(person.id)} onDragOver={e => handleDragOver(e, person.id)} onDragEnd={handleDragEnd}
                      className={`group rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${selectedPerson?.id === person.id ? cBg + ' ring-1 ' + (d ? 'ring-gray-700' : 'ring-gray-300') : hov} ${dragPersonId === person.id ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}>
                      <div className="flex items-center gap-2">
                        {sortBy === 'custom' && <GripVertical size={10} className={`${mt} flex-shrink-0 cursor-grab`} />}
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: person.color}} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${hiddenPeopleIds.has(person.id) ? 'line-through opacity-50' : ''}`}>{person.name}</p>
                          <p className={`text-xs ${mt}`}>{formatYear(person.birthYear)} - {person.deathYear ? formatYear(person.deathYear) : 'Present'}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); startEditPerson(person) }} className={`opacity-0 group-hover:opacity-100 p-0.5 ${hov} rounded transition-all flex-shrink-0`} title="Edit person">
                          <Edit2 size={10} className={st} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); togglePersonVisibility(person.id) }} className={`p-0.5 ${hov} rounded transition-colors flex-shrink-0`} title={hiddenPeopleIds.has(person.id) ? 'Show' : 'Hide'}>
                          {hiddenPeopleIds.has(person.id) ? <EyeOff size={10} className={mt} /> : <Eye size={10} className={st} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); removePerson(person.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all">
                          <Trash2 size={10} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => allGroupsVisible ? hideAllGroups() : showAllGroups()} className={`flex items-center gap-1 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors`} title={allGroupsVisible ? 'Hide all groups' : 'Show all groups'}>
                {allGroupsVisible ? <EyeOff size={12} /> : <Eye size={12} />} {allGroupsVisible ? 'Hide All' : 'Show All'}
              </button>
              <div className="flex-1" />
            </div>
            {showAddGroup ? (
              <div className="px-1 flex items-center gap-1">
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addGroup(); if (e.key === 'Escape') setShowAddGroup(false) }} placeholder="Group name..." className={`flex-1 ${iBg} border ${iBo} rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`} autoFocus />
                <button onClick={() => addGroup()} className="p-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"><Check size={10} /></button>
                <button onClick={() => setShowAddGroup(false)} className={`p-1 ${iBg} rounded transition-colors`}><X size={10} /></button>
              </div>
            ) : (
              <button onClick={() => setShowAddGroup(true)} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full`}>
                <FolderOpen size={12} /> New Group
              </button>
            )}
            </div>)}
            <div className={`mt-3 pt-3 border-t ${bc} space-y-1`}>
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs ${mt} font-medium`}>Eras ({eras.filter(e => !sidebarSearch || e.name.toLowerCase().includes(sidebarSearch.toLowerCase())).length})</span>
                <button onClick={() => setShowEras(!showEras)} className={`p-0.5 ${hov} rounded transition-colors`}>
                  {showEras ? <Eye size={12} className={st} /> : <EyeOff size={12} className={mt} />}
                </button>
              </div>
              {eras.filter(e => !sidebarSearch || e.name.toLowerCase().includes(sidebarSearch.toLowerCase())).map(era => (
                <div key={era.id} className={`group/era flex items-center gap-1 px-1 py-0.5 rounded text-xs ${hov}`}>
                  <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{backgroundColor: era.color}} />
                  <span className="truncate flex-1">{era.name}</span>
                  <span className={`${mt} text-xs flex-shrink-0`}>{formatYear(era.startYear)}-{formatYear(era.endYear)}</span>
                  <button onClick={() => removeEra(era.id)} className="opacity-0 group-hover/era:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"><X size={8} className="text-red-400" /></button>
                </div>
              ))}
              {showAddEra ? (
                <div className="space-y-1 px-1">
                  <input value={newEra.name} onChange={e => setNewEra({...newEra, name: e.target.value})} placeholder="Era name..." className={`w-full ${iBg} border ${iBo} rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`} autoFocus />
                  <div className="flex gap-1">
                    <input type="number" value={newEra.startYear} onChange={e => setNewEra({...newEra, startYear: e.target.value})} placeholder="Start" className={`flex-1 ${iBg} border ${iBo} rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`} />
                    <input type="number" value={newEra.endYear} onChange={e => setNewEra({...newEra, endYear: e.target.value})} placeholder="End" className={`flex-1 ${iBg} border ${iBo} rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={addEra} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded py-1 text-xs transition-colors text-white">Add</button>
                    <button onClick={() => setShowAddEra(false)} className={`px-2 ${iBg} rounded text-xs transition-colors`}><X size={10} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddEra(true)} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full`}>
                  <Plus size={12} /> Add Era
                </button>
              )}
            </div>
            <div className={`mt-3 pt-3 border-t ${bc} space-y-1`}>
              <button onClick={() => setShowAddConnection(true)} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full`}>
                <Link size={12} /> Add Connection
              </button>
              {connections.length > 0 && (
                <div className="space-y-0.5">
                  {connections.map((conn, idx) => {
                    const from = people.find(p => p.id === conn.fromId), to = people.find(p => p.id === conn.toId)
                    if (!from || !to) return null
                    return (
                      <div key={idx} className={`group/conn flex items-center gap-1 px-1 py-0.5 rounded text-xs ${hov}`}>
                        <div className="w-2 h-0.5 rounded" style={{backgroundColor: conn.color}} />
                        <span className="truncate flex-1" style={{color: conn.color}}>{from.name} &rarr; {to.name}</span>
                        <button onClick={() => removeConnection(idx)} className="opacity-0 group-hover/conn:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all">
                          <X size={8} className="text-red-400" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className={`mt-3 pt-3 border-t ${bc} space-y-1`}>
              <button onClick={exportData} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full`}>
                <Download size={12} /> Export JSON
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full`}>
                <Upload size={12} /> Import JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
              <button onClick={exportAsPng} disabled={exportingPng} className={`flex items-center gap-1.5 px-2 py-1 text-xs ${mt} ${hov} rounded-md transition-colors w-full ${exportingPng ? 'opacity-50' : ''}`}>
                <Camera size={12} /> {exportingPng ? 'Exporting...' : 'Export as PNG'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Timeline */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className={`flex items-center justify-between px-6 py-2 ${d ? 'bg-gray-900/50' : 'bg-gray-100/50'} border-b ${bc}`}>
            <div className="flex items-center gap-2">
              <button onClick={zoomIn} className={`p-1.5 ${iBg} ${hov} rounded-lg transition-colors`} title="Zoom In"><ZoomIn size={14} /></button>
              <button onClick={zoomOut} className={`p-1.5 ${iBg} ${hov} rounded-lg transition-colors`} title="Zoom Out"><ZoomOut size={14} /></button>
              <button onClick={resetView} className={`p-1.5 ${iBg} ${hov} rounded-lg transition-colors`} title="Fit All"><RotateCcw size={14} /></button>
              <span className={`text-xs ${mt} ml-2`}>{formatYear(viewStart)} - {formatYear(viewEnd)} ({viewEnd - viewStart} yrs)</span>
            </div>
            <div className={`text-xs ${mt}`}>Use +/- to zoom | Drag to pan | Hover events for details</div>
          </div>

          <div ref={timelineRef} className="flex-1 overflow-y-auto px-6 py-3" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{cursor: isDragging ? 'grabbing' : 'grab'}}>
            <div ref={exportRef}>
              {/* Eras band */}
              {showEras && eras.length > 0 && (
                <div className="relative mb-1" style={{height: (eraRows.length * 28) + 'px'}}>
                  {eraRows.map((row, rowIdx) => row.map(era => {
                    const sp = ytp(era.startYear), ep = ytp(era.endYear)
                    const left = Math.max(0, sp), right = Math.min(100, ep)
                    if (right <= 0 || left >= 100) return null
                    return <div key={era.id} className="absolute rounded-sm flex items-center justify-center overflow-hidden group/era" style={{left: left + '%', width: (right - left) + '%', top: (rowIdx * 28) + 'px', height: '24px', backgroundColor: era.color}}>
                      <span className="text-xs font-medium truncate px-1" style={{color: darkMode ? '#fff' : '#1f2937', textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'}}>{era.name}</span>
                      <button onClick={() => removeEra(era.id)} className="absolute top-0 right-0 p-0.5 opacity-0 group-hover/era:opacity-100 hover:bg-red-500/30 rounded transition-all"><X size={10} className="text-red-300" /></button>
                    </div>
                  }))}
                </div>
              )}

              {/* Tick marks header */}
              <div className={`relative h-7 mb-1 border-b ${bc}`}>
                {getTickMarks.map(year => {
                  const pct = ytp(year); if (pct < -5 || pct > 105) return null
                  return <div key={year} className="absolute top-0 flex flex-col items-center" style={{left: pct + '%', transform: 'translateX(-50%)'}}>
                    <span className={`text-xs ${tc} font-mono`}>{formatYear(year)}</span>
                    <div className={`w-px h-2 ${tl} mt-0.5`} />
                  </div>
                })}
              </div>

              <div className="relative">
                {/* Grid lines */}
                {getTickMarks.map(year => {
                  const pct = ytp(year); if (pct < 0 || pct > 100) return null
                  return <div key={'g-' + year} className={`absolute top-0 bottom-0 w-px ${gl}`} style={{left: pct + '%', height: (filteredPeople.length * (compactMode ? 40 : 80) + 40) + 'px'}} />
                })}

                {/* Connection S-curve lines - hidden when a person is expanded since layout shifts */}
                {showConnections && !expandedPersonId && (() => {
                  const rowStep = compactMode ? 40 : 80
                  const svgH = filteredPeople.length * rowStep + 40
                  const vbW = 1000
                  const connData = connections.map(conn => {
                    const fp = filteredPeople.find(p => p.id === conn.fromId), tp = filteredPeople.find(p => p.id === conn.toId)
                    if (!fp || !tp) return null
                    const fi = filteredPeople.indexOf(fp), ti = filteredPeople.indexOf(tp)
                    const fy = fi * rowStep + barH / 2, ty = ti * rowStep + barH / 2
                    const fromEndPct = Math.min(100, ytp(fp.deathYear ?? new Date().getFullYear()))
                    const toStartPct = Math.max(0, ytp(tp.birthYear))
                    const fromEndX = (fromEndPct / 100) * vbW
                    const toStartX = (toStartPct / 100) * vbW
                    const rowsBetween = Math.abs(fi - ti)
                    const horizontalGap = Math.max(80, Math.abs(toStartX - fromEndX))
                    const curveOffset = Math.min(260, 40 + rowsBetween * 24 + horizontalGap * 0.5)
                    const cp1x = fromEndX + curveOffset * 0.35, cp1y = fy
                    const cp2x = toStartX - curveOffset * 0.35, cp2y = ty
                    const midX = 0.125 * fromEndX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * toStartX
                    const midY = 0.125 * fy + 0.375 * cp1y + 0.375 * cp2y + 0.125 * ty
                    const midPct = (midX / vbW) * 100
                    return { conn, fromEndX, toStartX, fy, ty, cp1x, cp1y, cp2x, cp2y, midPct, midY }
                  }).filter(Boolean) as { conn: typeof connections[0], fromEndX: number, toStartX: number, fy: number, ty: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, midPct: number, midY: number }[]
                  return <>
                    <svg className="absolute top-0 left-0 w-full" style={{height: svgH + 'px', zIndex: 1, overflow: 'visible'}} viewBox={`0 0 ${vbW} ${svgH}`} preserveAspectRatio="none">
                      {connData.map((cd, idx) => (
                        <g key={'c-' + idx} onMouseEnter={() => setHoveredConnectionIdx(idx)} onMouseLeave={() => setHoveredConnectionIdx((prev) => prev === idx ? null : prev)}>
                          <path d={`M ${cd.fromEndX} ${cd.fy} C ${cd.cp1x} ${cd.cp1y}, ${cd.cp2x} ${cd.cp2y}, ${cd.toStartX} ${cd.ty}`} fill="none" stroke="transparent" strokeWidth="12" />
                          <path d={`M ${cd.fromEndX} ${cd.fy} C ${cd.cp1x} ${cd.cp1y}, ${cd.cp2x} ${cd.cp2y}, ${cd.toStartX} ${cd.ty}`} fill="none" stroke={cd.conn.color} strokeWidth="2" strokeDasharray="6 3" opacity="0.7" vectorEffect="non-scaling-stroke" />
                          <circle cx={cd.fromEndX} cy={cd.fy} r="5" fill={cd.conn.color} opacity="0.9" vectorEffect="non-scaling-stroke" />
                          <circle cx={cd.toStartX} cy={cd.ty} r="5" fill={cd.conn.color} opacity="0.9" vectorEffect="non-scaling-stroke" />
                        </g>
                      ))}
                    </svg>
                    {connData.map((cd, idx) => (
                      <div key={'cl-' + idx} className={`absolute pointer-events-none transition-opacity ${hoveredConnectionIdx === idx ? 'opacity-100' : 'opacity-0'}`} style={{left: cd.midPct + '%', top: cd.midY - 10, transform: 'translateX(-50%)', zIndex: 2}}>
                        <span className="text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded" style={{color: cd.conn.color, backgroundColor: darkMode ? 'rgba(3,7,18,0.85)' : 'rgba(255,255,255,0.9)', border: '1px solid ' + cd.conn.color + '40'}}>{cd.conn.label}</span>
                      </div>
                    ))}
                  </>
                })()}

                {/* Person rows */}
                {filteredPeople.map(person => {
                  const sp = ytp(person.birthYear), ep = ytp(person.deathYear ?? new Date().getFullYear())
                  const bl = Math.max(0, sp), br = Math.min(100, ep)
                  const isSel = selectedPerson?.id === person.id, isExp = expandedPersonId === person.id
                  return (
                    <div key={person.id} className="relative" style={{marginBottom: compactMode ? '4px' : '8px', height: isExp ? 'auto' : rowH + 'px'}}>
                      {/* Life bar with name label inline */}
                      <div className="relative flex items-center" style={{height: barH + 'px'}}>
                        <div className={'absolute ' + barTh + ' rounded-full transition-all duration-200 ' + (isSel ? 'ring-2 ring-white/30 ' + barHvTh : 'hover:' + barHvTh)}
                          style={{left: bl + '%', width: Math.max(0.5, br - bl) + '%', backgroundColor: person.color + '30', borderLeft: '3px solid ' + person.color, borderRight: person.deathYear ? '3px solid ' + person.color : 'none'}}>
                          <div className="absolute inset-0 rounded-full" style={{background: 'linear-gradient(90deg, ' + person.color + '20, ' + person.color + '40, ' + person.color + '20)'}} />
                        </div>
                        {/* Name label positioned at the start of the bar */}
                        <div className="absolute z-30 flex items-center" style={{left: Math.max(0, bl) + '%', transform: 'translateX(-100%) translateX(-8px)', height: barH + 'px'}}>
                          <div className={(d ? 'bg-gray-900/90' : 'bg-white/90') + ' backdrop-blur-sm border rounded-md shadow-lg whitespace-nowrap ' + (compactMode ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-xs font-medium')} style={{borderColor: person.color + '40', color: person.color}}>
                            {person.name}
                          </div>
                        </div>
                        {/* Event dots - stack same-year events */}
                        {(() => {
                          const evts = filteredEvents(person.events)
                          const byYear = new Map<number, LifeEvent[]>()
                          evts.forEach(ev => { const arr = byYear.get(ev.year) || []; arr.push(ev); byYear.set(ev.year, arr) })
                          return Array.from(byYear.entries()).map(([year, yearEvts]) => {
                            const evPct = ytp(year); if (evPct < -2 || evPct > 102) return null
                            return yearEvts.map((event, idx) => {
                              const offset = yearEvts.length > 1 ? (idx - (yearEvts.length - 1) / 2) * (compactMode ? 10 : 14) : 0
                              return <div key={event.id} className="event-dot absolute z-20 cursor-pointer" style={{left: evPct + '%', transform: `translateX(-50%) translateY(${offset}px)`, padding: '3px'}}
                                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setHoveredEvent({event, person, x: r.left + r.width / 2, y: r.top}) }}
                                onMouseLeave={() => setHoveredEvent(null)}
                                onClick={e => { e.stopPropagation(); setSelectedPerson(person); setExpandedPersonId(expandedPersonId === person.id ? null : person.id) }}>
                                <div className={dotSz + ' rounded-full border-2 ' + (d ? 'border-gray-900' : 'border-white') + ' shadow-lg transition-transform hover:scale-150'} style={{backgroundColor: CC[event.category]}} />
                                {event.imageUrl && !compactMode && <div className={'absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border ' + (d ? 'border-gray-900' : 'border-gray-300')} />}
                              </div>
                            })
                          })
                        })()}
                      </div>

                      {/* Expanded details */}
                      {isExp && (
                        <div className={'ml-4 mt-2 mb-3 ' + cBg + '/80 border ' + bc + ' rounded-xl p-4 backdrop-blur-sm'}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold" style={{color: person.color}}>{person.name}</h3>
                              <span className={'text-xs ' + mt}>({formatYear(person.birthYear)} - {person.deathYear ? formatYear(person.deathYear) : 'Present'})</span>
                              <button onClick={() => startEditPerson(person)} className={'p-1 ' + hov + ' rounded transition-colors ml-2'} title="Edit person"><Edit2 size={12} className={st} /></button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setShowAddEvent(person.id)} className={'flex items-center gap-1 text-xs ' + iBg + ' ' + hov + ' px-2 py-1 rounded-md transition-colors'}><Plus size={12} /> Add Event</button>
                              <button onClick={() => setExpandedPersonId(null)} className={'p-1 ' + hov + ' rounded transition-colors'}><ChevronUp size={16} className={st} /></button>
                            </div>
                          </div>
                          {person.description && <p className={'text-xs ' + st + ' mb-2 italic'}>{person.description}</p>}
                          {person.notes && <div className={'text-xs ' + mt + ' mb-3 p-2 ' + iBg + ' rounded-lg border ' + bc}><span className="font-medium">Notes:</span> {person.notes}</div>}
                          <div className="space-y-2">
                            {filteredEvents(person.events).map(event => (
                              <div key={event.id} className="flex items-start gap-3 group/event">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="w-2.5 h-2.5 rounded-full mt-1" style={{backgroundColor: CC[event.category]}} />
                                  <span className={'text-xs font-mono ' + mt + ' w-12'}>{formatYear(event.year)}</span>
                                </div>
                                {event.imageUrl && (
                                  <div className="relative flex-shrink-0">
                                    <img src={event.imageUrl} alt={event.title} className={'w-12 h-12 object-cover rounded-lg border cursor-pointer ' + bc}
                                      onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setHoveredEvent({event, person, x: r.right + 8, y: r.top}) }}
                                      onMouseLeave={() => setHoveredEvent(null)}
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{event.title}</p>
                                  <p className={'text-xs ' + st}>{event.description}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{backgroundColor: CC[event.category] + '20', color: CC[event.category]}}>{CL[event.category]}</span>
                                <button onClick={() => setEditingEvent({personId: person.id, event: {...event}})} className="opacity-0 group-hover/event:opacity-100 p-1 hover:bg-blue-500/20 rounded transition-all flex-shrink-0" title="Edit event"><Edit2 size={12} className={st} /></button>
                                <button onClick={() => removeEvent(person.id, event.id)} className="opacity-0 group-hover/event:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all flex-shrink-0"><Trash2 size={12} className="text-red-400" /></button>
                              </div>
                            ))}
                          </div>
                          {showAddEvent === person.id && (
                            <div className={'mt-3 pt-3 border-t ' + bc}>
                              <div className="grid grid-cols-4 gap-2">
                                <input type="number" placeholder="Year" value={newEvent.year} onChange={e => setNewEvent({...newEvent, year: e.target.value})} className={`${iBg} border ${iBo} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                <input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className={`${iBg} border ${iBo} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value as LifeEvent['category']})} className={`${iBg} border ${iBo} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                                  {Object.entries(CL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                </select>
                                <div className="flex gap-1">
                                  <button onClick={() => addEvent(person.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors text-white">Add</button>
                                  <button onClick={() => setShowAddEvent(null)} className={`px-2 ${iBg} rounded-lg text-sm transition-colors`}><X size={14} /></button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <input placeholder="Description (optional)" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className={`${iBg} border ${iBo} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                <div className="flex items-center gap-1">
                                  <Image size={14} className={`${mt} flex-shrink-0`} />
                                  <input placeholder="Image URL (optional)" value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {!isExp && <button className={'absolute right-0 top-1 p-1 ' + mt + ' hover:text-gray-400 transition-colors'} onClick={() => setExpandedPersonId(person.id)}><ChevronDown size={compactMode ? 12 : 14} /></button>}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className={'mt-6 pt-3 border-t ' + bc}>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(CL).map(([k, l]) => <div key={k} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: CC[k as LifeEvent['category']]}} /><span className={'text-xs ' + mt}>{l}</span></div>)}
                  <div className={'flex items-center gap-1.5 ml-2 pl-2 border-l ' + bc}>
                    <div className={'w-2 h-2 bg-white rounded-full border ' + (d ? 'border-gray-500' : 'border-gray-300')} />
                    <span className={'text-xs ' + mt}>Has image</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hover popout */}
      {hoveredEvent && (() => {
        const pw = hoveredEvent.event.imageUrl ? 320 : 280, ph = hoveredEvent.event.imageUrl ? 280 : 120, pad = 12
        let left = hoveredEvent.x, top = hoveredEvent.y - 10, tx = '-50%', ty = '-100%'
        if (left - pw / 2 < pad) left = pad + pw / 2
        if (left + pw / 2 > window.innerWidth - pad) left = window.innerWidth - pad - pw / 2
        if (top - ph < pad) { top = hoveredEvent.y + 20; ty = '0%' }
        return <div className="fixed z-50 pointer-events-none" style={{left: left + 'px', top: top + 'px', transform: `translate(${tx}, ${ty})`}}>
          <div className={pBg + ' border ' + pBo + ' rounded-xl shadow-2xl overflow-hidden'} style={{width: pw + 'px', maxHeight: (window.innerHeight - pad * 2) + 'px'}}>
            {hoveredEvent.event.imageUrl && <div className={'w-full overflow-hidden flex items-center justify-center ' + iBg} style={{maxHeight: '200px'}}><img src={hoveredEvent.event.imageUrl} alt={hoveredEvent.event.title} className="max-w-full max-h-full object-contain" style={{maxHeight: '200px'}} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /></div>}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: CC[hoveredEvent.event.category]}} />
                <span className={'text-xs font-mono ' + mt}>{formatYear(hoveredEvent.event.year)}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{backgroundColor: CC[hoveredEvent.event.category] + '20', color: CC[hoveredEvent.event.category]}}>{CL[hoveredEvent.event.category]}</span>
              </div>
              <p className="text-sm font-semibold">{hoveredEvent.event.title}</p>
              <p className={'text-xs ' + st + ' mt-0.5'}>{hoveredEvent.event.description}</p>
              <p className="text-xs mt-1.5" style={{color: hoveredEvent.person.color}}>{hoveredEvent.person.name}</p>
            </div>
          </div>
        </div>
      })()}

      {/* Add Person Modal */}
      {showAddPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAddPerson(false)}>
          <div className={cBg + ' border ' + bc + ' rounded-2xl p-6 w-full max-w-md shadow-2xl'} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Person</h2>
              <button onClick={() => setShowAddPerson(false)} className={'p-1 ' + hov + ' rounded-lg transition-colors'}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={newPerson.name} onChange={e => setNewPerson({...newPerson, name: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Birth Year" value={newPerson.birthYear} onChange={e => setNewPerson({...newPerson, birthYear: e.target.value})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                <input type="number" placeholder="Death Year (optional)" value={newPerson.deathYear} onChange={e => setNewPerson({...newPerson, deathYear: e.target.value})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <textarea placeholder="Short description (optional)" value={newPerson.description} onChange={e => setNewPerson({...newPerson, description: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16`} />
              <textarea placeholder="Notes (optional) - additional details, fun facts, references..." value={newPerson.notes} onChange={e => setNewPerson({...newPerson, notes: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16`} />
              <div>
                <label className={`text-xs ${mt} mb-1 block`}>Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map(g => <button key={g.id} type="button" onClick={() => setNewPerson({...newPerson, groupIds: newPerson.groupIds.includes(g.id) ? newPerson.groupIds.filter(id => id !== g.id) : [...newPerson.groupIds, g.id]})} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${newPerson.groupIds.includes(g.id) ? 'text-white border-transparent' : mt + ' ' + iBo}`} style={newPerson.groupIds.includes(g.id) ? {backgroundColor: g.color} : {}}>{g.name}</button>)}
                  {showInlineNewGroup === 'add' ? (
                    <div className="flex items-center gap-1">
                      <input value={inlineNewGroupName} onChange={e => setInlineNewGroupName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const g = addInlineGroup(); if (g) setNewPerson({...newPerson, groupIds: [...newPerson.groupIds, g.id]}) } if (e.key === 'Escape') { setShowInlineNewGroup(null); setInlineNewGroupName('') } }} placeholder="New group..." className={`${iBg} border ${iBo} rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24`} autoFocus />
                      <button type="button" onClick={() => { const g = addInlineGroup(); if (g) setNewPerson({...newPerson, groupIds: [...newPerson.groupIds, g.id]}) }} className="p-0.5 bg-blue-600 hover:bg-blue-700 rounded text-white"><Check size={10} /></button>
                      <button type="button" onClick={() => { setShowInlineNewGroup(null); setInlineNewGroupName('') }} className={`p-0.5 ${iBg} rounded`}><X size={10} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowInlineNewGroup('add')} className={`px-2.5 py-1 text-xs rounded-full border ${iBo} ${mt} ${hov} transition-colors`}><Plus size={10} className="inline -mt-px" /> New</button>
                  )}
                </div>
              </div>
              <button onClick={addPerson} disabled={!newPerson.name || !newPerson.birthYear} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-white">Add to Timeline</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setEditingPerson(null)}>
          <div className={cBg + ' border ' + bc + ' rounded-2xl p-6 w-full max-w-md shadow-2xl'} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Person</h2>
              <button onClick={() => setEditingPerson(null)} className={'p-1 ' + hov + ' rounded-lg transition-colors'}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={editingPerson.name} onChange={e => setEditingPerson({...editingPerson, name: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Birth Year" value={editingPerson.birthYear} onChange={e => setEditingPerson({...editingPerson, birthYear: parseInt(e.target.value) || 0})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                <input type="number" placeholder="Death Year (optional)" value={editingPerson.deathYear ?? ''} onChange={e => setEditingPerson({...editingPerson, deathYear: e.target.value ? parseInt(e.target.value) : null})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <textarea placeholder="Short description" value={editingPerson.description} onChange={e => setEditingPerson({...editingPerson, description: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16`} />
              <textarea placeholder="Notes (optional)" value={editingPerson.notes || ''} onChange={e => setEditingPerson({...editingPerson, notes: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16`} />
              <div>
                <label className={`text-xs ${mt} mb-1 block`}>Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map(g => <button key={g.id} type="button" onClick={() => { const gids = editingPerson.groupIds || []; setEditingPerson({...editingPerson, groupIds: gids.includes(g.id) ? gids.filter(id => id !== g.id) : [...gids, g.id]}) }} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${(editingPerson.groupIds || []).includes(g.id) ? 'text-white border-transparent' : mt + ' ' + iBo}`} style={(editingPerson.groupIds || []).includes(g.id) ? {backgroundColor: g.color} : {}}>{g.name}</button>)}
                  {showInlineNewGroup === 'edit' ? (
                    <div className="flex items-center gap-1">
                      <input value={inlineNewGroupName} onChange={e => setInlineNewGroupName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const g = addInlineGroup(); if (g) setEditingPerson({...editingPerson, groupIds: [...(editingPerson.groupIds || []), g.id]}) } if (e.key === 'Escape') { setShowInlineNewGroup(null); setInlineNewGroupName('') } }} placeholder="New group..." className={`${iBg} border ${iBo} rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24`} autoFocus />
                      <button type="button" onClick={() => { const g = addInlineGroup(); if (g) setEditingPerson({...editingPerson, groupIds: [...(editingPerson.groupIds || []), g.id]}) }} className="p-0.5 bg-blue-600 hover:bg-blue-700 rounded text-white"><Check size={10} /></button>
                      <button type="button" onClick={() => { setShowInlineNewGroup(null); setInlineNewGroupName('') }} className={`p-0.5 ${iBg} rounded`}><X size={10} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowInlineNewGroup('edit')} className={`px-2.5 py-1 text-xs rounded-full border ${iBo} ${mt} ${hov} transition-colors`}><Plus size={10} className="inline -mt-px" /> New</button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={'text-sm ' + st}>Color:</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PERSON_COLORS.map(color => <button key={color} className={'w-6 h-6 rounded-full transition-transform ' + (editingPerson.color === color ? 'ring-2 ring-white scale-125' : 'hover:scale-110')} style={{backgroundColor: color}} onClick={() => setEditingPerson({...editingPerson, color})} />)}
                </div>
              </div>
              <button onClick={saveEditPerson} className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white"><Check size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setEditingEvent(null)}>
          <div className={cBg + ' border ' + bc + ' rounded-2xl p-6 w-full max-w-md shadow-2xl'} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className={'p-1 ' + hov + ' rounded-lg transition-colors'}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Event title" value={editingEvent.event.title} onChange={e => setEditingEvent({...editingEvent, event: {...editingEvent.event, title: e.target.value}})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Year" value={editingEvent.event.year} onChange={e => setEditingEvent({...editingEvent, event: {...editingEvent.event, year: parseInt(e.target.value) || 0}})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                <select value={editingEvent.event.category} onChange={e => setEditingEvent({...editingEvent, event: {...editingEvent.event, category: e.target.value as LifeEvent['category']}})} className={`${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  {Object.entries(CL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <textarea placeholder="Description" value={editingEvent.event.description} onChange={e => setEditingEvent({...editingEvent, event: {...editingEvent.event, description: e.target.value}})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16`} />
              <div className="flex items-center gap-2">
                <Image size={14} className={`${mt} flex-shrink-0`} />
                <input placeholder="Image URL (optional)" value={editingEvent.event.imageUrl || ''} onChange={e => setEditingEvent({...editingEvent, event: {...editingEvent.event, imageUrl: e.target.value || undefined}})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              </div>
              <button onClick={saveEditEvent} className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white"><Check size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddConnection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAddConnection(false)}>
          <div className={cBg + ' border ' + bc + ' rounded-2xl p-6 w-full max-w-md shadow-2xl'} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Connection</h2>
              <button onClick={() => setShowAddConnection(false)} className={'p-1 ' + hov + ' rounded-lg transition-colors'}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select value={newConnection.fromId} onChange={e => setNewConnection({...newConnection, fromId: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                <option value="">From person...</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={newConnection.toId} onChange={e => setNewConnection({...newConnection, toId: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                <option value="">To person...</option>
                {people.filter(p => p.id !== newConnection.fromId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input placeholder="Relationship label (e.g. Influenced, Mentored)" value={newConnection.label} onChange={e => setNewConnection({...newConnection, label: e.target.value})} className={`w-full ${iBg} border ${iBo} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
              <button onClick={addConnection} disabled={!newConnection.fromId || !newConnection.toId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-white">Add Connection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
