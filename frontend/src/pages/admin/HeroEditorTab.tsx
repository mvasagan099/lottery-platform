import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/index'
import { Save, LayoutTemplate, Settings2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function HeroEditorTab() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<Record<string, string>>({})

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings(),
    select: (r) => r.data?.data || [],
  })

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const heroSettings = settingsData.reduce((acc: any, s: any) => {
        acc[s.key] = s.value
        return acc
      }, {})
      setFormData({
        HERO_JACKPOT_TITLE: heroSettings['HERO_JACKPOT_TITLE'] || 'COMBINED JACKPOT',
        HERO_JACKPOT_SUBTITLE: heroSettings['HERO_JACKPOT_SUBTITLE'] || 'Across all 9 games this week',
        HERO_STATS_GAMES: heroSettings['HERO_STATS_GAMES'] || '9',
        HERO_STATS_MEMBERS: heroSettings['HERO_STATS_MEMBERS'] || '100K+',
        HERO_STATS_PAID: heroSettings['HERO_STATS_PAID'] || '🪙50M+',
      })
    } else {
      setFormData({
        HERO_JACKPOT_TITLE: 'COMBINED JACKPOT',
        HERO_JACKPOT_SUBTITLE: 'Across all 9 games this week',
        HERO_STATS_GAMES: '9',
        HERO_STATS_MEMBERS: '100K+',
        HERO_STATS_PAID: '🪙50M+',
      })
    }
  }, [settingsData])

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminService.updateSetting(data),
    onSuccess: () => {
      toast.success('Hero settings updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    },
    onError: () => toast.error('Failed to update hero settings')
  })

  const handleSave = () => {
    mutation.mutate(formData)
  }

  if (isLoading) return <div className="p-xl text-center">Loading settings...</div>

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutTemplate size={20} />
              Hero Advanced Settings
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Configure the static text fields displayed on the homepage hero section. (Note: The main headline, subtitle, background image, and button link are edited via the Banner Manager tab &gt; "HOME" position banner).
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={mutation.isPending}
          >
            <Save size={16} />
            {mutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Jackpot Widget */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={16} /> Jackpot Widget Text
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Widget Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.HERO_JACKPOT_TITLE || ''} 
                  onChange={e => setFormData(p => ({...p, HERO_JACKPOT_TITLE: e.target.value}))} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Widget Subtitle</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.HERO_JACKPOT_SUBTITLE || ''} 
                  onChange={e => setFormData(p => ({...p, HERO_JACKPOT_SUBTITLE: e.target.value}))} 
                />
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={16} /> Statistics Bar Values
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Lottery Games</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.HERO_STATS_GAMES || ''} 
                  onChange={e => setFormData(p => ({...p, HERO_STATS_GAMES: e.target.value}))} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Members</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.HERO_STATS_MEMBERS || ''} 
                  onChange={e => setFormData(p => ({...p, HERO_STATS_MEMBERS: e.target.value}))} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prizes Paid</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.HERO_STATS_PAID || ''} 
                  onChange={e => setFormData(p => ({...p, HERO_STATS_PAID: e.target.value}))} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
