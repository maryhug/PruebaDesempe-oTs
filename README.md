# CartHub 🛒

Plataforma de e-commerce interno construida con Next.js 16, TypeScript, PostgreSQL y Prisma 7.
Permite a clientes gestionar su carrito de compras y a administradores monitorear
la actividad en tiempo real mediante Server-Sent Events (SSE).

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 18, TypeScript strict, Tailwind CSS |
| Backend | Next.js API Routes |
| Base de datos | PostgreSQL (Neon) + Prisma 7 |
| Autenticación | bcryptjs + jsonwebtoken |
| Validaciones | Zod |
| Tiempo real | Server-Sent Events (SSE) nativo |
| Estado global | Context API + Custom Hooks |

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/carthub.git
cd carthub
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y completa los valores:
```bash
cp .env.example .env
```

Edita `.env` con tus valores reales:
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_SECRET="minimo-32-caracteres-aleatorios-aqui"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Crear tablas en la base de datos
```bash
npx prisma migrate dev
```

### 5. Cargar datos de prueba
```bash
npx prisma db seed
```

### 6. Iniciar el servidor
```bash
npm run dev
```

Abre http://localhost:3000

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@carthub.co | Admin123! |
| Customer | cliente1@carthub.co | Cliente123! |
| Customer | cliente2@carthub.co | Cliente123! |

---

## Rutas de la aplicación

| Ruta | Rol | Descripción |
|---|---|---|
| `/login` | Público | Iniciar sesión |
| `/register` | Público | Crear cuenta nueva |
| `/catalog` | Customer | Ver catálogo de productos disponibles |
| `/cart` | Customer | Ver carrito y confirmar orden |
| `/orders` | Customer | Ver historial de órdenes propias |
| `/admin/products` | Admin | CRUD completo de productos |
| `/monitor` | Admin | Panel de monitoreo en tiempo real |

---

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar nuevo usuario (rol CUSTOMER por defecto) |
| POST | `/api/auth/login` | Iniciar sesión, retorna access + refresh token en cookies |
| POST | `/api/auth/logout` | Cerrar sesión, invalida refresh token en BD |
| POST | `/api/auth/refresh` | Renovar access token usando refresh token |
| GET | `/api/auth/me` | Obtener datos del usuario autenticado |

### Productos
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/products` | Público | Catálogo — solo productos activos con stock > 0 |
| GET | `/api/products/admin` | Admin | Todos los productos incluyendo inactivos |
| POST | `/api/products/admin` | Admin | Crear nuevo producto |
| GET | `/api/products/:id` | Cualquiera | Ver detalle de un producto |
| PATCH | `/api/products/:id` | Admin | Editar producto |
| DELETE | `/api/products/:id` | Admin | Eliminar (físico si no tiene items, lógico si tiene) |

### Carrito
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/cart` | Customer | Ver carrito activo con sus items |
| DELETE | `/api/cart` | Customer | Vaciar carrito (status → ABANDONED) |
| POST | `/api/cart/items` | Customer | Agregar producto al carrito |
| PATCH | `/api/cart/items/:id` | Customer | Cambiar cantidad de un item |
| DELETE | `/api/cart/items/:id` | Customer | Eliminar item del carrito |
| POST | `/api/cart/checkout` | Customer | Confirmar carrito → crear orden |

### Órdenes
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/orders` | Admin/Customer | Admin ve todas, Customer solo las suyas |
| GET | `/api/orders/:id` | Admin/Customer | Ver detalle de una orden |

### Monitoreo
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/monitor/stream` | Admin | Conexión SSE — stream de eventos en tiempo real |
| GET | `/api/monitor/snapshot` | Admin | Snapshot actual — carritos activos y contadores |

### Usuarios
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| PATCH | `/api/users/:id/role` | Admin | Cambiar rol de un usuario |
| PATCH | `/api/users/:id/status` | Admin | Activar o desactivar un usuario |

---

## Cómo funciona el SSE (Server-Sent Events)

SSE es una tecnología nativa del navegador que permite al servidor
enviar datos al cliente en tiempo real sin que el cliente tenga que
hacer polling (preguntar repetidamente).

### Flujo completo:

1. El admin abre `/monitor`
2. El hook `useMonitor` crea una conexión `EventSource` hacia `/api/monitor/stream`
3. El servidor registra esa conexión en un `Set` global en `sse-store.ts`
4. Cuando un cliente hace cualquier acción (agregar item, checkout, abandonar carrito),
   el endpoint correspondiente llama a `broadcastEvent()`
