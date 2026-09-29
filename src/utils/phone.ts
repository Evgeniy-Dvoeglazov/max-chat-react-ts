export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  return `+${digits}`;
}
