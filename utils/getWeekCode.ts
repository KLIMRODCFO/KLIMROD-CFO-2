// utils/getWeekCode.ts
/**
 * Calcula el código de semana (W1, W2, ...) basado en la fecha de apertura y la fecha objetivo.
 * @param startDate string (YYYY-MM-DD) - Fecha de apertura/control de la unidad de negocio
 * @param date string (YYYY-MM-DD) - Fecha del evento o consulta
 * @returns string - Código de semana (W1, W2, ...)
 */
export function getWeekCode(startDate: string, date: string): string {
  const start = new Date(startDate);
  const target = new Date(date);
  start.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) throw new Error('La fecha es antes de la apertura');
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return `W${weekNumber}`;
}