5. `broadcastEvent()` itera el `Set` y envía el evento a todos los admins conectados
6. El admin recibe el evento instantáneamente sin recargar la página
7. Al cerrar `/monitor`, el `useEffect` cleanup cierra la conexión y la remueve del `Set`

### Eventos disponibles:
| Evento | Cuándo se dispara |
|---|---|
| `cart:item_added` | Cliente agrega producto al carrito |
| `cart:item_removed` | Cliente elimina item del carrito |
| `cart:abandoned` | Cliente vacía el carrito |
| `cart:checkout` | Cliente confirma la orden |

### ¿Por qué SSE y no WebSockets?
SSE es unidireccional (servidor → cliente), más simple de implementar,
nativo del navegador sin librerías extra, y suficiente para notificaciones
donde solo el servidor envía datos. WebSockets son bidireccionales y
necesarios solo cuando el cliente también envía datos en tiempo real.

---

## Estructura de carpetas

```
carthub/
├── prisma/
│   ├── schema.prisma         # Modelos de BD: User, Product, Cart, Order, etc.
│   ├── seed.ts               # Datos de prueba: 1 admin, 2 clientes, 9 productos
│   └── prisma.config.ts      # Configuración de conexión a BD para Prisma 7
│
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Layout raíz — envuelve toda la app con los providers
│   │   ├── page.tsx          # Página raíz — redirige según rol (admin→monitor, customer→catalog)
│   │   ├── error.tsx         # Página de error global de Next.js
│   │   ├── not-found.tsx     # Página 404 global
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx      # Formulario de login con validación
│   │   ├── register/
│   │   │   └── page.tsx      # Formulario de registro con validación
│   │   ├── catalog/
│   │   │   └── page.tsx      # Catálogo de productos para customers
│   │   ├── cart/
│   │   │   └── page.tsx      # Carrito con items, total y botón de checkout
│   │   ├── orders/
│   │   │   └── page.tsx      # Historial de órdenes del customer
│   │   ├── admin/
│   │   │   └── products/
│   │   │       └── page.tsx  # CRUD de productos para admin con modal
│   │   ├── monitor/
│   │   │   └── page.tsx      # Panel SSE con contadores, notificaciones y carritos activos
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts  # POST — registro de usuario
│   │       │   ├── login/route.ts     # POST — login, genera tokens en cookies
│   │       │   ├── logout/route.ts    # POST — invalida refresh token en BD
│   │       │   ├── refresh/route.ts   # POST — renueva access token
│   │       │   └── me/route.ts        # GET — datos del usuario actual
│   │       ├── products/
│   │       │   ├── route.ts           # GET — catálogo público
│   │       │   ├── admin/route.ts     # GET todos + POST crear (solo admin)
│   │       │   └── [id]/route.ts      # GET, PATCH, DELETE por id
│   │       ├── cart/
│   │       │   ├── route.ts           # GET carrito activo + DELETE vaciar
│   │       │   ├── checkout/route.ts  # POST confirmar orden (transacción atómica)
│   │       │   └── items/
│   │       │       ├── route.ts       # POST agregar item
│   │       │       └── [id]/route.ts  # PATCH cantidad + DELETE eliminar item
│   │       ├── orders/
│   │       │   ├── route.ts           # GET todas (admin) o propias (customer)
│   │       │   └── [id]/route.ts      # GET detalle de orden
│   │       ├── users/
│   │       │   └── [id]/
│   │       │       ├── role/route.ts    # PATCH cambiar rol
│   │       │       └── status/route.ts  # PATCH cambiar estado
│   │       └── monitor/
│   │           ├── stream/route.ts    # GET conexión SSE permanente
│   │           └── snapshot/route.ts  # GET estado actual del monitor
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx    # Botón reutilizable con variantes y estado loading
│   │   │   ├── Badge.tsx     # Badge de colores para estados
│   │   │   ├── Card.tsx      # Contenedor con sombra y borde
│   │   │   └── Modal.tsx     # Modal overlay para formularios
│   │   └── layout/
│   │       └── Navbar.tsx    # Navbar con links según rol y badge del carrito
│   │
│   ├── context/
│   │   ├── AuthContext.tsx   # Estado global del usuario autenticado + logout
│   │   └── CartContext.tsx   # Estado global del carrito + acciones (add, remove, checkout)
│   │
│   ├── hooks/
│   │   ├── useMonitor.ts     # Conexión SSE con EventSource + lista de eventos
│   │   └── usePermission.ts  # Helper para verificar rol del usuario en componentes
│   │
│   ├── lib/
│   │   ├── prisma.ts         # Instancia global de PrismaClient (evita múltiples conexiones)
│   │   ├── jwt.ts            # Generar y verificar access/refresh tokens
│   │   ├── bcrypt.ts         # Hashear y comparar contraseñas
│   │   ├── api-response.ts   # Helpers successResponse() y errorResponse() estandarizados
│   │   ├── rbac.ts           # getAuthUser(), requireAdmin(), requireCustomer()
│   │   └── sse-store.ts      # Set global de clientes SSE + broadcastEvent()
│   │
│   ├── types/
│   │   ├── auth.ts           # UserPayload, JwtPayload, LoginBody, RegisterBody
│   │   ├── product.ts        # Product, CreateProductBody, UpdateProductBody
│   │   ├── cart.ts           # Cart, CartItem, AddCartItemBody, UpdateCartItemBody
│   │   ├── order.ts          # Order, OrderItem
│   │   ├── monitor.ts        # SSEEvent, SSEEventType, MonitorSnapshot
│   │   └── api.ts            # ApiResponse<T> — formato estándar de todas las respuestas
│   │
│   ├── validations/
│   │   ├── auth.schema.ts    # Zod schemas para register y login
│   │   ├── product.schema.ts # Zod schemas para crear y editar productos
│   │   └── cart.schema.ts    # Zod schemas para agregar y actualizar items
│   │
│   ├── utils/
│   │   └── formatters.ts     # formatCurrency() y formatDate() con locale es-CO
│   │
│   └── proxy.ts              # Middleware de Next.js 16 — protección de rutas por rol
│
├── .env                      # Variables de entorno reales (no subir a git)
├── .env.example              # Plantilla de variables sin valores reales
├── .gitignore                # node_modules, .env, .next, etc.
└── README.md                 # Este archivo
```

