export function isValidEmail(value: string): boolean {
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return false;
  if (value.indexOf('@', atIndex + 1) !== -1) return false;

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (local.length === 0 || /[\s@]/.test(local)) return false;
  if (domain.length === 0 || /[\s@]/.test(domain)) return false;

  for (let i = 0; i < domain.length; i++) {
    if (domain[i] === '.' && i > 0 && i < domain.length - 1) return true;
  }
  return false;
}

export function isValidPhone(value: string): boolean {
  return /^\d{9}$/.test(value);
}
