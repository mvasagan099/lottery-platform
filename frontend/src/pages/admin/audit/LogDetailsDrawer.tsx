import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Globe, Monitor, Terminal, Shield, FileJson } from 'lucide-react';
import { AuditLog } from '../../../types/audit';

interface Props {
  log: AuditLog | null;
  onClose: () => void;
}

export function LogDetailsDrawer({ log, onClose }: Props) {
  if (!log) return null;

  const renderBadge = (status: string, severity: string) => {
    let color = 'var(--text-secondary)';
    let bg = 'var(--bg-secondary)';
    
    if (status === 'SUCCESS') {
      color = 'var(--color-accent-dark)'; bg = 'var(--color-accent-light)';
    } else if (status === 'FAILED' || severity === 'ERROR' || severity === 'CRITICAL') {
      color = '#ef4444'; bg = '#fef2f2';
    } else if (severity === 'WARNING') {
      color = '#f5a623'; bg = '#fefce8';
    }

    return (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: '12px', 
        fontSize: '11px', 
        fontWeight: 600, 
        backgroundColor: bg, 
        color: color,
        border: `1px solid ${color}30`
      }}>
        {status} • {severity}
      </span>
    );
  };

  const DataBlock = ({ title, data }: { title: string, data: any }) => {
    if (!data) return null;
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileJson size={14} /> {title}
        </div>
        <pre style={{ 
          margin: 0,
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          overflowX: 'auto',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(2px)' }} 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '600px', 
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-color)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{log.action}</h2>
                {renderBadge(log.status, log.severity)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Log ID: {log.id} • {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Identity Block */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <Shield size={16} /> Identity & Context
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>User ID</span> {log.userId || 'System'}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</span> {log.userEmail || 'N/A'}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</span> {log.userRole || 'SYSTEM'}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Module</span> {log.module}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Resource</span> <code style={{fontFamily:'var(--font-mono)', fontSize:'12px', background:'var(--bg-secondary)', padding:'2px 6px', borderRadius:'4px'}}>{log.resource || 'N/A'}</code></div>
              </div>
            </div>

            {/* Network & Device */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <Globe size={16} /> Network & Client
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>IP Address</span> <span style={{fontFamily:'var(--font-mono)'}}>{log.ipAddress}</span></div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Location</span> {log.country} {log.location ? `(${log.location})` : ''}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Device</span> {log.device} • {log.os}</div>
                <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Browser</span> {log.browser}</div>
              </div>
            </div>

            {/* API Context (if exists) */}
            {(log.apiEndpoint || log.httpMethod) && (
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  <Terminal size={16} /> API Execution
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Endpoint</span> <code style={{fontFamily:'var(--font-mono)', fontSize:'12px', background:'var(--bg-secondary)', padding:'2px 6px', borderRadius:'4px'}}>{log.httpMethod} {log.apiEndpoint}</code></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Code</span> {log.httpStatus}</div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Execution Time</span> {log.executionTimeMs}ms</div>
                </div>
              </div>
            )}

            {/* Payloads */}
            {(log.requestPayload || log.responsePayload || log.previousData || log.updatedData) && (
              <div>
                <DataBlock title="Request Payload" data={log.requestPayload} />
                <DataBlock title="Response Payload" data={log.responsePayload} />
                <DataBlock title="Previous Data" data={log.previousData} />
                <DataBlock title="Updated Data" data={log.updatedData} />
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
