import type { ScanResults } from '@/lib/scanner'

interface ScanResultsProps {
  results: ScanResults
  onDownloadPDF: () => void
}

function SectionHeader({ label, count, status }: { label: string; count?: number; status?: 'ok' | 'warn' | 'error' }) {
  const colors = { ok: 'text-cyber-green', warn: 'text-cyber-yellow', error: 'text-cyber-red' }
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-cyber-accent rounded-full" />
        <span className="font-mono text-xs tracking-widest text-cyber-muted">{label}</span>
      </div>
      {count !== undefined && (
        <span className={`font-mono text-xs ${status ? colors[status] : 'text-cyber-text'}`}>
          {count} found
        </span>
      )}
    </div>
  )
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`cyber-panel p-5 ${className}`}>
      {children}
    </div>
  )
}

function SSLGradeBadge({ grade }: { grade: string }) {
  const gradeColors: Record<string, string> = {
    'A+': 'text-cyber-green border-cyber-green/50 bg-cyber-green/10',
    'A': 'text-cyber-green border-cyber-green/50 bg-cyber-green/10',
    'B': 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    'C': 'text-cyber-yellow border-cyber-yellow/50 bg-cyber-yellow/10',
    'D': 'text-orange-400 border-orange-400/50 bg-orange-400/10',
    'F': 'text-cyber-red border-cyber-red/50 bg-cyber-red/10',
    'T': 'text-cyber-red border-cyber-red/50 bg-cyber-red/10',
  }
  const color = gradeColors[grade] || 'text-cyber-muted border-cyber-border bg-cyber-surface'
  return (
    <div className={`inline-flex items-center justify-center w-16 h-16 rounded border-2 font-display font-bold text-2xl ${color}`}>
      {grade}
    </div>
  )
}

