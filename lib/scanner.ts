import axios from 'axios'
import tls from 'tls'

export interface ScanResults {
  target: string
  timestamp: string
  subdomains: SubdomainResult
  ports: PortResult
  ssl: SSLResult
  breaches: BreachResult
  whois: WhoisResult
  dns: DNSResult
  technologies: TechResult
}

export interface SubdomainResult {
  found: string[]
  total: number
  error?: string
}

export interface PortResult {
  ports: Array<{ port: number; protocol: string; service: string; state: string }>
  ip?: string
  error?: string
}

export interface SSLResult {
  grade: string
  host: string
  hasWarnings: boolean
  protocol: string
  keyStrength: number
  validFrom?: string
  validTo?: string
  issuer?: string
  error?: string
}

export interface BreachResult {
  breached: boolean
  breaches: Array<{ name: string; date: string; dataClasses: string[] }>
  pasteCount?: number
  error?: string
}

export interface WhoisResult {
  registrar?: string
  createdDate?: string
  expiresDate?: string
  updatedDate?: string
  nameServers?: string[]
  registrantOrg?: string
  registrantCountry?: string
  status?: string[]
  error?: string
}

export interface DNSResult {
  a?: string[]
  aaaa?: string[]
  mx?: string[]
  ns?: string[]
  txt?: string[]
  cname?: string[]
  error?: string
}

export interface TechResult {
  technologies: Array<{ name: string; category: string; version?: string; icon?: string }>
  error?: string
}

async function fetchSubdomains(domain: string): Promise<SubdomainResult> {
  try {
    if (!process.env.SECURITYTRAILS_API_KEY) {
      return { found: [], total: 0, error: 'API key not configured' }
    }
    const res = await axios.get(
      `https://api.securitytrails.com/v1/domain/${domain}/subdomains`,
      { headers: { apikey: process.env.SECURITYTRAILS_API_KEY }, timeout: 8000 }
    )
    const subs: string[] = (res.data.subdomains || []).slice(0, 20).map((s: string) => `${s}.${domain}`)
    return { found: subs, total: res.data.subdomain_count || subs.length }
  } catch (err: unknown) {
    return { found: [], total: 0, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function fetchPorts(target: string): Promise<PortResult> {
  try {
    let ip = target
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(target)) {
      const dnsRes = await axios.get(`https://dns.google/resolve?name=${target}&type=A`, { timeout: 4000 })
      ip = dnsRes.data?.Answer?.[0]?.data || target
    }
    const res = await axios.get(`https://internetdb.shodan.io/${ip}`, { timeout: 8000 })
    const ports = (res.data.ports || []).slice(0, 20).map((p: number) => ({
      port: p, protocol: 'tcp', service: getCommonServiceName(p), state: 'open',
    }))
    return { ports, ip }
  } catch (err: unknown) {
    return { ports: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function fetchSSL(domain: string): Promise<SSLResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ grade: 'Timeout', host: domain, hasWarnings: false, protocol: 'TLS', keyStrength: 0, error: 'TLS check timed out' })
    }, 7000)
    try {
      const socket = tls.connect(
        { host: domain, port: 443, servername: domain, rejectUnauthorized: false },
        () => {
          clearTimeout(timer)
          try {
            const cert = socket.getPeerCertificate(true)
            const protocol = socket.getProtocol() || 'TLS'
            const cipher = socket.getCipher()
            socket.destroy()
            if (!cert || !cert.subject) {
              return resolve({ grade: 'N/A', host: domain, hasWarnings: false, protocol, keyStrength: 0 })
            }
            const validTo = cert.valid_to ? new Date(cert.valid_to) : null
            const validFrom = cert.valid_from ? new Date(cert.valid_from) : null
            const now = new Date()
            const daysLeft = validTo ? Math.floor((validTo.getTime() - now.getTime()) / 86400000) : 0
            let grade = 'A'
            const isExpired = validTo && validTo < now
            const expiresSoon = daysLeft < 30
            const isWeakProtocol = protocol === 'TLSv1' || protocol === 'TLSv1.1'
            const keyBits = (cipher?.name?.includes('256') ? 256 : 128)
            if (isExpired) grade = 'F'
            else if (isWeakProtocol) grade = 'C'
            else if (expiresSoon) grade = 'B'
            else if (protocol === 'TLSv1.3') grade = 'A+'
            else grade = 'A'
            const issuerObj = cert.issuer as unknown as Record<string, string>
            resolve({
              grade, host: domain, hasWarnings: expiresSoon || isWeakProtocol,
              protocol, keyStrength: keyBits,
              validFrom: validFrom?.toISOString().split('T')[0],
              validTo: validTo?.toISOString().split('T')[0],
              issuer: String(issuerObj?.O || issuerObj?.CN || ''),
            })
          } catch {
            socket.destroy()
            resolve({ grade: 'Error', host: domain, hasWarnings: false, protocol: 'TLS', keyStrength: 0, error: 'Could not parse certificate' })
          }
        }
      )
      socket.on('error', (err) => {
        clearTimeout(timer)
        resolve({ grade: 'N/A', host: domain, hasWarnings: false, protocol: 'N/A', keyStrength: 0, error: err.message })
      })
    } catch (err: unknown) {
      clearTimeout(timer)
      resolve({ grade: 'Error', host: domain, hasWarnings: false, protocol: 'N/A', keyStrength: 0, error: err instanceof Error ? err.message : 'TLS error' })
    }
  })
}

