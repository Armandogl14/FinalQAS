# 🚀 Guía de Instalación y Uso

## Descripción General

Proyecto modernizado de **Gestión de Inventarios** migrado de React a **Next.js 14** con:
- TypeScript para type safety
- Tailwind CSS 4 para estilos
- Keycloak para autenticación
- Arquitectura modular y escalable

## 📋 Requisitos Previos

- Node.js v18+ y npm
- Backend en ejecución (puerto 8080)
- Keycloak en ejecución (puerto 8180)

## 🔧 Instalación

### 1. Clonar o acceder al proyecto

```bash
cd c:\Users\zaloke\Documents\GitHub\FinalQAS\sistema_gestion_intventarios\frontend-nuevo
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- `next@16.0.4` - Framework React
- `react@19.2.0` - Librería React
- `tailwindcss@4` - Estilos CSS
- `keycloak-js@25.0.0` - Autenticación
- `lucide-react@0.364.0` - Iconos
- `date-fns@3.3.1` - Manejo de fechas
- TypeScript y herramientas de desarrollo

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus valores:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180
NEXT_PUBLIC_KEYCLOAK_REALM=inventory-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=inventory-app-public
```

## ▶️ Ejecución

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### Modo Producción

```bash
npm run build
npm start
```

### Lint (Verificar código)

```bash
npm run lint
```

## 📁 Estructura del Proyecto

```
frontend-nuevo/
├── app/                    # Páginas de Next.js
│   ├── layout.tsx         # Layout global con Navbar
│   ├── page.tsx           # Página inicial (redirect)
│   ├── dashboard/         # Dashboard principal
│   ├── products/          # Gestión de productos
│   ├── stock-history/     # Historial de movimientos
│   ├── stock-management/  # Control de stock
│   └── globals.css        # Estilos globales
│
├── components/            # Componentes reutilizables
│   ├── Navbar.tsx        # Navegación principal
│   ├── ProductTable.tsx  # Tabla de productos
│   ├── ProductModal.tsx  # Modal CRUD productos
│   ├── StockModal.tsx    # Modal movimientos
│   ├── FilterBar.tsx     # Filtros avanzados
│   ├── Pagination.tsx    # Paginación
│   ├── StockAlerts.tsx   # Alertas de stock
│   ├── StockHistoryList.tsx  # Listado movimientos
│   └── ui/
│       └── card.tsx      # Componente Card
│
├── lib/                   # Lógica reutilizable
│   ├── config.ts        # Configuración
│   ├── keycloak.ts      # Setup Keycloak
│   └── api/
│       ├── client.ts    # Cliente HTTP
│       ├── products.ts  # API productos
│       └── stock.ts     # API stock
│
├── hooks/                 # Hooks personalizados
│   └── useAuth.ts       # Hook de autenticación
│
├── public/                # Archivos estáticos
├── .env.example          # Variables de entorno ejemplo
├── package.json          # Dependencias
├── tsconfig.json         # Configuración TypeScript
└── tailwind.config.ts    # Configuración Tailwind
```

## 🌐 Páginas Disponibles

| Página | URL | Descripción | Requiere Login |
|--------|-----|-------------|---|
| Dashboard | `/dashboard` | Resumen y bienvenida | ❌ |
| Productos | `/products` | CRUD de productos | ❌ |
| Historial | `/stock-history` | Movimientos de stock | ✅ |
| Gestión Stock | `/stock-management` | Control de inventario | ✅ Admin/Employee |

## 🔐 Control de Acceso

### Funcionalidades por Rol

**Admin**
- ✅ Ver todos los productos
- ✅ Crear productos
- ✅ Editar productos
- ✅ Eliminar productos
- ✅ Ver historial completo
- ✅ Ajustar stock

**Employee**
- ✅ Ver todos los productos
- ✅ Crear productos
- ✅ Editar productos
- ✅ Eliminar productos
- ✅ Ver historial completo
- ✅ Ajustar stock

**Guest**
- ✅ Ver productos
- ❌ Crear/Editar/Eliminar
- ❌ Ver historial
- ❌ Ajustar stock

## 🔄 Flujo de Autenticación

1. Usuario ingresa a la app
2. Se redirige a Keycloak si no está autenticado
3. Después de login, se obtiene JWT token
4. El token se incluye en todas las peticiones al backend
5. Token se refresca automáticamente cada 30 segundos
6. Se validan roles para mostrar/ocultar funciones

## 📊 Tipos de Movimiento de Stock

- **STOCK_IN**: Entrada de inventario
- **STOCK_OUT**: Salida de inventario
- **ADJUSTMENT**: Ajuste por discrepancia
- **RETURN**: Devolución de cliente/proveedor
- **LOSS**: Pérdida/Daño/Robo
- **INITIAL**: Stock inicial

## 🎨 Estilos

El proyecto usa **Tailwind CSS 4** con configuración personalizada:
- Colores dinámicos según estado de stock
- Diseño responsive (mobile-first)
- Componentes accesibles

### Paleta de Colores

- **Verde**: Stock OK
- **Amarillo**: Stock bajo
- **Rojo**: Sin stock
- **Azul**: Acciones/Info

## 🐛 Troubleshooting

### Error: "Cannot find module 'keycloak-js'"

```bash
npm install keycloak-js --save
```

### Error de conexión al backend

Verificar que:
- Backend está en `http://localhost:8080`
- Keycloak está en `http://localhost:8180`
- CORS está habilitado en el backend

### Token expirado

El token se refresca automáticamente. Si hay error:
1. Hacer logout
2. Hacer login nuevamente

## 📚 Documentación Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura detallada
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - Resumen de migración
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🚀 Deploy

### Vercel (Recomendado para Next.js)

```bash
# Instalar CLI de Vercel
npm install -g vercel

# Hacer deploy
vercel
```

### Docker

Crear `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next .next
COPY public public
EXPOSE 3000
CMD ["npm", "start"]
```

Build y run:

```bash
docker build -t inventory-app .
docker run -p 3000:3000 inventory-app
```

## 💡 Tips de Desarrollo

### Hot Reload

Los cambios se reflejan automáticamente al guardar archivos.

### Debugging

1. Abrir DevTools (F12)
2. Console para ver logs
3. Network tab para inspeccionar requests

### Performance

- Usar `React.memo()` para componentes pesados
- Lazy load componentes grandes
- Optimizar imágenes

## 📞 Soporte

Para problemas o mejoras, contactar al equipo de desarrollo.

---

**¡Listo para empezar! 🎉**
