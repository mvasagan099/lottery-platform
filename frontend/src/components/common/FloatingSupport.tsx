import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, X, ChevronRight, MessageCircle, Send, ArrowLeft } from 'lucide-react'

// ── Page-aware predefined questions ──────────────────────────────────────────
interface FAQ {
  question: string
  answer: string
}

const PAGE_FAQS: Record<string, FAQ[]> = {
  '/': [
    {
      question: 'How do I start playing?',
      answer: 'Simply register a free account, make a deposit, and choose from our available lottery games on the Games page. You can buy tickets instantly!',
    },
    {
      question: 'When are draws held?',
      answer: 'Draw schedules vary by game. Visit the Results page or each individual game page to see the next draw time.',
    },
    {
      question: 'How do I claim a prize?',
      answer: 'Prizes are automatically credited to your wallet. For large prizes, you may need to complete KYC verification first.',
    },
    {
      question: 'Is the platform secure?',
      answer: 'Yes! We use bank-level encryption, two-factor authentication, and all draws are provably fair and audited.',
    },
  ],
  '/games': [
    {
      question: 'How do I buy a ticket?',
      answer: "Click on any game, select your numbers (or use Quick Pick), choose your draws, and confirm with your wallet balance.",
    },
    {
      question: 'What is Quick Pick?',
      answer: "Quick Pick randomly selects your numbers for you. It's fast and gives you the same odds as manually chosen numbers.",
    },
    {
      question: 'Can I buy multiple tickets?',
      answer: 'Yes! You can buy multiple tickets per draw and across multiple games at the same time.',
    },
    {
      question: 'What are the odds of winning?',
      answer: "Odds vary by game. Check each game's detail page for specific odds and prize tier breakdowns.",
    },
    {
      question: 'Can I subscribe to a game?',
      answer: 'Yes, you can set up a subscription to automatically purchase tickets for every upcoming draw.',
    },
    {
      question: 'How do I check my numbers?',
      answer: "Go to 'My Tickets' to see if your numbers match the latest draw.",
    },
    {
      question: 'What happens if I lose my connection while buying?',
      answer: "Your transaction will either complete and show in 'My Tickets', or fail and no funds will be deducted.",
    },
  ],
  '/games/saturday-lotto': [
    {
      question: 'When is Saturday Lotto drawn?',
      answer: 'Saturday Lotto is drawn every Saturday night.',
    },
    {
      question: 'How do I win Division 1?',
      answer: 'You need to match all 6 winning numbers in a single game panel.',
    },
    {
      question: 'What are supplementary numbers?',
      answer: 'After the 6 main numbers, 2 supplementary numbers are drawn to determine prizes in Divisions 2, 5, and 6.',
    },
    {
      question: 'What is a System entry?',
      answer: 'A System entry allows you to pick more than 6 numbers, giving you more chances to win across multiple combinations.',
    },
    {
      question: 'Is the jackpot guaranteed?',
      answer: 'Yes, there is usually a guaranteed minimum Division 1 prize pool, often $5 Million.',
    },
  ],
  '/games/megadraw': [
    {
      question: 'When is the next Megadraw?',
      answer: 'Megadraws are special events held throughout the year, often around holidays or special occasions. Check the timer for the next draw!',
    },
    {
      question: 'How big are Megadraw jackpots?',
      answer: 'Megadraws feature massive prize pools, often starting at $20 Million or $30 Million.',
    },
    {
      question: 'Are the rules the same as Saturday Lotto?',
      answer: 'Yes, Megadraws follow the exact same rules as standard Saturday Lotto draws.',
    },
    {
      question: 'Can I play a Syndicate in Megadraw?',
      answer: 'Yes, Syndicates are very popular for Megadraws to increase your chances of winning by pooling tickets.',
    },
    {
      question: 'What if I miss the deadline?',
      answer: 'Ticket sales close approximately 1 hour before the draw. Any tickets bought after will be for the next available draw.',
    },
  ],
  '/games/powerball': [
    {
      question: 'How do I play Powerball?',
      answer: 'Select 7 numbers from 1 to 35, plus 1 Powerball number from 1 to 20.',
    },
    {
      question: 'What is the Powerball?',
      answer: 'The Powerball is a special number drawn from a separate barrel. You must match the Powerball to win Division 1.',
    },
    {
      question: 'When are Powerball draws?',
      answer: 'Powerball is drawn every Thursday night.',
    },
    {
      question: 'What is a PowerHit?',
      answer: 'A PowerHit ticket guarantees you the winning Powerball number, significantly increasing your chances of winning Division 1.',
    },
    {
      question: 'Do Powerball jackpots roll over?',
      answer: 'Yes, if there is no Division 1 winner, the jackpot rolls over and increases for the next week.',
    },
  ],
  '/games/weekday-windfall': [
    {
      question: 'When is Weekday Windfall drawn?',
      answer: 'Weekday Windfall gives you chances to win on Monday, Wednesday, and Friday nights.',
    },
    {
      question: 'How many numbers do I need to pick?',
      answer: 'You select 6 numbers from a pool of 1 to 45.',
    },
    {
      question: 'What is the top prize?',
      answer: 'The Division 1 prize is a guaranteed $1 Million for up to 6 winners per draw.',
    },
    {
      question: 'Do the numbers change between days?',
      answer: 'No, you use the same pool of numbers (1-45) for all three weekly draws.',
    },
    {
      question: 'Is it easier to win than Powerball?',
      answer: 'The odds of winning Division 1 in Weekday Windfall are generally better than Powerball, though the jackpot is smaller.',
    },
  ],
  '/games/set-for-life': [
    {
      question: 'How does Set for Life work?',
      answer: 'If you win Division 1, you receive $20,000 every month for 20 years instead of a single lump sum.',
    },
    {
      question: 'When are the draws?',
      answer: 'Set for Life is drawn every single day of the week.',
    },
    {
      question: 'How do I win the top prize?',
      answer: 'You need to match all 7 winning numbers drawn from 1 to 44.',
    },
    {
      question: 'What happens if there are multiple winners?',
      answer: 'Up to 4 Division 1 winners each receive the full $20K/month. If there are more than 4, a lump sum is shared equally.',
    },
    {
      question: 'What happens to the prize if I pass away?',
      answer: 'The remaining monthly installments will be paid out as a lump sum to your estate.',
    },
  ],
  '/games/super66': [
    {
      question: 'How do I play Super66?',
      answer: 'Super66 is an add-on game. You receive a random 6-digit number. You win by matching the numbers drawn in exact order.',
    },
    {
      question: 'When is it drawn?',
      answer: 'Super66 is drawn every Saturday night alongside Saturday Lotto.',
    },
    {
      question: 'Do I have to play another game to play Super66?',
      answer: 'Usually, Super66 is an add-on to another lottery entry, but in some regions, it can be played standalone.',
    },
    {
      question: 'How are the numbers drawn?',
      answer: 'Six numbered balls are drawn from six separate barrels.',
    },
  ],
  '/games/lucky-lotteries-mega-jackpot': [
    {
      question: 'How do Lucky Lotteries work?',
      answer: 'It operates like a raffle. Each ticket has a unique number, and there is no prize sharing.',
    },
    {
      question: 'What is the jackpot?',
      answer: 'The Mega Jackpot grows continuously until won, and is completely separate from the regular prize draws.',
    },
    {
      question: 'Are there minor prizes?',
      answer: 'Yes, besides the jackpot, there are numerous cash prizes and free tickets drawn in each lottery.',
    },
    {
      question: 'What is the 1st prize?',
      answer: 'The guaranteed 1st prize is $200,000, which is drawn before the jackpot.',
    },
  ],
  '/games/lucky-lotteries-super-jackpot': [
    {
      question: 'How does Super Jackpot differ from Mega?',
      answer: 'Super Jackpot has more tickets per draw (270,000) and a lower ticket price, resulting in a different jackpot pool.',
    },
    {
      question: 'Is prize sharing possible?',
      answer: 'No, because every ticket number is unique in a draw, if you win, you get the entire prize amount.',
    },
    {
      question: 'What is the 1st prize for Super Jackpot?',
      answer: 'The guaranteed 1st prize is $100,000.',
    },
    {
      question: 'Can I choose my ticket number?',
      answer: 'You can choose sequential numbers or random numbers, subject to availability.',
    },
  ],
  '/games/lotto-strike': [
    {
      question: 'How do I play Lotto Strike?',
      answer: 'You must select the first four numbers drawn in the correct order from the corresponding Lotto draw.',
    },
    {
      question: 'When is it drawn?',
      answer: 'Lotto Strike is drawn on Monday, Wednesday, and Saturday nights.',
    },
    {
      question: 'What if I only match 1 number?',
      answer: 'Matching just 1 number in the correct order still wins a prize (usually a free ticket).',
    },
    {
      question: 'Can I play Strike by itself?',
      answer: 'No, Lotto Strike must be played in conjunction with a standard Lotto entry.',
    },
  ],
  '/jackpots': [
    {
      question: 'How do jackpots grow?',
      answer: 'Jackpots increase with every ticket sold. A portion of each ticket price contributes to the prize pool.',
    },
    {
      question: 'What happens if no one wins?',
      answer: 'The jackpot rolls over to the next draw, growing until someone matches all numbers.',
    },
    {
      question: 'How is the jackpot paid?',
      answer: 'Jackpots are credited to your wallet. For very large amounts, funds are processed in batches after KYC verification.',
    },
  ],
  '/results': [
    {
      question: 'Where are my winnings?',
      answer: 'Winnings are automatically credited to your wallet within minutes of a draw. Check your Wallet page.',
    },
    {
      question: 'How far back do results go?',
      answer: 'We display the last 30 draws per game. Contact support if you need older results.',
    },
    {
      question: "Why hasn't my result appeared?",
      answer: 'Results can take a few minutes to process after the draw. Refresh the page or check back shortly.',
    },
  ],
  '/wallet': [
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards, bank transfers, and popular e-wallets. See the Deposit page for the full list.',
    },
    {
      question: 'How long do withdrawals take?',
      answer: 'Withdrawals typically process within 1–3 business days depending on your payment method.',
    },
    {
      question: 'Is there a minimum deposit?',
      answer: "Yes, the minimum deposit is $10. There's no maximum, but large deposits may require verification.",
    },
    {
      question: 'Why is my withdrawal pending?',
      answer: "Pending withdrawals may need KYC verification or are being processed by our payment team. Contact support if it's been over 3 days.",
    },
  ],
  '/wallet/deposit': [
    {
      question: 'What cards do you accept?',
      answer: 'We accept Visa, Mastercard, and American Express. Some prepaid cards may not be supported.',
    },
    {
      question: 'Is my card info safe?',
      answer: "Yes, we use PCI-DSS compliant payment processing. We never store your raw card details.",
    },
    {
      question: 'Why was my deposit declined?',
      answer: 'Declines can happen due to bank restrictions on gambling transactions. Try a different card or contact your bank.',
    },
  ],
  '/wallet/withdraw': [
    {
      question: 'What is the minimum withdrawal?',
      answer: 'The minimum withdrawal is $20. There may also be a small processing fee depending on your method.',
    },
    {
      question: 'Can I cancel a withdrawal?',
      answer: 'Withdrawals can be cancelled if still in "Pending" status. Go to your transaction history to cancel.',
    },
  ],
  '/tickets': [
    {
      question: 'Where are my tickets?',
      answer: 'All your purchased tickets appear here. Filter by game or status to find specific tickets.',
    },
    {
      question: 'What do ticket statuses mean?',
      answer: '"Active" means the draw has not happened yet. "Won" means you matched numbers. "Expired" means the draw passed with no win.',
    },
    {
      question: 'Can I get a refund on a ticket?',
      answer: 'Tickets are non-refundable once purchased. If a draw is cancelled, tickets are refunded automatically.',
    },
  ],
  '/profile': [
    {
      question: 'How do I change my password?',
      answer: "Go to Profile → Security to change your password. You'll need to know your current password.",
    },
    {
      question: 'How do I update my email?',
      answer: 'Email changes require verification. Go to your Profile settings and follow the email update flow.',
    },
    {
      question: 'What is KYC verification?',
      answer: 'KYC (Know Your Customer) is required for withdrawals over a certain amount. Upload your ID in the KYC section of your profile.',
    },
  ],
  '/profile/kyc': [
    {
      question: 'What documents do I need for KYC?',
      answer: "A government-issued photo ID (passport, driver's license, or national ID) and proof of address (utility bill or bank statement).",
    },
    {
      question: 'How long does KYC take?',
      answer: "Most KYC reviews are completed within 24–48 hours. You'll receive a notification once approved.",
    },
    {
      question: 'My KYC was rejected, what do I do?',
      answer: 'Check the rejection reason sent to your email, resubmit clearer documents, or contact our support team.',
    },
  ],
  '/support': [
    {
      question: "What's the fastest way to get help?",
      answer: 'Use the live chat or submit a support ticket here. We typically respond within a few hours.',
    },
    {
      question: 'What are support hours?',
      answer: 'Our support team is available 24/7 for urgent issues. General inquiries are handled Monday–Friday, 9am–6pm.',
    },
  ],
  '/promotions': [
    {
      question: 'How do I claim a promotion?',
      answer: 'Some promos are automatically applied; others need a promo code entered at checkout. Read the promotion details carefully.',
    },
    {
      question: 'Can I use multiple promos at once?',
      answer: 'Generally, only one promotion can be active per transaction. Check the terms of each offer.',
    },
    {
      question: 'Do promos expire?',
      answer: 'Yes, all promotions have expiry dates shown on the promotion card. Use them before they expire!',
    },
  ],
  '/faq': [
    {
      question: "Can't find your answer here?",
      answer: 'You can submit a support ticket or contact us directly via the Contact page for more specific questions.',
    },
  ],
}

