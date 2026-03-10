// form validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// validate whitelisted email format: pluk[namehere]@gmail.com
export function isWhitelistedEmail(email: string): boolean {
  const whitelistRegex = /^pluk[a-zA-Z0-9]+@gmail\.com$/;
  return whitelistRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // 8 character constraint
  return password.length >= 8;
}

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function isValidHours(hours: number): boolean {
  return hours > 0 && hours <= 10000;
}