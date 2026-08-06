/**
 * Generador Inteligente de SKU Interno TEKIRA
 * Formato Base: XXXX-0000 (4 letras representativas + 4 dígitos)
 * Formato Variante: XXXX-0000-[VARIANTE] (ej. SUDN-0001-M-N)
 */

const STOP_WORDS = new Set(['DE', 'DEL', 'PARA', 'LA', 'EL', 'CON', 'LOS', 'LAS', 'UN', 'UNA', 'Y']);

export function extractRepresentativeLetters(productName: string): string {
  const words = productName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^A-Z0-9\s]/g, "") // Mantener letras, números y espacios
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w));

  if (words.length === 0) return 'PROD';

  if (words.length === 1) {
    const w = words[0];
    return w.padEnd(4, 'X').slice(0, 4);
  }

  if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    return (w1.slice(0, 3) + w2.slice(0, 1)).padEnd(4, 'X').slice(0, 4);
  }

  if (words.length === 3) {
    const w1 = words[0];
    const w2 = words[1];
    const w3 = words[2];
    return (w1.slice(0, 2) + w2.slice(0, 1) + w3.slice(0, 1)).padEnd(4, 'X').slice(0, 4);
  }

  // 4 o más palabras: 1 letra de las primeras 4 palabras
  return (words[0][0] + words[1][0] + words[2][0] + words[3][0]).slice(0, 4);
}

export function generateBaseSkuCode(productName: string, sequenceNumber: number = 1): string {
  const prefix = extractRepresentativeLetters(productName);
  const seqStr = sequenceNumber.toString().padStart(4, '0');
  return `${prefix}-${seqStr}`;
}

export function generateVariantSkuCode(baseSku: string, variantName: string): string {
  const sanitizeVar = variantName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim();

  if (!sanitizeVar || sanitizeVar.includes('PRINCIPAL')) {
    return baseSku;
  }

  const varParts = sanitizeVar.split(/\s+/).map(p => p[0]).join('');
  return `${baseSku}-${varParts.slice(0, 4)}`;
}
