/**
 * Utilitário de Formatação de Data em Português do Brasil com Dia da Semana e DD/MM/AAAA.
 */

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

/**
 * Converte data ISO (YYYY-MM-DD) para formato legível no Brasil com dia da semana.
 * Exemplo: "2026-07-29" -> "Quarta-feira, 29/07/2026"
 * @param {string|Date} dateInput 
 * @returns {string} Data formatada em PT-BR
 */
export function formatPtBrDateWithWeekday(dateInput) {
  if (!dateInput) return 'Data não especificada';

  let year, month, day, dateObj;

  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('T')[0].split('-').map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = new Date(dateInput);
    year = dateObj.getFullYear();
    month = dateObj.getMonth() + 1;
    day = dateObj.getDate();
  }

  const weekdayName = WEEKDAYS[dateObj.getDay()];
  const formattedDay = String(day).padStart(2, '0');
  const formattedMonth = String(month).padStart(2, '0');

  return `${weekdayName}, ${formattedDay}/${formattedMonth}/${year}`;
}
