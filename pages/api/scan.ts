// pages/api/scan.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const { target } = req.body
  
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target domain or IP is required' })
  }

  const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0]
  
  // Mock data structured EXACTLY as ScanResults.tsx expects
  const mockResults = {
    target: cleanTarget,
    timestamp: new Date().toISOString(),
    
    // Subdomains
    subdomains: {
      found: [`www.${cleanTarget}`, `mail.${cleanTarget}`, `api.${cleanTarget}`, `dev.${cleanTarget}`, `blog.${cleanTarget}`],
      total: 5,
    },
    
    // Ports
    ports: {
      ports: [
        { port: 22, protocol: 'tcp', service: 'SSH', state: 'open' },
        { port: 80, protocol: 'tcp', service: 'HTTP', state: 'open' },
        { port: 443, protocol: 'tcp', service: 'HTTPS', state: 'open' },
        { port: 8080, protocol: 'tcp', service: 'HTTP-Alt', state: 'open' },
        { port: 3306, protocol: 'tcp', service: 'MySQL', state: 'open' },
      ],
      ip: '192.168.1.1',
    },
    
    // SSL
    ssl: {
      grade: 'A',
      host: cleanTarget,
      hasWarnings: false,
      protocol: 'TLS 1.3',
      keyStrength: 256,
      validFrom: '2025-01-01',
      validTo: '2027-01-01',
      issuer: "Let's Encrypt",
    },
    
    // Breaches
    breaches: {
      breached: true,
      breaches: [
        { name: 'Example Breach 2020', date: '2020-06-01', dataClasses: ['Email', 'Password'] },
        { name: 'Example Breach 2022', date: '2022-03-15', dataClasses: ['Email', 'Name'] },
      ],
      pasteCount: 0,
    },
    
    // WHOIS
    whois: {
      registrar: 'GoDaddy',
      createdDate: '2020-01-01',
      expiresDate: '2025-01-01',
      updatedDate: '2023-01-01',
      nameServers: ['ns1.example.com', 'ns2.example.com', 'ns3.example.com'],
      registrantOrg: 'Example Organization',
      registrantCountry: 'US',
      status: ['clientTransferProhibited'],
    },
    
    // DNS
    dns: {
      a: ['192.168.1.1', '192.168.1.2'],
      aaaa: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
      mx: ['mail.example.com'],
      ns: ['ns1.example.com', 'ns2.example.com'],
      txt: ['v=spf1 include:_spf.example.com ~all'],
      cname: ['www.example.com'],
    },
    
    // Technologies
    technologies: {
      technologies: [
        { name: 'nginx', category: 'Web Servers', version: '1.18.0' },
        { name: 'React', category: 'JavaScript Frameworks', version: '18.2.0' },
        { name: 'Node.js', category: 'Programming Languages', version: '20.x' },
        { name: 'Cloudflare', category: 'CDN' },
      ],
    },
  }

  return res.status(200).json(mockResults)
}