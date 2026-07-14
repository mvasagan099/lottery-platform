import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsLayout } from './settings/SettingsLayout';
import { SettingsDashboard } from './settings/SettingsDashboard';
import { GeneralSettingsPage } from './settings/GeneralSettingsPage';
import { LotterySettingsPage } from './settings/LotterySettingsPage';
import { UserSettingsPage } from './settings/UserSettingsPage';
import { WalletSettingsPage } from './settings/WalletSettingsPage';
import { SecuritySettingsPage } from './settings/SecuritySettingsPage';
import { RolesDashboard } from './settings/roles/RolesDashboard';
import { RoleDetails } from './settings/roles/RoleDetails';

export function SettingsPage() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<SettingsDashboard />} />
        <Route path="general" element={<GeneralSettingsPage />} />
        <Route path="lottery" element={<LotterySettingsPage />} />
        <Route path="users" element={<UserSettingsPage />} />
        <Route path="wallet" element={<WalletSettingsPage />} />
        <Route path="security" element={<SecuritySettingsPage />} />
        <Route path="roles" element={<RolesDashboard />} />
        <Route path="roles/:id" element={<RoleDetails />} />
        {/* Detail pages can be added here or nested */}
        
        {/* Placeholder routes for others */}
        <Route path="*" element={
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Coming Soon</h2>
            <p>This settings module is currently under development.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default SettingsPage;
