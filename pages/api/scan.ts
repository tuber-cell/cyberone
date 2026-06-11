// pages/api/scan.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always return JSON, never HTML
  res.setHeader('Content-Type', 'application/json')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const { target } = req.body
  
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target domain or IP is required' })
  }

  // Clean the target
  const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0]
  
  // Return mock data (no API calls, no database)
  const mockResults = {
    target: cleanTarget,
    subdomains: [`www.${cleanTarget}`, `mail.${cleanTarget}`, `api.${cleanTarget}`, `dev.${cleanTarget}`],
    openPorts: [22, 80, 443, 8080, 3306],
    sslGrade: 'A',
    sslIssuer: 'Let\'s Encrypt',
    sslExpiry: '2027-01-01',
    breaches: [
      { name: 'Example Breach 2020', date: '2020-06-01', description: 'Sample breach data' },
      { name: 'Example Breach 2022', date: '2022-03-15', description: 'Another sample' }
    ],
    whois: {
      registrar: 'GoDaddy',
      created: '2020-01-01',
      expires: '2025-01-01',
      nameServers: ['ns1.example.com', 'ns2.example.com']
    },
    technologies: ['nginx/1.18.0', 'React', 'Node.js', 'Cloudflare'],
    dnsRecords: [
      { type: 'A', value: '192.168.1.1', ttl: 3600 },
      { type: 'MX', value: 'mail.example.com', ttl: 3600, priority: 10 },
      { type: 'TXT', value: 'v=spf1 include:_spf.example.com ~all', ttl: 3600 }
    ],
    scanTime: new Date().toISOString()
  }

  return res.status(200).json({ success: true, results: mockResults })
}