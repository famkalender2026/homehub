'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, Calendar, CheckSquare, ShoppingCart, ChefHat, BarChart2,
  Plus, Mic, MicOff, Trash2, ChevronLeft
} from 'lucide-react'

interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: string
}

const DEMO_TODOS: Todo[] = [
  { id: 1, text: 'Schulranzen kaufen', done: false, createdAt: new Date().toLocaleDateString('de-DE') },
  { id: 2, text: 'Arzt anrufen', done: false, createdAt: new Date().toLocaleDateString('de-DE') },
  { id: 3, text: 'Rechnung bezahlen', done: true, createdAt: new Date().toLocaleDateString('de-DE') },
]

export default function AufgabenPage() {
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>(DEMO_TODOS)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [isListening, setIsListening] = useState(false)

  function addTodo() {
    const text = input.trim()
    if (!text) return
    setTodos(prev => [{
      id: Date.now(), text, done: false,
      createdAt: new Date().toLocaleDateString('de-DE')
    }, ...prev])
    setInput('')
  }

  function toggleTodo(id: number) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTodo(id: number) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done))
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Spracheingabe nicht verfügbar. Bitte Chrome nutzen.'); return }
    const rec = new SR()
    rec.lang = 'de-DE'; rec.interimResults = false
    rec.onstart = () => setIsListening(true)
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false) }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    rec.start()
  }

  const filtered = todos.filter(t =>
    t.text.toLowerCase().includes(search.toLowerCase())
  )
  const open = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-20">
      <header className="bg-[#1a3a5c] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.push('/dashboard')} className="text-blue-200">
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium text-sm">Aufgaben</span>
        <span className="text-xs text-blue-200">{open.length} offen</span>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {/* Eingabe */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Neue Aufgabe eingeben..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2d6a9f] text-[#1a3a5c]"
            />
            <button
              onClick={startVoice}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0 ${
                isListening ? 'bg-red-500 animate-pulse' : 'bg-[#2d6a9f]'
              }`}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button
              onClick={addTodo}
              className="w-10 h-10 rounded-xl bg-[#2d6a9f] text-white flex items-center justify-center hover:bg-[#1a3a5c] transition-colors flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
          {/* Suche */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Aufgaben durchsuchen..."
            className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2d6a9f] text-[#1a3a5c]"
          />
        </div>

        {/* Offene Aufgaben */}
        {open.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#7a8fa6] mb-2 px-1">Offen ({open.length})</p>
            {open.map(t => (
              <div key={t.id} className="bg-white rounded-xl px-4 py-3 shadow-sm mb-2 flex items-center gap-3">
                <button
                  onClick={() => toggleTodo(t.id)}
                  className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 hover:border-[#2d9f6a] transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1a3a5c]">{t.text}</p>
                  <p className="text-[10px] text-[#7a8fa6]">{t.createdAt}</p>
                </div>
                <button onClick={() => deleteTodo(t.id)} className="p-1.5 text-[#7a8fa6] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Erledigte Aufgaben */}
        {done.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-medium text-[#7a8fa6]">Erledigt ({done.length})</p>
              <button onClick={clearDone} className="text-xs text-red-400 hover:text-red-600">
                Aufräumen
              </button>
            </div>
            {done.map(t => (
              <div key={t.id} className="bg-white rounded-xl px-4 py-3 shadow-sm mb-2 flex items-center gap-3 opacity-60">
                <button
                  onClick={() => toggleTodo(t.id)}
                  className="w-5 h-5 rounded bg-[#2d9f6a] border-2 border-[#2d9f6a] flex-shrink-0 flex items-center justify-center"
                >
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#7a8fa6] line-through">{t.text}</p>
                </div>
                <button onClick={() => deleteTodo(t.id)} className="p-1.5 text-[#ccc] hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-[#7a8fa6] text-sm">
            {search ? 'Keine Aufgaben gefunden' : 'Keine Aufgaben vorhanden 🎉'}
          </div>
        )}
      </div>

      <BottomNav active="aufgaben" />
    </div>
  )
}

function BottomNav({ active }: { active: string }) {
  const router = useRouter()
  const items = [
    { id: 'dashboard', label: 'Start', icon: Home, path: '/dashboard' },
    { id: 'kalender', label: 'Kalender', icon: Calendar, path: '/kalender' },
    { id: 'aufgaben', label: 'Aufgaben', icon: CheckSquare, path: '/aufgaben' },
    { id: 'einkauf', label: 'Einkauf', icon: ShoppingCart, path: '/einkauf' },
    { id: 'rezepte', label: 'Rezepte', icon: ChefHat, path: '/rezepte' },
    { id: 'analyse', label: 'Analyse', icon: BarChart2, path: '/analyse' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 max-w-[430px] mx-auto">
      {items.map(({ id, label, icon: Icon, path }) => (
        <button key={id} onClick={() => router.push(path)}
          className={`flex-1 flex flex-col items-center py-2 pb-3 gap-0.5 text-[10px] transition-colors ${
            active === id ? 'text-[#2d6a9f]' : 'text-[#7a8fa6]'
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}