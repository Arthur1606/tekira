/**
 * Generador automático de SKU Obligatorio en formato:
 * [CATEGORIA]-[PRODUCTO]-[VARIANTE]
 * Ejemplo: ROPA-SUD-NEG-M
 */
export function generateAutoSku(category: string, productName: string, variantName: string): string {
  const sanitize = (text: string) => 
    text
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
      .replace(/[^A-Z0-9]/g, "") // mantener solo letras y números
      .trim();

  const catCode = sanitize(category).slice(0, 3) || 'GEN';
  const prodCode = sanitize(productName).slice(0, 3) || 'PRD';
  const varCode = sanitize(variantName).slice(0, 4) || 'VAR';

  const randomNum = Math.floor(100 + Math.random() * 900); // 3 dígitos aleatorios para evitar colisión

  return `${catCode}-${prodCode}-${varCode}-${randomNum}`;
}
