import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, Calendar, Save, Hash, DollarSign, Dices } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultGameId?: string
}

export function ScheduleDrawDrawer({ isOpen, onClose, defaultGameId }: Props) {
  const queryClient = useQueryClient()
  
  const [gameId, setGameId] = useState('')
  const [drawNumber, setDrawNumber] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [jackpotAmount, setJackpotAmount] = useState('')

  const { data: gamesData } = useQuery({
    queryKey: ['admin', 'games', 'dropdown'],
    queryFn: async () => {
      const res = await api.get('/admin/games')
      return res.data.data
    },
    enabled: isOpen
  })

  // Autofill logic when a game is selected
  const handleGameSelect = (id: string) => {
    setGameId(id)
    const game = gamesData?.find((g: any) => g.id === id)
    if (game) {
      setJackpotAmount(game.jackpotAmount || '0')
      // Auto-increment draw number based on total draws count
      setDrawNumber(String((game._count?.draws || 0) + 1))
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      if (defaultGameId && gamesData) {
        handleGameSelect(defaultGameId)
      } else if (!defaultGameId) {
        setGameId('')
        setDrawNumber('')
        setScheduledDate('')
        setScheduledTime('')
        setJackpotAmount('')
      }
    }
  }, [isOpen, defaultGameId, gamesData])

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!gameId || !drawNumber || !scheduledDate || !scheduledTime || !jackpotAmount) {
        throw new Error('Please fill in all fields')
      }
      
      const dt = new Date(`${scheduledDate}T${scheduledTime}`)
      
      return api.post('/admin/draws', {
        gameId,
        drawNumber: parseInt(drawNumber),
        scheduledAt: dt.toISOString(),
        jackpotAmount: parseFloat(jackpotAmount)
      })
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] })
      
      // Reset form
      setGameId('')
      setDrawNumber('')
      setScheduledDate('')
      setScheduledTime('')
      setJackpotAmount('')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to schedule draw')
    }
  })

  if (!isOpen) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} color="var(--primary-color)"/> Schedule New Draw</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Dices size={16}/> Lottery Game</label>
              <select className="form-select" value={gameId} onChange={(e) => handleGameSelect(e.target.value)}>
                <option value="">Select a Game...</option>
                {gamesData?.map((game: any) => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={16}/> Draw Number</label>
              <input type="number" className="form-input" value={drawNumber} onChange={(e) => setDrawNumber(e.target.value)} placeholder="e.g. 100" />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16}/> Date</label>
                <input type="date" className="form-input" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Time (Local)</label>
                <input type="time" className="form-input" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16}/> Jackpot Amount (🪙)</label>
              <input type="number" step="0.01" className="form-input" value={jackpotAmount} onChange={(e) => setJackpotAmount(e.target.value)} />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={scheduleMutation.isPending}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending}>
            {scheduleMutation.isPending ? <div className="btn-spinner" /> : <><Save size={18} /> Schedule Draw</>}
          </button>
        </div>

      </div>
    </>
  )
}