const DEFAULT_FAQS: FAQ[] = [
  {
    question: 'How do I contact support?',
    answer: 'You can reach us via the Support page, or email us directly. Our team typically responds within a few hours.',
  },
  {
    question: 'Is my account secure?',
    answer: 'Yes! We use industry-standard encryption and two-factor authentication to keep your account safe.',
  },
  {
    question: 'How do withdrawals work?',
    answer: 'Withdrawals are processed to your linked payment method within 1–3 business days.',
  },
  {
    question: 'What currencies do you support?',
    answer: 'We support multiple currencies. Your local currency will be shown during registration and checkout.',
  },
]

function pageTitleFor(path: string): string {
  const map: Record<string, string> = {
    '/': 'Home',
    '/games': 'Games',
    '/games/saturday-lotto': 'Saturday Lotto',
    '/games/megadraw': 'Megadraw',
    '/games/powerball': 'Powerball',
    '/games/weekday-windfall': 'Weekday Windfall',
    '/games/set-for-life': 'Set for Life',
    '/games/super66': 'Super66',
    '/games/lucky-lotteries-mega-jackpot': 'Lucky Lotteries Mega Jackpot',
    '/games/lucky-lotteries-super-jackpot': 'Lucky Lotteries Super Jackpot',
    '/games/lotto-strike': 'Lotto Strike',
    '/jackpots': 'Jackpots',
    '/results': 'Results',
    '/promotions': 'Promotions',
    '/wallet': 'Wallet',
    '/wallet/deposit': 'Deposit',
    '/wallet/withdraw': 'Withdrawal',
    '/tickets': 'My Tickets',
    '/profile': 'Profile',
    '/profile/kyc': 'KYC Verification',
    '/support': 'Support',
    '/faq': 'FAQ',
  }
  return map[path] ?? 'Help'
}

