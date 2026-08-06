export interface HelpStep {
  title: string;
  description: string;
}

export interface HelpModule {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: HelpStep[];
  quickLinks?: { label: string; href: string }[];
}

export const HELP_CONTENT: Record<string, HelpModule> = {
  dashboard: {
    id: 'dashboard',
    title: 'Centro de Comando & Caja Operativa',
    category: 'General',
    description: 'Aprende a gestionar la apertura de jornada, monitorear métricas clave y cerrar la caja.',
    steps: [
      {
        title: 'Apertura de Caja',
        description: 'Ingresa el monto de efectivo con el que abres la jornada antes de registrar la primera venta.'
      },
      {
        title: 'Registro de Movimientos',
        description: 'Usa el botón "+ Nuevo Movimiento" para ingresar ventas u otros flujos de dinero en tiempo real.'
      },
      {
        title: 'Cierre de Caja Operativa',
        description: 'Al finalizar el día, digita el efectivo contado. TEKIRA calculará automáticamente si existe sobrante o faltante.'
      }
    ],
    quickLinks: [
      { label: 'Registrar Movimiento', href: '/transactions/new' },
      { label: 'Ir a Configuraciones', href: '/settings' }
    ]
  },

  inventory: {
    id: 'inventory',
    title: 'Gestión de Inventario, SKU & Bodegas',
    category: 'Inventarios',
    description: 'Controla el catálogo de artículos, transferencias entre tiendas y bodegas de almacenamiento.',
    steps: [
      {
        title: 'Generador Inteligente de SKU',
        description: 'Cada producto y variante recibe un SKU único e inmutable (ej. SUDR-0001) generado automáticamente.'
      },
      {
        title: 'Ubicaciones Físicas',
        description: 'Puedes crear múltiples bodegas o tiendas secundarias para mantener inventarios independientes.'
      },
      {
        title: 'Transferencias de Mercancía',
        description: 'Mueve existencias desde tu Bodega Principal hacia tu Tienda de Venta con trazabilidad de movimientos.'
      }
    ],
    quickLinks: [
      { label: '+ Crear Producto', href: '/inventory/new' }
    ]
  },

  purchases: {
    id: 'purchases',
    title: 'Compras & Abastecimiento',
    category: 'Compras',
    description: 'Registra las facturas de proveedores e incrementa automáticamente el saldo en bodega.',
    steps: [
      {
        title: 'Registro de Facturas',
        description: 'Ingresa la compra indicando el proveedor, medio de pago y variante de producto abastecida.'
      },
      {
        title: 'Costo Promedio',
        description: 'TEKIRA actualiza el costo de adquisición de tus productos para calcular el margen real de ganancia.'
      }
    ],
    quickLinks: [
      { label: '+ Nueva Compra', href: '/dashboard/purchases/new' },
      { label: 'Ver Proveedores', href: '/dashboard/suppliers' }
    ]
  },

  suppliers: {
    id: 'suppliers',
    title: 'Directorio de Proveedores',
    category: 'Compras',
    description: 'Organiza la red de contactos comerciales y mayoristas de tu comercio.',
    steps: [
      {
        title: 'Crear Proveedor',
        description: 'Guarda nombre comercial, categoría, teléfono de contacto y correo institucional de tus proveedores.'
      }
    ],
    quickLinks: [
      { label: '+ Nuevo Proveedor', href: '/dashboard/suppliers/new' }
    ]
  },

  sales: {
    id: 'sales',
    title: 'Rendimiento de Ventas & Empleados',
    category: 'Ventas',
    description: 'Consulta las ventas individuales registradas por cada colaborador en el sistema.',
    steps: [
      {
        title: 'Control por Código de Empleado',
        description: 'Cada venta queda asociada al código del trabajador (ej. TKR-EMP-000001) para evaluar su rendimiento.'
      }
    ],
    quickLinks: [
      { label: '+ Registrar Venta', href: '/transactions/new' }
    ]
  },

  team: {
    id: 'team',
    title: 'Gestión de Equipo & Permisos',
    category: 'Organización',
    description: 'Invita colaboradores y asigna roles con niveles estrictos de seguridad.',
    steps: [
      {
        title: 'Roles de Acceso',
        description: 'Propietarios (acceso total), Administradores (gestión operativa) y Empleados (ventas e inventario).'
      },
      {
        title: 'Código Único de Empleado',
        description: 'Identificador inmutable asignado automáticamente a cada miembro de tu comercio.'
      }
    ],
    quickLinks: [
      { label: 'Administrar Usuarios', href: '/settings?tab=team' }
    ]
  },

  settings: {
    id: 'settings',
    title: 'Configuraciones & Seguridad 2FA',
    category: 'Seguridad',
    description: 'Administra perfil, datos de la empresa, protección 2FA TOTP obligatoria e información legal.',
    steps: [
      {
        title: '2FA Obligatorio',
        description: 'Todos los integrantes deben vincular Google Authenticator o Microsoft Authenticator para operar.'
      },
      {
        title: 'Información Legal v0.12.0',
        description: 'Consulta la Política de Privacidad conforme a la Ley 1581 Habeas Data y Términos de Servicio.'
      }
    ],
    quickLinks: [
      { label: 'Ver Políticas Legales', href: '/settings?tab=legal' }
    ]
  }
};
