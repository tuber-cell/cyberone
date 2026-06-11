import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always return JSON
  res.setHeader('Content-Type', 'application/json')
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get target from request body
  const { target } = req.body
  
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target domain or IP is required' })
  }

  // Clean the target
  const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0]
  
  // Mock data that matches what ScanResults component expects
  const mockResults = {
    target: cleanTarget,
    timestamp: new Date().toISOString(),
    subdomains: {
      found: [`www.${cleanTarget}`, `mail.${cleanTarget}`, `api.${cleanTarget}`],
      total: 3,
    },
    ports: {
      ports: [
        { port: 22, protocol: 'tcp', service: 'SSH', state: 'open' },
        { port: 80, protocol: 'tcp', service: 'HTTP', state: 'open' },
        { port: 443, protocol: 'tcp', service: 'HTTPS', state: 'open' },
      ],
      ip: '192.168.1.1',
    },
    ssl: {
      grade: 'A',
      host: cleanTarget,
      hasWarnings: false,
      protocol: 'TLS 1.3',
      keyStrength: 256,
      validTo: '2027-01-01',
      issuer: "Let's Encrypt",
    },
    breaches: {
      breached: false,
      breaches: [],
    },
    whois: {
      registrar: 'GoDaddy',
      createdDate: '2020-01-01',
      expiresDate: '2025-01-01',
      nameServers: ['ns1.example.com', 'ns2.example.com'],
    },
    dns: {
      a: ['192.168.1.1'],
      mx: ['mail.example.com'],
      ns: ['ns1.example.com', 'ns2.example.com'],
    },
    technologies: {
      technologies: [
        { name: 'nginx', category: 'Web Servers' },
        { name: 'React', category: 'JavaScript Frameworks' },
      ],
    },
  }

  // Send response with 'results' wrapper
  return res.status(200).json({ results: mockResults })
}