import type { NextApiRequest, NextApiResponse } from 'next'
import { extractToken } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = extractToken(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('scans')
    .select('id, target, created_at, results_json')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('History fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch scan history' })
  }

  return res.status(200).json({ scans: data || [] })
}