---

## Modelo de datos

```
User (1) ──── (1) Cart ──── (N) CartItem ──── (1) Product
  │                │
  └── (N) Order ───┘
         │
         └── (N) OrderItem ──── (1) Product
```

- Un usuario tiene exactamente **un carrito** a la vez (activo, ordenado o abandonado)
- Al hacer checkout, el carrito pasa a `ORDERED` y se crea una `Order`
- Cada `CartItem` y `OrderItem` guarda un **snapshot del precio** al momento de agregarse
- El stock del producto se reduce **dentro de la transacción** del checkout

---

## Seguridad implementada

| Medida | Implementación |
|---|---|
| Contraseñas hasheadas | bcryptjs con saltRounds: 12 |
| Tokens en HttpOnly Cookies | No accesibles desde JavaScript, protegidos contra XSS |
| Access Token corto (15 min) | Minimiza ventana de ataque si es robado |
| Refresh Token en BD | Se invalida en logout, verificado en cada renovación |
| Protección de rutas | proxy.ts verifica token y rol en cada request |
| Total calculado en servidor | Nunca confiar en el total enviado por el cliente |
| Validaciones con Zod | Todos los endpoints validan el body antes de procesar |
| Soft delete de productos | No se eliminan productos con órdenes asociadas |

---

## Conceptos clave para entender el proyecto

### ¿Por qué HttpOnly Cookies y no localStorage?
localStorage es accesible desde JavaScript, lo que lo hace vulnerable a ataques XSS.
Las HttpOnly cookies no son accesibles desde JS — el navegador las envía automáticamente
en cada request, sin que el código pueda leerlas o robarlas.

### ¿Por qué dos tokens (access + refresh)?
El access token dura solo 15 minutos. Si alguien lo roba, expira rápido.
El refresh token dura 7 días pero solo viaja al endpoint `/api/auth/refresh`,
reduciendo su exposición. Al hacer logout, el refresh token se elimina de la BD
y ya no puede usarse para obtener nuevos access tokens.

### ¿Por qué prisma.$transaction()?
Garantiza que crear la orden, reducir el stock y cambiar el estado del carrito
ocurran todos juntos o ninguno. Si falla cualquier paso, se revierten todos los
cambios y la BD queda en estado consistente.

### ¿Qué es el snapshot del precio (unitPrice)?
Al agregar un producto al carrito, guardamos el precio actual del producto en el
CartItem. Si el admin cambia el precio después, el carrito del cliente no se ve
afectado — pagará el precio que tenía cuando lo agregó.

### ¿Por qué el total se calcula en el servidor?
El cliente puede manipular cualquier dato que envíe. Si enviáramos el total desde
el frontend, un usuario podría modificarlo para pagar menos. El servidor siempre
recalcula el total con los precios reales de la base de datos.