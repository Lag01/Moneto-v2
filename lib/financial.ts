import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formate une date
 */
export function formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

/**
 * Calcule le total d'un tableau de montants
 */
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Calcule le pourcentage d'un montant par rapport à un total
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0;
  return (amount / total) * 100;
}

/**
 * Arrondit un nombre à 2 décimales
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule la moyenne d'un tableau de nombres
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return calculateTotal(numbers) / numbers.length;
}

/**
 * Récupère le début et la fin du mois actuel
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const start = dayjs().startOf('month').toDate();
  const end = dayjs().endOf('month').toDate();
  return { start, end };
}

/**
 * Récupère le début et la fin d'une période (mois, semaine, année)
 */
export function getDateRange(period: 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const start = dayjs().startOf(period).toDate();
  const end = dayjs().endOf(period).toDate();
  return { start, end };
}

/**
 * Calcule le solde actuel (revenus - dépenses)
 */
export function calculateBalance(income: number, expenses: number): number {
  return roundToTwo(income - expenses);
}

/**
 * Détermine si une date est dans le mois actuel
 */
export function isCurrentMonth(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs(), 'month');
}

/**
 * Récupère le nom du mois
 */
export function getMonthName(date: Date | string): string {
  return dayjs(date).format('MMMM YYYY');
}
