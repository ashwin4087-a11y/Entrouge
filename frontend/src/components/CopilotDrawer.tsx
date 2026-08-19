import { askCopilot } from '@/api/client'
import { Icon } from '@/components/Icon'
import type { SimulationResult } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CopilotDrawerProps {
  open: boolean
  onClose: () => void
  simulationResult: SimulationResult | null
  onSimulationFromCopilot: (result: SimulationResult) => void
}

const SUGGESTIONS = [
  'What happens if I close Anna Salai?',
  'Predict rush hour congestion for Mount Road.',
]

export function CopilotDrawer({
  open,
  onClose,
  simulationResult,
  onSimulationFromCopilot,
}: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'How can I assist with the Chennai network analysis today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg = text.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const context = simulationResult
        ? {
            delta_travel_time_pct: simulationResult.delta_travel_time_pct,
            delta_co2_kg: simulationResult.delta_co2_kg,
            alternate_routes: simulationResult.alternate_routes,
            baseline: simulationResult.baseline,
            scenario: simulationResult.scenario,
          }
        : undefined

      const response = await askCopilot(userMsg, context)
      setMessages((m) => [...m, { role: 'assistant', content: response.message }])

      if (response.simulation) {
        onSimulationFromCopilot(response.simulation)
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Could not reach the backend. Make sure the API is running on port 8000.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside
      className={`absolute top-0 right-0 z-40 flex h-full w-[380px] flex-col border-l border-outline-variant bg-shell-surface shadow-xl transition-transform duration-300 ease-in-out ${
        open ? 'drawer-open' : 'drawer-closed'
      }`}
    >
      <div className="flex items-center justify-between border-b border-outline-variant bg-white p-4">
        <div className="flex items-center gap-3">
          <Icon name="smart_toy" className="text-brand-accent" />
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-brand-text uppercase">
              Entrouge Copilot
            </h2>
            <div className="mt-1 flex w-fit items-center gap-1.5 rounded border border-brand-accent/20 bg-brand-accent/10 px-2 py-0.5 font-label-sm text-brand-accent">
              <span className="text-[8px]">●</span> CONNECTED TO TWIN
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-canvas"
        >
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-shell-bg p-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[6px] border border-outline-variant p-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'ml-8 bg-brand-accent text-white'
                  : 'bg-white text-brand-text'
              }`}
            >
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <p className="animate-pulse text-xs text-on-surface-variant">Copilot is thinking…</p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <span className="mb-1 font-label-sm uppercase text-on-surface-variant">
            Suggested Prompts
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-[6px] border border-outline-variant bg-white p-3 text-left text-sm text-brand-text shadow-sm transition-colors hover:border-brand-accent"
            >
              {s.includes('Anna Salai') ? (
                <>
                  &quot;What happens if I close{' '}
                  <span className="font-medium text-brand-accent">Anna Salai</span>?&quot;
                </>
              ) : (
                `"${s}"`
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant bg-white p-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask Copilot..."
            className="w-full rounded-[6px] border border-outline-variant bg-shell-bg py-2.5 pl-3 pr-10 text-sm text-brand-text outline-none transition-all placeholder:text-on-surface-variant/70 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => send(input)}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-brand-accent transition-colors hover:text-brand-accent-hover disabled:opacity-50"
          >
            <Icon name="send" className="text-[20px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
