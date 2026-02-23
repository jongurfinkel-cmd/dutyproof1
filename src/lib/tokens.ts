import crypto from 'crypto'

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex') // 64-char hex string
}
