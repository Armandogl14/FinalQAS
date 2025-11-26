# Inventory Management System - Frontend Architecture

## Estructura de Páginas

```
frontend-nuevo/
├── app/
│   ├── layout.tsx          # Layout principal con Navbar
│   ├── page.tsx            # Página inicio (redirecciona a dashboard)
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard - Resumen y quick actions
│   ├── products/
│   │   └── page.tsx        # Gestión de productos (CRUD)
│   ├── stock-history/
│   │   └── page.tsx        # Historial de movimientos de stock
│   └── stock-management/
│       └── page.tsx        # Gestión de stock (solo admin/employee)
│
├── components/
│   ├── Navbar.tsx                 # Navegación principal
│   ├── ProductTable.tsx           # Tabla de productos
│   ├── ProductModal.tsx           # Modal crear/editar producto
│   ├── StockModal.tsx             # Modal de movimiento de stock
│   ├── StockAlerts.tsx            # Alertas de stock bajo
│   ├── StockHistoryList.tsx       # Lista de movimientos
│   ├── FilterBar.tsx              # Barra de filtros
│   ├── Pagination.tsx             # Paginación
│   └── ui/
│       └── card.tsx               # Componente Card reutilizable
│
├── lib/
│   ├── config.ts                  # Configuración (API, Keycloak)
│   ├── keycloak.ts                # Setup de Keycloak
│   └── api/
│       ├── client.ts              # Cliente HTTP genérico
│       ├── products.ts            # API de productos
│       └── stock.ts               # API de stock
│
├── hooks/
│   └── useAuth.ts                 # Hook de autenticación
│
└── package.json
```

## Páginas Principales

### 1. Dashboard (`/dashboard`)
- Bienvenida y resumen
- Información del rol del usuario
- Quick actions para acceder a otras secciones

### 2. Products (`/products`)
- Vista de todos los productos
- Crear producto (solo admin/employee)
- Editar producto
- Eliminar producto
- Filtros por nombre, categoría, estado de stock
- Búsqueda y paginación

### 3. Stock History (`/stock-history`)
- Historial de todos los movimientos
- Filtrar por producto y tipo de movimiento
- Búsqueda por razón
- Detalles de cada movimiento (usuario, fecha, etc)

### 4. Stock Management (`/stock-management`)
- Resumen de stock por estado
- Alertas de productos sin stock
- Alertas de stock bajo
- Botones rápidos para ajustar stock

## Características

✅ **Autenticación**: Integración con Keycloak
✅ **Roles**: Admin, Employee, Guest
✅ **Responsive Design**: Mobile-first con Tailwind CSS
✅ **Modales**: Para crear/editar/ajustar stock
✅ **Filtros avanzados**: Por categoría, stock, búsqueda
✅ **Paginación**: Para grandes volúmenes de datos
✅ **Alertas visuales**: Stock bajo y fuera de stock
✅ **Historial completo**: Auditoría de movimientos

## Tipos de Movimiento de Stock

- STOCK_IN: Entrada de inventario
- STOCK_OUT: Salida de inventario
- ADJUSTMENT: Ajuste por discrepancias
- RETURN: Devoluciones
- LOSS: Pérdidas
- INITIAL: Stock inicial

## Próximos Pasos

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno (.env.local)
3. Ejecutar: `npm run dev`
4. Abrir en navegador: http://localhost:3000
