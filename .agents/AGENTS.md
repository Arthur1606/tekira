# Reglas de Arquitectura TEKIRA

1. Toda funcionalidad nueva debe evaluarse primero con una solución sin API externa.
2. Solo integrar servicios pagos cuando:
   - Exista una necesidad real del usuario.
   - El costo esté justificado por ingresos.
   - La función genere más valor que gasto.
3. Priorizar:
   - Código propio.
   - Supabase.
   - PostgreSQL.
   - Lógica interna.
   - Datos históricos.
4. Diseñar puntos de integración futura, pero mantener costos mínimos durante el MVP.
