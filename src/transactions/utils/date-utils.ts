export const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

export const toMonthKey = (date: Date): string =>
  date.toISOString().slice(0, 7);

export const parseIsoDate = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
};