async function fetchBreaches(target: string): Promise<BreachResult> {
  try {
    if (!process.env.HIBP_API_KEY) {
      return { breached: false, breaches: [], error: 'API key not configured' }
    }
    const res = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(target)}?truncateResponse=false`,
      {
        headers: { 'hibp-api-key': process.env.HIBP_API_KEY, 'user-agent': 'CyberOne-Security-Scanner' },
        timeout: 8000,
        validateStatus: (s) => s === 200 || s === 404,
      }
    )
    if (res.status === 404) return { breached: false, breaches: [] }
    const breaches = (res.data || []).map((b: Record<string, unknown>) => ({
      name: b.Name, date: b.BreachDate, dataClasses: b.DataClasses || [],
    }))
    return { breached: breaches.length > 0, breaches: breaches.slice(0, 10) }
  } catch (err: unknown) {
    return { breached: false, breaches: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function fetchWHOIS(domain: string): Promise<WhoisResult> {
  try {
    if (!process.env.WHOIS_API_KEY) {
      return { error: 'API key not configured' }
    }
    const res = await axios.get(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env.WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`,
      { timeout: 8000 }
    )
    const r = res.data?.WhoisRecord || {}
    return {
      registrar: r.registrarName,
      createdDate: r.createdDate?.split('T')[0],
      expiresDate: r.expiresDate?.split('T')[0],
      updatedDate: r.updatedDate?.split('T')[0],
      nameServers: r.nameServers?.hostNames?.slice(0, 4),
      registrantOrg: r.registrant?.organization,
      registrantCountry: r.registrant?.country,
      status: Array.isArray(r.status) ? r.status : r.status ? [r.status] : [],
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function fetchDNS(domain: string): Promise<DNSResult> {
  try {
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME']
    const results = await Promise.allSettled(
      types.map(type => axios.get(`https://dns.google/resolve?name=${domain}&type=${type}`, { timeout: 5000 }))
    )
    const dns: DNSResult = {}
    types.forEach((type, i) => {
      const r = results[i]
      if (r.status === 'fulfilled') {
        const answers = r.value.data.Answer || []
        const key = type.toLowerCase() as keyof DNSResult
        if (key !== 'error') {
          (dns[key] as string[]) = answers.map((a: { data: string }) => a.data).filter(Boolean)
        }
      }
    })
    return dns
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function fetchTechnologies(domain: string): Promise<TechResult> {
  try {
    if (!process.env.WAPPALYZER_API_KEY) {
      return { technologies: [], error: 'API key not configured' }
    }
    const url = domain.startsWith('http') ? domain : `https://${domain}`
    const res = await axios.get(
      `https://api.wappalyzer.com/v2/lookup/?urls=${encodeURIComponent(url)}`,
      { headers: { 'x-api-key': process.env.WAPPALYZER_API_KEY }, timeout: 8000 }
    )
    const techs = (res.data?.[0]?.technologies || []).map((t: Record<string, unknown>) => ({
      name: t.name,
      category: Array.isArray(t.categories) && (t.categories[0] as { name: string })?.name ? (t.categories[0] as { name: string }).name : 'Other',
      version: t.version || undefined,
    }))
    return { technologies: techs.slice(0, 20) }
  } catch (err: unknown) {
    return { technologies: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

function getCommonServiceName(port: number): string {
  const map: Record<number, string> = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 465: 'SMTPS',
    587: 'SMTP', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
    5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
    27017: 'MongoDB',
  }
  return map[port] || 'Unknown'
}

export async function runScan(target: string): Promise<ScanResults> {
  const cleanTarget = target.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
  const [subdomains, ports, ssl, breaches, whois, dns, technologies] = await Promise.allSettled([
    fetchSubdomains(cleanTarget),
    fetchPorts(cleanTarget),
    fetchSSL(cleanTarget),
    fetchBreaches(cleanTarget),
    fetchWHOIS(cleanTarget),
    fetchDNS(cleanTarget),
    fetchTechnologies(cleanTarget),
  ])
  return {
    target: cleanTarget,
    timestamp: new Date().toISOString(),
    subdomains: subdomains.status === 'fulfilled' ? subdomains.value : { found: [], total: 0, error: 'Scan failed' },
    ports: ports.status === 'fulfilled' ? ports.value : { ports: [], error: 'Scan failed' },
    ssl: ssl.status === 'fulfilled' ? ssl.value : { grade: 'Error', host: cleanTarget, hasWarnings: false, protocol: 'N/A', keyStrength: 0, error: 'Scan failed' },
    breaches: breaches.status === 'fulfilled' ? breaches.value : { breached: false, breaches: [], error: 'Scan failed' },
    whois: whois.status === 'fulfilled' ? whois.value : { error: 'Scan failed' },
    dns: dns.status === 'fulfilled' ? dns.value : { error: 'Scan failed' },
    technologies: technologies.status === 'fulfilled' ? technologies.value : { technologies: [], error: 'Scan failed' },
  }
}