export default function ScanResultsView({ results, onDownloadPDF }: ScanResultsProps) {
  const scanDate = new Date(results.timestamp).toLocaleString()

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between py-4 px-5 bg-cyber-surface border border-cyber-border rounded">
        <div>
          <div className="font-mono text-xs text-cyber-muted mb-1">SCAN COMPLETE — {scanDate}</div>
          <div className="font-display font-bold text-xl text-white">{results.target}</div>
        </div>
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-accent/10 hover:bg-cyber-accent/20 border border-cyber-accent/40 hover:border-cyber-accent rounded font-mono text-xs text-cyber-accent tracking-wider transition-all"
        >
          ⬇ PDF REPORT
        </button>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* SSL */}
        <Panel>
          <SectionHeader label="SSL CERTIFICATE" />
          <div className="flex items-center gap-4">
            <SSLGradeBadge grade={results.ssl.grade} />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-cyber-muted mb-1">PROTOCOL</div>
              <div className="font-mono text-sm text-cyber-text">{results.ssl.protocol || 'N/A'}</div>
              {results.ssl.validTo && (
                <>
                  <div className="font-mono text-xs text-cyber-muted mt-2 mb-1">EXPIRES</div>
                  <div className="font-mono text-xs text-cyber-text">{results.ssl.validTo}</div>
                </>
              )}
              {results.ssl.keyStrength > 0 && (
                <>
                  <div className="font-mono text-xs text-cyber-muted mt-2 mb-1">KEY</div>
                  <div className="font-mono text-xs text-cyber-text">{results.ssl.keyStrength}-bit</div>
                </>
              )}
              {results.ssl.error && (
                <div className="font-mono text-xs text-cyber-red mt-1">{results.ssl.error}</div>
              )}
            </div>
          </div>
          {results.ssl.issuer && (
            <div className="mt-3 pt-3 border-t border-cyber-border">
              <div className="font-mono text-xs text-cyber-muted mb-1">ISSUER</div>
              <div className="font-mono text-xs text-cyber-text truncate">{results.ssl.issuer}</div>
            </div>
          )}
        </Panel>

        {/* Breach Status */}
        <Panel>
          <SectionHeader label="BREACH STATUS" />
          <div className={`flex items-center gap-3 mb-4 ${results.ssl.error ? '' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-lg
              ${results.breaches.breached
                ? 'border-cyber-red/50 bg-cyber-red/10 text-cyber-red'
                : 'border-cyber-green/50 bg-cyber-green/10 text-cyber-green'
              }`}>
              {results.breaches.breached ? '!' : '✓'}
            </div>
            <div>
              <div className={`font-mono text-sm font-semibold ${results.breaches.breached ? 'text-cyber-red' : 'text-cyber-green'}`}>
                {results.breaches.breached ? 'BREACHED' : 'CLEAN'}
              </div>
              <div className="font-mono text-xs text-cyber-muted">
                {results.breaches.breaches.length} breach{results.breaches.breaches.length !== 1 ? 'es' : ''} found
              </div>
            </div>
          </div>
          {results.breaches.breaches.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {results.breaches.breaches.slice(0, 5).map((b, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-1.5 px-2 bg-red-500/5 border border-red-500/10 rounded">
                  <span className="font-mono text-xs text-cyber-text">{b.name}</span>
                  <span className="font-mono text-xs text-cyber-muted shrink-0">{b.date}</span>
                </div>
              ))}
            </div>
          )}
          {results.breaches.error && (
            <div className="font-mono text-xs text-cyber-muted">{results.breaches.error}</div>
          )}
        </Panel>

        {/* WHOIS */}
        <Panel>
          <SectionHeader label="WHOIS INFO" />
          <div className="space-y-2">
            {[
              { k: 'Registrar', v: results.whois.registrar },
              { k: 'Created', v: results.whois.createdDate },
              { k: 'Expires', v: results.whois.expiresDate },
              { k: 'Updated', v: results.whois.updatedDate },
              { k: 'Org', v: results.whois.registrantOrg },
              { k: 'Country', v: results.whois.registrantCountry },
            ].filter(({ v }) => v).map(({ k, v }) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs text-cyber-muted w-16 shrink-0">{k}</span>
                <span className="font-mono text-xs text-cyber-text text-right truncate">{v}</span>
              </div>
            ))}
            {results.whois.nameServers && results.whois.nameServers.length > 0 && (
              <div className="pt-2 border-t border-cyber-border">
                <div className="font-mono text-xs text-cyber-muted mb-1.5">Name Servers</div>
                {results.whois.nameServers.map((ns, i) => (
                  <div key={i} className="font-mono text-xs text-cyber-text truncate">{ns}</div>
                ))}
              </div>
            )}
            {results.whois.error && (
              <div className="font-mono text-xs text-cyber-muted">{results.whois.error}</div>
            )}
          </div>
        </Panel>

        {/* Open Ports */}
        <Panel className="md:col-span-1">
          <SectionHeader label="OPEN PORTS" count={results.ports.ports.length} />
          {results.ports.ip && (
            <div className="font-mono text-xs text-cyber-muted mb-3">IP: {results.ports.ip}</div>
          )}
          {results.ports.ports.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.ports.ports.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 px-2 bg-cyber-surface border border-cyber-border/50 rounded">
                  <div className="w-2 h-2 rounded-full bg-cyber-green shrink-0" />
                  <span className="font-mono text-sm text-cyber-accent w-14">{p.port}</span>
                  <span className="font-mono text-xs text-cyber-text flex-1">{p.service}</span>
                  <span className="font-mono text-xs text-cyber-muted">{p.protocol}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-xs text-cyber-muted">
              {results.ports.error || 'No open ports detected'}
            </div>
          )}
        </Panel>

        {/* Subdomains */}
        <Panel className="md:col-span-1">
          <SectionHeader label="SUBDOMAINS" count={results.subdomains.total} />
          {results.subdomains.found.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.subdomains.found.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-2 hover:bg-cyber-surface/50 rounded transition-colors">
                  <span className="font-mono text-xs text-cyber-accent">◆</span>
                  <span className="font-mono text-xs text-cyber-text truncate">{sub}</span>
                </div>
              ))}
              {results.subdomains.total > results.subdomains.found.length && (
                <div className="font-mono text-xs text-cyber-muted pt-1">
                  +{results.subdomains.total - results.subdomains.found.length} more
                </div>
              )}
            </div>
          ) : (
            <div className="font-mono text-xs text-cyber-muted">
              {results.subdomains.error || 'No subdomains found'}
            </div>
          )}
        </Panel>

        {/* Technologies */}
        <Panel>
          <SectionHeader label="TECHNOLOGIES" count={results.technologies.technologies.length} />
          {results.technologies.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {results.technologies.technologies.map((tech, i) => (
                <span
                  key={i}
                  title={tech.category}
                  className="px-2 py-1 bg-cyber-surface border border-cyber-border rounded font-mono text-xs text-cyber-text hover:border-cyber-accent/50 transition-colors cursor-default"
                >
                  {tech.name}
                  {tech.version && <span className="text-cyber-muted ml-1">{tech.version}</span>}
                </span>
              ))}
            </div>
          ) : (
            <div className="font-mono text-xs text-cyber-muted">
              {results.technologies.error || 'No technologies detected'}
            </div>
          )}
        </Panel>

        {/* DNS Records - full width */}
        <Panel className="md:col-span-2 xl:col-span-3">
          <SectionHeader label="DNS RECORDS" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {(['a', 'aaaa', 'mx', 'ns', 'txt', 'cname'] as const).map((type) => {
              const records = results.dns[type] || []
              return (
                <div key={type}>
                  <div className="font-mono text-xs text-cyber-accent tracking-widest mb-2">{type.toUpperCase()}</div>
                  {records.length > 0 ? (
                    <div className="space-y-1">
                      {records.slice(0, 3).map((r, i) => (
                        <div key={i} className="font-mono text-xs text-cyber-text break-all leading-relaxed">{r}</div>
                      ))}
                      {records.length > 3 && (
                        <div className="font-mono text-xs text-cyber-muted">+{records.length - 3} more</div>
                      )}
                    </div>
                  ) : (
                    <div className="font-mono text-xs text-cyber-muted">—</div>
                  )}
                </div>
              )
            })}
          </div>
          {results.dns.error && (
            <div className="mt-3 font-mono text-xs text-cyber-muted">{results.dns.error}</div>
          )}
        </Panel>
      </div>
    </div>
  )
}
