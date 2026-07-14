import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cmsService } from '@/services/index'
import { LayoutTemplate, ImageIcon, Settings, Plus, Edit2, Trash2 } from 'lucide-react'
import { BannerEditorDrawer } from './BannerEditorDrawer'
import { CmsPageEditorDrawer } from './CmsPageEditorDrawer'
import HeroEditorTab from './HeroEditorTab'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

export default function CmsAdminPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'PAGES' | 'BANNERS' | 'HERO'>('BANNERS')
  
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null)
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false)

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false)

  const { data: banners, isLoading: isBannersLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => cmsService.getAllBanners(),
    select: (r) => r.data?.data || []
  })

  const { data: pages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['admin-pages'],
    // Assume getPages exists or fallback
    queryFn: async () => ({ data: { data: [] } }),
    select: (r) => r.data?.data || []
  })

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => cmsService.deleteBanner(id),
    onSuccess: () => {
      toast.success('Banner deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
    }
  })

  return (
    <div className="page-wrapper">
      <div className="admin-header">
        <div className="container">
          <h1 className="admin-title">CMS & Banners</h1>
          <div className="admin-tabs">
            <button className={`admin-tab ${activeTab === 'BANNERS' ? 'active' : ''}`} onClick={() => setActiveTab('BANNERS')}>Banners</button>
            <button className={`admin-tab ${activeTab === 'PAGES' ? 'active' : ''}`} onClick={() => setActiveTab('PAGES')}>Pages</button>
            <button className={`admin-tab ${activeTab === 'HERO' ? 'active' : ''}`} onClick={() => setActiveTab('HERO')}>Hero Settings</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px' }}>
        
        {activeTab === 'BANNERS' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Banner Manager</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setSelectedBannerId(null); setIsBannerEditorOpen(true) }}>
                <Plus size={16} /> New Banner
              </button>
            </div>
            
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Creative</th>
                    <th>Title & Position</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners?.map((banner: any) => (
                    <tr key={banner.id}>
                      <td>
                        <div style={{ width: '80px', height: '40px', borderRadius: '4px', background: banner.imageUrl ? `url(${banner.imageUrl}) center/cover` : '#222' }} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{banner.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{banner.position}</div>
                      </td>
                      <td>
                        <span className={`badge ${banner.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setSelectedBannerId(banner.id); setIsBannerEditorOpen(true) }}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ color: '#ef4444' }} onClick={() => { if(confirm('Delete banner?')) deleteBannerMutation.mutate(banner.id) }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {banners?.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>No banners found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'PAGES' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>CMS Pages</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setSelectedPageId(null); setIsPageEditorOpen(true) }}>
                <Plus size={16} /> New Page
              </button>
            </div>
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Page manager ready.
            </div>
          </motion.div>
        )}

        {activeTab === 'HERO' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HeroEditorTab />
          </motion.div>
        )}
      </div>

      {isBannerEditorOpen && (
        <BannerEditorDrawer bannerId={selectedBannerId} onClose={() => setIsBannerEditorOpen(false)} />
      )}
      {isPageEditorOpen && (
        <CmsPageEditorDrawer pageId={selectedPageId} onClose={() => setIsPageEditorOpen(false)} />
      )}
    </div>
  )
}
