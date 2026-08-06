/**
 * Generador automático de SKU Interno Obligatorio en formato:
 * [CATEGORIA]-[PRODUCTO]-[VARIANTE]-[SECUENCIA]
 * Ejemplo: ROPA-SUD-NEG-M-0001
 */
export function generateAutoSku(category: string, productName: string, variantName: string, sequenceNumber: number = 1): string {
  const sanitize = (text: string) => 
    text
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
      .replace(/[^A-Z0-9]/g, "") // mantener solo letras y números
      .trim();

  const catCode = sanitize(category).slice(0, 4) || 'ROPA';
  const prodCode = sanitize(productName).slice(0, 4) || 'PROD';
  const varCode = sanitize(variantName).slice(0, 4) || 'VAR';
  const seqStr = sequenceNumber.toString().padStart(4, '0');

  return `${catCode}-${prodCode}-${varCode}-${seqStr}`;
}
