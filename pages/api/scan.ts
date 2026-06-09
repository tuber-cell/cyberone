import type { NextApiRequest, NextApiResponse } from 'next'
import { runScan } from '@/lib/scanner'
import { checkRateLimit } from '@/lib/ratelimit'
import { extractToken } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { target } = req.body
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target domain or IP is required' })
  }

  const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0]
  if (!cleanTarget || cleanTarget.length < 3) {
    return res.status(400).json({ error: 'Invalid target' })
  }

  const user = extractToken(req)
  const identifier = user?.userId || req.headers['x-forwarded-for']?.toString() || 'anonymous'

  const { allowed, remaining, reset } = await checkRateLimit(identifier, !!user)
  if (!allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: user
        ? 'Logged-in users get 3 scans per day.'
        : 'Anonymous users get 1 scan per day. Login for 3 scans/day.',
      resetAt: new Date(reset).toISOString(),
    })
  }

  res.setHeader('X-RateLimit-Remaining', remaining)

  try {
    const results = await runScan(cleanTarget)

    if (user) {
      try {
        const db = createServiceClient()
        await db.from('scans').insert({
          user_id: user.userId,
          target: cleanTarget,
          results_json: results,
        })
      } catch (dbErr) {
        console.error('DB save error:', dbErr)
      }
    }

    return res.status(200).json({ success: true, results })
  } catch (error) {
    console.error('Scan error:', error)
    return res.status(500).json({ error: 'Scan failed', message: String(error) })
  }
}