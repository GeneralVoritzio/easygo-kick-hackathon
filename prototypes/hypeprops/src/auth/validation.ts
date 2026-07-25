/** Pure validation for the mock signup flow. Every function returns an
 * inline-error string, or null when the value passes. */

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_MIN_LENGTH = 8

export function validateUsername(name: string, takenNames: Iterable<string>): string | null {
  if (!name.trim()) return 'Username is required'
  if (!USERNAME_RE.test(name)) {
    return 'Usernames are 3–20 characters, start with a letter, and use only letters, numbers and underscores'
  }
  const lower = name.toLowerCase()
  for (const taken of takenNames) {
    if (taken.toLowerCase() === lower) return 'That username is already taken'
  }
  return null
}

export function validateEmail(email: string, takenEmails: Iterable<string>): string | null {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address'
  const lower = email.toLowerCase()
  for (const taken of takenEmails) {
    if (taken.toLowerCase() === lower) return 'An account with this email already exists'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Passwords need at least ${PASSWORD_MIN_LENGTH} characters`
  return null
}

/** Kick gates accounts at 13+ (T&Cs) — mirror that in the mock birthday step. */
export function validateBirthday(birthday: string, today = new Date()): string | null {
  if (!birthday) return 'Birthday is required'
  const date = new Date(`${birthday}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Enter a valid date'
  if (date > today) return 'Enter a valid date'
  const thirteenth = new Date(date)
  thirteenth.setUTCFullYear(thirteenth.getUTCFullYear() + 13)
  if (thirteenth > today) return 'You must be at least 13 to sign up'
  return null
}
