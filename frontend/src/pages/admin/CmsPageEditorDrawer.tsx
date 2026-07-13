import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, Save, Eye, Globe, Settings, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

interface Props {
  pageId: string | null
  onClose: () => void
}

export function CmsPageEditorDrawer({ pageId, onClose }: Props) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDesc: '',
    isActive: false
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true })
    ],
    content: '<p>Start writing your page content here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px]',
      },
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'pages', pageId],
    queryFn: async () => {
      if (!pageId) return null
      const res = await api.get(`/admin/cms/pages`)
      const page = res.data.data.find((p: any) => p.id === pageId)
      return page
    },
    enabled: !!pageId
  })

  useEffect(() => {
    if (data && editor) {
      setFormData({
        title: data.title,
        slug: data.slug,
        metaTitle: data.metaTitle || '',
        metaDesc: data.metaDesc || '',
        isActive: data.isActive
      })
      editor.commands.setContent(data.content || '')
    }
  }, [data, editor])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        content: editor?.getHTML() || ''
      }
      if (pageId) {
        return api.put(`/admin/cms/pages/${pageId}`, payload)
      } else {
        return api.post(`/admin/cms/pages`, payload)
      }
    },
    onSuccess: () => {
      toast.success(pageId ? 'Page updated successfully' : 'Page created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'analytics'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to save page')
    }
  })

  const handleSlugify = () => {
    setFormData(prev => ({
      ...prev,
      slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }))
  }

  // Tiptap Toolbar
  const MenuBar = () => {
    if (!editor) return null
    return (
      <div style={{ display: 'flex', gap: '8px', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`btn ${editor.isActive('bold') ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>Bold</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn ${editor.isActive('italic') ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>Italic</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn ${editor.isActive('heading', { level: 2 }) ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>H2</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`btn ${editor.isActive('heading', { level: 3 }) ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>H3</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>Bullet List</button>
        <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
        <button onClick={() => {
          const url = window.prompt('URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }} className={`btn btn-outline`} style={{ padding: '4px 8px', fontSize: '12px' }}>Link</button>
        <button onClick={() => {
          const url = window.prompt('Image URL')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }} className={`btn btn-outline`} style={{ padding: '4px 8px', fontSize: '12px' }}>Image</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '1000px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{pageId ? 'Edit Page' : 'Create New Page'}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Rich text editing with SEO metadata</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData(p => ({...p, isActive: e.target.checked}))} />
              Published
            </label>
            <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              <Save size={18} style={{ marginRight: '6px' }} /> {mutation.isPending ? 'Saving...' : 'Save Page'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
          
          {/* Editor Area */}
          <div style={{ flex: 1, padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', borderRight: '1px solid var(--border-color)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Page Title (e.g. Terms & Conditions)" 
                style={{ fontSize: '24px', fontWeight: 700, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', borderBottom: '2px solid var(--border-color)', borderRadius: 0 }}
                value={formData.title}
                onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                onBlur={!pageId && !formData.slug ? handleSlugify : undefined}
              />
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <MenuBar />
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto', backgroundColor: '#fff', color: '#000' }}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div style={{ width: '300px', backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', overflowY: 'auto' }}>
            
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16}/> Page Settings</h3>
              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <input type="text" className="form-input" value={formData.slug} onChange={e => setFormData(p => ({...p, slug: e.target.value}))} />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16}/> SEO Metadata</h3>
              <div className="form-group">
                <label className="form-label">Meta Title</label>
                <input type="text" className="form-input" value={formData.metaTitle} onChange={e => setFormData(p => ({...p, metaTitle: e.target.value}))} placeholder="Max 60 chars" />
              </div>
              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.metaDesc} onChange={e => setFormData(p => ({...p, metaDesc: e.target.value}))} placeholder="Max 160 chars" />
              </div>

              {/* SERP Preview */}
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Google Search Preview</div>
                <div style={{ color: '#1a0dab', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.metaTitle || formData.title || 'Page Title'}</div>
                <div style={{ color: '#006621', fontSize: '12px' }}>https://yoursite.com/{formData.slug || 'slug'}</div>
                <div style={{ color: '#545454', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{formData.metaDesc || 'No meta description provided. Search engines will generate a snippet from page content.'}</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </>
  )
}
