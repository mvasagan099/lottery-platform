import React from 'react'

export function TermsPage() {
  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="section-title">Terms & Conditions</h1>
        <div className="card card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <h2>1. Introduction</h2>
          <p>Welcome to MegaDraw. By accessing our platform, you agree to these terms.</p>
          <h2>2. Eligibility</h2>
          <p>You must be 18 years or older and a resident of Australia to play.</p>
          <h2>3. Account Registration</h2>
          <p>You must provide accurate information. Identity verification (KYC) is required for withdrawals.</p>
        </div>
      </div>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="section-title">Privacy Policy</h1>
        <div className="card card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <h2>1. Data Collection</h2>
          <p>We collect personal information necessary to provide our services and comply with AML/CTF laws.</p>
          <h2>2. Data Security</h2>
          <p>All data is encrypted and securely stored in Australia.</p>
        </div>
      </div>
    </div>
  )
}

export function ResponsibleGamingPage() {
  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="section-title">Responsible Gaming</h1>
        <div className="card card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <h2>Play Safely</h2>
          <p>Gambling should be entertaining. Never chase losses or play with money you can't afford to lose.</p>
          <h2>Get Help</h2>
          <p>If you need support, contact Gambling Help Online at 1800 858 858 or visit <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noreferrer">gamblinghelponline.org.au</a>.</p>
        </div>
      </div>
    </div>
  )
}
export default TermsPage
