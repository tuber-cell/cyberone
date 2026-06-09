import { useState } from 'react'

interface AuthModalProps {
  onClose: () => void
  onAuth: (token: string, user: { id: string; email: string }) => void
}

export default function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email || !password) return setError('All fields required')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authentication failed')
      onAuth(data.token, data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cyber-panel cyber-corner w-full max-w-md mx-4 p-8 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-xs text-cyber-accent tracking-widest mb-1">
              {mode === 'login' ? '// AUTHENTICATE' : '// CREATE_ACCOUNT'}
            </div>
            <h2 className="font-display text-2xl text-white font-bold">
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-cyber-muted hover:text-cyber-text transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="font-mono text-xs text-cyber-muted tracking-wider block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="operator@cyberone.io"
              className="w-full bg-cyber-surface border border-cyber-border rounded px-4 py-3 font-mono text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent transition-colors"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-cyber-muted tracking-wider block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="min 8 characters"
              className="w-full bg-cyber-surface border border-cyber-border rounded px-4 py-3 font-mono text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded font-mono text-xs text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-cyber-accent/10 hover:bg-cyber-accent/20 border border-cyber-accent/50 hover:border-cyber-accent rounded font-mono text-sm text-cyber-accent tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-accent"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span> AUTHENTICATING...
            </span>
          ) : mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
        </button>

        {/* Toggle */}
        <p className="text-center mt-6 font-mono text-xs text-cyber-muted">
          {mode === 'login' ? "No account? " : "Have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-cyber-accent hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Benefits */}
        <div className="mt-6 pt-6 border-t border-cyber-border">
          <p className="font-mono text-xs text-cyber-muted mb-3 tracking-wider">ACCOUNT BENEFITS:</p>
          <ul className="space-y-1 font-mono text-xs text-cyber-muted">
            <li><span className="text-cyber-green">✓</span> 3 scans/day (vs 1 anonymous)</li>
            <li><span className="text-cyber-green">✓</span> Full scan history saved</li>
            <li><span className="text-cyber-green">✓</span> PDF reports with your branding</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
