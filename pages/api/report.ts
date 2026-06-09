import type { NextApiRequest, NextApiResponse } from 'next'
import { extractToken } from '@/lib/auth'
import type { ScanResults } from '@/lib/scanner'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional auth — logged-in users get branded reports
  const user = extractToken(req)
  const { results }: { results: ScanResults } = req.body

  if (!results) {
    return res.status(400).json({ error: 'Scan results are required' })
  }

  // Return the data; PDF generation happens client-side with jsPDF
  // This endpoint validates the data and could add server-side formatting
  return res.status(200).json({
    reportData: results,
    generatedBy: user?.email || 'Anonymous',
    generatedAt: new Date().toISOString(),
  })
}
