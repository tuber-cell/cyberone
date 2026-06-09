import { useEffect, useState } from 'react'

interface ScanRecord {
  id: string
  target: string
  created_at: string
  results_json: Record<string, unknown>
}

interface HistoryProps {
  token: string
  onSelectScan: (results: ScanRecord['results_json']) => void
}

export default function ScanHistory({ token, onSelectScan }: HistoryProps) {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [token])

  async function fetchHistory() {
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setScans(data.scans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cyber-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-cyber-purple rounded-full" />
        <span className="font-mono text-xs tracking-widest text-cyber-muted">SCAN HISTORY</span>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 shimmer rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="font-mono text-xs text-cyber-red">{error}</div>
      )}

      {!loading && !error && scans.length === 0 && (
        <div className="font-mono text-xs text-cyber-muted text-center py-8">
          No scan history yet.<br />Run your first scan!
        </div>
      )}

      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {scans.map((scan) => (
          <button
            key={scan.id}
            onClick={() => onSelectScan(scan.results_json)}
            className="w-full text-left px-3 py-2.5 bg-cyber-surface hover:bg-cyber-border border border-cyber-border hover:border-cyber-accent/30 rounded transition-all group"
          >
            <div className="font-mono text-xs text-cyber-text group-hover:text-cyber-accent transition-colors truncate">
              {scan.target}
            </div>
            <div className="font-mono text-xs text-cyber-muted mt-0.5">
              {new Date(scan.created_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      {scans.length > 0 && (
        <div className="mt-3 pt-3 border-t border-cyber-border">
          <div className="font-mono text-xs text-cyber-muted text-center">
            {scans.length} scan{scans.length !== 1 ? 's' : ''} saved
          </div>
        </div>
      )}
    </div>
  )
}
