export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateLabel(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}