function getPageFAQs(pathname: string): { title: string; faqs: FAQ[] } {
  if (PAGE_FAQS[pathname]) {
    return { title: pageTitleFor(pathname), faqs: PAGE_FAQS[pathname] }
  }
  for (const key of Object.keys(PAGE_FAQS)) {
    if (key !== '/' && pathname.startsWith(key)) {
      return { title: pageTitleFor(key), faqs: PAGE_FAQS[key] }
    }
  }
  return { title: 'General Help', faqs: DEFAULT_FAQS }
}

// ── Component ─────────────────────────────────────────────────────────────────
type View = 'closed' | 'menu' | 'answer'

export default function FloatingSupport() {
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('closed')
  const [activeFaq, setActiveFaq] = useState<FAQ | null>(null)
  const [pulse, setPulse] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { title, faqs } = getPageFAQs(location.pathname)

  // Pulse animation every 30 seconds to attract attention
  useEffect(() => {
    const interval = setInterval(() => {
      if (view === 'closed') {
        setPulse(true)
        setTimeout(() => setPulse(false), 1000)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [view])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setView('closed')
        setActiveFaq(null)
      }
    }
    if (view !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [view])

  // Close when navigating to a new page
  useEffect(() => {
    setView('closed')
    setActiveFaq(null)
  }, [location.pathname])

  const toggleMenu = () => {
    if (view === 'closed') {
      setView('menu')
    } else {
      setView('closed')
      setActiveFaq(null)
    }
  }

  const openAnswer = (faq: FAQ) => {
    setActiveFaq(faq)
    setView('answer')
  }

  const goToSupport = () => {
    navigate('/support')
    setView('closed')
    setActiveFaq(null)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      {view !== 'closed' && (
        <div
          style={{
            width: '340px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            background: 'var(--color-surface, #1e2435)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'fs-slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1a6b6b 0%, #0d4a5a 100%)',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {view === 'answer' && (
              <button
                onClick={() => setView('menu')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <HelpCircle size={20} color="#fff" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
                Support
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                {view === 'answer' ? 'Answer' : `${title} Help`}
              </div>
            </div>
            <button
              onClick={() => { setView('closed'); setActiveFaq(null) }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '12px', maxHeight: '380px', overflowY: 'auto' }}>
            {view === 'menu' && (
              <>
                <p style={{ color: 'var(--color-text-muted, #8892a4)', fontSize: '12px', margin: '4px 0 12px', paddingLeft: '2px' }}>
                  Common questions about this page:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {faqs.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => openAnswer(faq)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'var(--color-surface-alt, rgba(255,255,255,0.04))',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        color: 'var(--color-text, #e2e8f0)',
                        fontSize: '13px',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(26,107,107,0.2)'
                        el.style.borderColor = 'rgba(26,107,107,0.5)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget
                        el.style.background = 'var(--color-surface-alt, rgba(255,255,255,0.04))'
                        el.style.borderColor = 'rgba(255,255,255,0.06)'
                      }}
                    >
                      <span style={{ flex: 1 }}>{faq.question}</span>
                      <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '12px 0 10px' }} />

                <button
                  onClick={goToSupport}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #1a6b6b 0%, #0d4a5a 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <MessageCircle size={15} />
                  Open Support Ticket
                  <Send size={13} />
                </button>
              </>
            )}

            {view === 'answer' && activeFaq && (
              <div>
                <div
                  style={{
                    background: 'rgba(26,107,107,0.15)',
                    border: '1px solid rgba(26,107,107,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <p style={{ color: 'var(--color-text, #e2e8f0)', fontWeight: 600, fontSize: '13px', margin: '0 0 8px' }}>
                    {activeFaq.question}
                  </p>
                  <p style={{ color: 'var(--color-text-muted, #8892a4)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
                    {activeFaq.answer}
                  </p>
                </div>

                <p style={{ color: 'var(--color-text-muted, #8892a4)', fontSize: '12px', textAlign: 'center', margin: '0 0 10px' }}>
                  Still need help?
                </p>
                <button
                  onClick={goToSupport}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #1a6b6b 0%, #0d4a5a 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={15} />
                  Contact Support
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Trigger Button ─────────────────────────────────────────────────── */}
      <button
        onClick={toggleMenu}
        aria-label="Open support"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: view !== 'closed'
            ? 'linear-gradient(135deg, #0d4a5a 0%, #1a6b6b 100%)'
            : 'linear-gradient(135deg, #1a6b6b 0%, #0d4a5a 100%)',
          border: 'none',
          borderRadius: '50px',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(26,107,107,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          animation: pulse ? 'fs-pulse 0.8s ease' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,107,107,0.55)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,107,107,0.45)'
        }}
      >
        {view !== 'closed' ? <X size={18} /> : <HelpCircle size={18} />}
        <span>{view !== 'closed' ? 'Close' : 'Support'}</span>
      </button>

      {/* ── Keyframe Styles ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fs-slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fs-pulse {
          0%   { box-shadow: 0 8px 24px rgba(26,107,107,0.45); }
          50%  { box-shadow: 0 8px 40px rgba(26,107,107,0.8); transform: scale(1.04); }
          100% { box-shadow: 0 8px 24px rgba(26,107,107,0.45); }
        }
      `}</style>
    </div>
  )
}
