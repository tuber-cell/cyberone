import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import AuthModal from '@/components/AuthModal'
import ScanResultsView from '@/components/ScanResults'
import ScanHistory from '@/components/ScanHistory'
import { generatePDFReport } from '@/lib/pdfGenerator'
import type { ScanResults } from '@/lib/scanner'

interface User {
  id: string
  email: string
}

const SCAN_STEPS = [
  { label: 'Resolving target', pct: 10 },
  { label: 'Querying subdomains', pct: 25 },
  { label: 'Scanning open ports', pct: 40 },
  { label: 'Analyzing SSL certificate', pct: 55 },
  { label: 'Checking breach databases', pct: 68 },
  { label: 'Fetching WHOIS data', pct: 78 },
  { label: 'Detecting technologies', pct: 88 },
  { label: 'Resolving DNS records', pct: 95 },
  { label: 'Compiling results', pct: 100 },
]

export default function Home() {
  const [target, setTarget] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [results, setResults] = useState<ScanResults | null>(null)
  const [error, setError] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cyberone_token')
    const savedUser = localStorage.getItem('cyberone_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {}
    }
  }, [])

  function handleAuth(newToken: string, newUser: User) {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('cyberone_token', newToken)
    localStorage.setItem('cyberone_user', JSON.stringify(newUser))
    setShowAuth(false)
  }

  function handleLogout() {
    setToken('')
    setUser(null)
    setShowHistory(false)
    localStorage.removeItem('cyberone_token')
    localStorage.removeItem('cyberone_user')
  }

  function animateProgress() {
    let stepIdx = 0
    progressInterval.current = setInterval(() => {
      if (stepIdx < SCAN_STEPS.length) {
        const step = SCAN_STEPS[stepIdx]
        setProgress(step.pct)
        setProgressLabel(step.label)
        stepIdx++
      }
    }, 800)
  }

  async function handleScan() {
    if (!target.trim()) {
      inputRef.current?.focus()
      return
    }
    setScanning(true)
    setResults(null)
    setError('')
    setRateLimitInfo('')
    setProgress(0)
    setProgressLabel('Initializing scan...')

    animateProgress()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target: target.trim() }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setError(data.message || 'Rate limit exceeded')
        setRateLimitInfo(`Resets at: ${new Date(data.resetAt).toLocaleTimeString()}`)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed')
      }

      setProgress(100)
      setProgressLabel('Complete!')
      await new Promise(r => setTimeout(r, 400))
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current)
      setScanning(false)
    }
  }

  async function handleDownloadPDF() {
    if (!results) return
    try {
      await generatePDFReport(results, user?.email)
    } catch (err) {
      console.error('PDF error:', err)
    }
  }

  return (
    <>
      <Head>
        <title>CyberOne — Security Intelligence Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-cyber-bg bg-grid bg-grid text-cyber-text">
        {/* Animated background glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyber-accent/5 blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-cyber-purple/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyber-green/3 blur-3xl" />
        </div>

        {/* ── NAV ── */}
        <nav className="relative z-10 border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 border-2 border-cyber-accent rounded-sm rotate-45 scale-75" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyber-accent rounded-full" />
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-white tracking-wide">CYBER</span>
                <span className="font-display font-bold text-cyber-accent tracking-wide">ONE</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-cyber-border mx-2" />
              <span className="hidden sm:block font-mono text-xs text-cyber-muted tracking-widest">
                SECURITY INTELLIGENCE
              </span>
            </div>

            {/* Nav right */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`font-mono text-xs tracking-wider px-3 py-1.5 rounded border transition-all
                      ${showHistory
                        ? 'bg-cyber-purple/20 border-cyber-purple/50 text-cyber-purple'
                        : 'border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-border/80'
                      }`}
                  >
                    HISTORY
                  </button>
                  <div className="h-4 w-px bg-cyber-border" />
                  <span className="font-mono text-xs text-cyber-muted hidden sm:block truncate max-w-36">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="font-mono text-xs text-cyber-muted hover:text-cyber-red transition-colors"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="font-mono text-xs tracking-wider px-4 py-1.5 bg-cyber-accent/10 hover:bg-cyber-accent/20 border border-cyber-accent/40 hover:border-cyber-accent text-cyber-accent rounded transition-all"
                >
                  SIGN IN
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-6">
            {/* History sidebar */}
            {showHistory && user && (
              <div className="w-64 shrink-0 animate-fade-up">
                <ScanHistory
                  token={token}
                  onSelectScan={(r) => setResults(r as ScanResults)}
                />
              </div>
            )}

            {/* Main column */}
            <div className="flex-1 min-w-0">

              {/* Hero */}
              {!results && !scanning && (
                <div className="text-center mb-12 animate-fade-up">
                  {/* Radar animation */}
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border border-cyber-accent/20" />
                    <div className="absolute inset-2 rounded-full border border-cyber-accent/15" />
                    <div className="absolute inset-4 rounded-full border border-cyber-accent/10" />
                    <div
                      className="absolute inset-0 rounded-full overflow-hidden"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.3) 45deg, transparent 90deg)',
                        animation: 'radarSweep 3s linear infinite',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-cyber-accent rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
                    </div>
                  </div>

                  <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-3">
                    Security Intelligence
                    <br />
                    <span className="text-cyber-accent text-glow-accent">at Your Fingertips</span>
                  </h1>
                  <p className="font-body text-cyber-muted text-lg max-w-xl mx-auto">
                    Enter any domain or IP address to instantly scan for open ports, subdomains,
                    SSL vulnerabilities, data breaches, and more.
                  </p>
                </div>
              )}

              {/* ── SCAN INPUT ── */}
              <div className="mb-6">
                <div className="cyber-panel p-1 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="flex gap-1">
                    {/* Terminal prefix */}
                    <div className="flex items-center px-4 border-r border-cyber-border shrink-0">
                      <span className="font-mono text-cyber-accent text-sm">$</span>
                    </div>
                    {/* Input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !scanning && handleScan()}
                      placeholder="example.com or 192.168.1.1"
                      disabled={scanning}
                      className="flex-1 bg-transparent px-4 py-4 font-mono text-sm text-cyber-text placeholder-cyber-muted focus:outline-none disabled:opacity-50"
                    />
                    {/* Scan button */}
                    <button
                      onClick={handleScan}
                      disabled={scanning || !target.trim()}
                      className={`shrink-0 px-8 py-4 font-mono text-sm font-semibold tracking-widest rounded-sm transition-all
                        ${scanning || !target.trim()
                          ? 'bg-cyber-border text-cyber-muted cursor-not-allowed'
                          : 'bg-cyber-accent text-cyber-bg hover:bg-cyber-accent/90 glow-accent cursor-pointer'
                        }`}
                    >
                      {scanning ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                            style={{ animation: 'radarSweep 0.6s linear infinite' }}
                          />
                          SCANNING
                        </span>
                      ) : 'SCAN NOW'}
                    </button>
                  </div>
                </div>

                {/* Rate limit info */}
                {!user && !scanning && !results && (
                  <div className="mt-2 text-center font-mono text-xs text-cyber-muted">
                    Anonymous: 1 scan/day •{' '}
                    <button onClick={() => setShowAuth(true)} className="text-cyber-accent hover:underline">
                      Sign in
                    </button>{' '}
                    for 3 scans/day
                  </div>
                )}
              </div>

              {/* ── PROGRESS BAR ── */}
              {scanning && (
                <div className="cyber-panel p-5 mb-6 animate-fade-up">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-cyber-muted tracking-wider">{progressLabel}</span>
                    <span className="font-mono text-xs text-cyber-accent">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-cyber-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyber-accent rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${progress}%`,
                        boxShadow: '0 0 10px rgba(0,212,255,0.5)',
                      }}
                    />
                  </div>
                  {/* Scanning animation */}
                  <div className="mt-4 font-mono text-xs text-cyber-muted space-y-1">
                    {SCAN_STEPS.filter(s => s.pct <= progress).slice(-3).map((s, i, arr) => (
                      <div
                        key={s.label}
                        className={`flex items-center gap-2 transition-all ${
                          i === arr.length - 1 ? 'text-cyber-accent' : 'text-cyber-muted/60'
                        }`}
                      >
                        <span>{i === arr.length - 1 ? '▶' : '✓'}</span>
                        <span>{s.label}</span>
                        {i === arr.length - 1 && (
                          <span className="animate-blink">_</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ERROR ── */}
              {error && (
                <div className="cyber-panel p-5 mb-6 border-cyber-red/30 bg-red-500/5 animate-fade-up">
                  <div className="flex items-start gap-3">
                    <span className="text-cyber-red text-xl shrink-0">⚠</span>
                    <div>
                      <div className="font-mono text-sm text-cyber-red font-semibold mb-1">{error}</div>
                      {rateLimitInfo && (
                        <div className="font-mono text-xs text-cyber-muted">{rateLimitInfo}</div>
                      )}
                      {error.includes('Rate limit') && !user && (
                        <button
                          onClick={() => setShowAuth(true)}
                          className="mt-2 font-mono text-xs text-cyber-accent hover:underline"
                        >
                          Sign in for more scans →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── RESULTS ── */}
              {results && !scanning && (
                <div className="animate-fade-up">
                  <ScanResultsView results={results} onDownloadPDF={handleDownloadPDF} />
                </div>
              )}

              {/* ── FEATURES (empty state) ── */}
              {!results && !scanning && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8" style={{ animationDelay: '0.2s' }}>
                  {[
                    { icon: '🔍', label: 'Subdomains', desc: 'SecurityTrails API' },
                    { icon: '🔌', label: 'Open Ports', desc: 'Shodan API' },
                    { icon: '🔒', label: 'SSL Grade', desc: 'SSL Labs API' },
                    { icon: '💀', label: 'Breaches', desc: 'HaveIBeenPwned' },
                    { icon: '📋', label: 'WHOIS', desc: 'WHOIS XML API' },
                    { icon: '🌐', label: 'DNS Records', desc: 'Google DNS' },
                    { icon: '⚙️', label: 'Technologies', desc: 'Wappalyzer API' },
                    { icon: '📊', label: 'PDF Reports', desc: 'Instant export' },
                  ].map((f) => (
                    <div key={f.label} className="cyber-panel p-4 text-center hover:border-cyber-accent/30 transition-colors">
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <div className="font-mono text-xs text-cyber-text font-semibold mb-0.5">{f.label}</div>
                      <div className="font-mono text-xs text-cyber-muted">{f.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 mt-16 border-t border-cyber-border py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-mono text-xs text-cyber-muted">
              © {new Date().getFullYear()} CyberOne • Security Intelligence Platform
            </div>
            <div className="font-mono text-xs text-cyber-muted">
              Use responsibly • Only scan targets you own or have permission to test
            </div>
          </div>
        </footer>
      </div>

      {/* ── AUTH MODAL ── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={handleAuth}
        />
      )}
    </>
  )
}
