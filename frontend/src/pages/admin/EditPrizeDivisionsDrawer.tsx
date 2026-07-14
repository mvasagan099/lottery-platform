import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  gameId: string
  initialDivisions: any[]
}

export function EditPrizeDivisionsDrawer({ isOpen, onClose, gameId, initialDivisions }: Props) {
  const queryClient = useQueryClient()
  const [divisions, setDivisions] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setDivisions(initialDivisions ? [...initialDivisions] : [])
    }
  }, [isOpen, initialDivisions])

  const addDivision = () => {
    setDivisions([
      ...divisions,
      {
        id: `temp-${Date.now()}`,
        divisionName: `Division ${divisions.length + 1}`,
        description: '',
        matchNumbers: 0,
        matchSupp: 0,
        matchPB: false,
        isJackpot: false,
        fixedPrize: ''
      }
    ])
  }

  const removeDivision = (index: number) => {
    const newDivs = [...divisions]
    newDivs.splice(index, 1)
    setDivisions(newDivs)
  }

  const updateDivision = (index: number, field: string, value: any) => {
    const newDivs = [...divisions]
    newDivs[index] = { ...newDivs[index], [field]: value }
    setDivisions(newDivs)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Clean up temp ids and ensure numbers are properly parsed
      const payload = divisions.map((div, i) => ({
        divisionName: div.divisionName,
        divisionOrder: i + 1,
        description: div.description,
        matchNumbers: parseInt(div.matchNumbers || 0),
        matchSupp: parseInt(div.matchSupp || 0),
        matchPB: Boolean(div.matchPB),
        isJackpot: Boolean(div.isJackpot),
        fixedPrize: div.isJackpot ? null : (div.fixedPrize ? String(div.fixedPrize) : null)
      }))

      return api.patch(`/admin/games/${gameId}/divisions`, { divisions: payload })
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['admin', 'games', gameId] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update divisions')
  })

  if (!isOpen) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '900px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Edit Prize Divisions
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xl)' }}>
          {divisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No divisions configured for this game.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {divisions.map((div, i) => (
                <div key={div.id || i} className="card" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
                  <button 
                    onClick={() => removeDivision(i)}
                    style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    title="Remove Division"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                      <label className="form-label">Division Name</label>
                      <input type="text" className="form-input" value={div.divisionName || ''} onChange={e => updateDivision(i, 'divisionName', e.target.value)} placeholder="e.g. Division 1" />
                    </div>
                    <div>
                      <label className="form-label">Main Numbers Match</label>
                      <input type="number" className="form-input" value={div.matchNumbers || ''} onChange={e => updateDivision(i, 'matchNumbers', e.target.value)} min="0" />
                    </div>
                    <div>
                      <label className="form-label">Supp Numbers Match</label>
                      <input type="number" className="form-input" value={div.matchSupp || ''} onChange={e => updateDivision(i, 'matchSupp', e.target.value)} min="0" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={div.matchPB || false} onChange={e => updateDivision(i, 'matchPB', e.target.checked)} />
                        Requires Powerball
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#f59e0b' }}>
                        <input type="checkbox" checked={div.isJackpot || false} onChange={e => updateDivision(i, 'isJackpot', e.target.checked)} />
                        Is Jackpot Division
                      </label>
                    </div>
                    {!div.isJackpot && (
                      <div>
                        <label className="form-label">Fixed Prize (🪙)</label>
                        <input type="number" step="0.01" className="form-input" value={div.fixedPrize || ''} onChange={e => updateDivision(i, 'fixedPrize', e.target.value)} placeholder="e.g. 50.00" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="btn btn-outline" style={{ marginTop: 'var(--space-lg)', width: '100%' }} onClick={addDivision}>
            <Plus size={18} style={{ marginRight: '8px' }} /> Add Division
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : <><Save size={18} style={{ marginRight: '8px' }} /> Save Divisions</>}
          </button>
        </div>

      </div>
    </>
  )
}
