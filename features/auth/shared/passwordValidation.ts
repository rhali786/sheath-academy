export interface PasswordStrength {
  minLength: boolean
  uppercase: boolean
  lowercase: boolean
  digit: boolean
  special: boolean
}

export function checkPasswordStrength(password: string): PasswordStrength {
  return {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordStrong(password: string): boolean {
  const s = checkPasswordStrength(password)
  return s.minLength && s.uppercase && s.lowercase && s.digit && s.special
}
