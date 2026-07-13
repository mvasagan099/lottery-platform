import { Link } from 'react-router-dom'
import { Zap, Shield, Phone, Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const columns = [
    {
      heading: 'Games',
      links: [
        { label: 'MegaDraw', href: '/games/megadraw' },
        { label: 'Powerball', href: '/games/powerball' },
        { label: 'Saturday Lotto', href: '/games/saturday-lotto' },
        { label: 'Set for Life', href: '/games/set-for-life' },
        { label: 'Weekday Windfall', href: '/games/weekday-windfall' },
      ],
    },
    {
      heading: 'Support',
      links: [
        { label: 'Help Centre', href: '/support' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Results', href: '/results' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Responsible Gaming', href: '/responsible-gaming' },
      ],
    },
  ]

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div>
            <div className="footer-logo">
              <Zap size={20} style={{ display: 'inline', color: 'var(--color-secondary)', marginRight: '6px' }} />
              Mega<span>Draw</span>
            </div>
            <p className="footer-desc">
              Australia's premier online lottery platform. Play MegaDraw, Powerball, Saturday Lotto and more — safely and securely.
            </p>
            <div className="responsible-gaming-banner">
              <Shield size={14} />
              <span>18+ only | Gamble Responsibly | <a href="/responsible-gaming" style={{ color: 'inherit', textDecoration: 'underline' }}>Get Help</a></span>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="tel:1800695686" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} /> 1800 MegaDraw
              </a>
              <a href="mailto:support@MegaDraw.com" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} /> support@MegaDraw.com
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="footer-heading">{col.heading}</div>
              <nav className="footer-links">
                {col.links.map((link) => (
                  <Link key={link.href} to={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-text">
            © {currentYear} MegaDraw Pty Ltd. All rights reserved. ABN 12 345 678 901
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="https://www.gamblinghelponline.org.au"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <ExternalLink size={12} /> Gambling Help Online: 1800 858 858
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
