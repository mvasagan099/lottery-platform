import React from 'react'


export { default as KYCPage } from './KYCQueuePage'

export function GamesPage() {
  return <div className="section"><div className="container"><h2>Manage Games</h2><p>Edit game settings and schedules here.</p></div></div>
}
export { default as WalletAdminPage } from './WalletAdminPage'

export { default as CmsAdminPage } from './CmsAdminPage'
export function SupportAdminPage() {
  return <div className="section"><div className="container"><h2>Support Tickets</h2><p>Reply to user support tickets.</p></div></div>
}
export function AuditLogsPage() {
  return <div className="section"><div className="container"><h2>Audit Logs</h2><p>View system-wide audit logs.</p></div></div>
}
export { default as AdminDashboard } from './AdminDashboard'
export { default as UsersPage } from './UsersPage'
export { default as ReportsPage } from './ReportsPage'
export { default as DrawsPage } from './DrawsAdminPage'
export { default as WithdrawalsPage } from './WithdrawalsAdminPage'

export { default as AffiliatesPage } from './AffiliatesPage'
export { default as GamesAdminPage } from './GamesAdminPage'
export function SettingsPage() {
  return <div className="section"><div className="container"><h2>System Settings</h2><p>Configure global platform settings.</p></div></div>
}
export { default as AffiliatesAdminPage } from './AffiliatesPage'
