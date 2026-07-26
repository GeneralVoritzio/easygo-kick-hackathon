import { describe, expect, it } from 'vitest'
import { validateBirthday, validateEmail, validatePassword, validateUsername } from './validation'

const TODAY = new Date('2026-07-25T00:00:00Z')

describe('validateUsername', () => {
  it('accepts well-formed available names', () => {
    expect(validateUsername('NeonViper', ['HypeKing'])).toBeNull()
    expect(validateUsername('abc', [])).toBeNull()
    expect(validateUsername('a_1_b_2_c_3_d_4_e_5', [])).toBeNull()
  })

  it('rejects malformed names', () => {
    expect(validateUsername('', [])).not.toBeNull()
    expect(validateUsername('ab', [])).not.toBeNull() // too short
    expect(validateUsername('1starts_with_digit', [])).not.toBeNull()
    expect(validateUsername('has space', [])).not.toBeNull()
    expect(validateUsername('has-dash', [])).not.toBeNull()
    expect(validateUsername('x'.repeat(21), [])).not.toBeNull()
  })

  it('rejects taken names case-insensitively', () => {
    expect(validateUsername('hypeking', ['HypeKing'])).toBe('That username is already taken')
    expect(validateUsername('HYPEKING', ['HypeKing'])).not.toBeNull()
  })
})

describe('validateEmail', () => {
  it('accepts valid, unused addresses', () => {
    expect(validateEmail('clip.wizard@gmail.com', ['hypeking.live@gmail.com'])).toBeNull()
  })

  it('rejects malformed or taken addresses', () => {
    expect(validateEmail('', [])).not.toBeNull()
    expect(validateEmail('not-an-email', [])).not.toBeNull()
    expect(validateEmail('a@b', [])).not.toBeNull()
    expect(validateEmail('HYPEKING.LIVE@GMAIL.COM', ['hypeking.live@gmail.com'])).not.toBeNull()
  })
})

describe('validatePassword', () => {
  it('enforces the minimum length only', () => {
    expect(validatePassword('short')).not.toBeNull()
    expect(validatePassword('kickhype2026')).toBeNull()
  })
})

describe('validateBirthday', () => {
  it('accepts anyone 13 or older', () => {
    expect(validateBirthday('2013-07-25', TODAY)).toBeNull()
    expect(validateBirthday('1990-01-01', TODAY)).toBeNull()
  })

  it('rejects under-13, future and malformed dates', () => {
    expect(validateBirthday('2013-07-26', TODAY)).toBe('You must be at least 13 to sign up')
    expect(validateBirthday('2030-01-01', TODAY)).not.toBeNull()
    expect(validateBirthday('', TODAY)).not.toBeNull()
    expect(validateBirthday('not-a-date', TODAY)).not.toBeNull()
  })
})
