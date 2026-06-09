import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, email, password } = req.body

  if (!email || !password || !action) {
    return res.status(400).json({ error: 'Email, password, and action are required' })
  }

  if (!email.includes('@') || password.length < 8) {
    return res.status(400).json({ error: 'Invalid email or password too short (min 8 chars)' })
  }

  const db = createServiceClient()

  // ── Signup ────────────────────────────────────────────────
  if (action === 'signup') {
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const { data: newUser, error } = await db
      .from('users')
      .insert({ email: email.toLowerCase(), password_hash: passwordHash })
      .select('id, email, created_at')
      .single()

    if (error || !newUser) {
      console.error('Signup error:', error)
      return res.status(500).json({ error: 'Failed to create account' })
    }

    const token = signToken({ userId: newUser.id, email: newUser.email })
    return res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, createdAt: newUser.created_at },
    })
  }

  // ── Login ─────────────────────────────────────────────────
  if (action === 'login') {
    const { data: user, error } = await db
      .from('users')
      .select('id, email, password_hash, created_at')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken({ userId: user.id, email: user.email })
    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    })
  }

  return res.status(400).json({ error: 'Invalid action. Use "login" or "signup"' })
}
