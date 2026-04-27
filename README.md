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
git clone https://github.com/maryhug/PruebaDesempe-oTs.git
cd carthub
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
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
| `/admin/orders` | Admin | Ver y gestionar todas las órdenes |
| `/admin/users` | Admin | Ver y gestionar todos los usuarios |
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
| PATCH | `/api/orders/:id` | Admin | Cambiar estado (PENDING → CONFIRMED o CANCELLED) |

### Monitoreo
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/monitor/stream` | Admin | Conexión SSE — stream de eventos en tiempo real |
| GET | `/api/monitor/snapshot` | Admin | Snapshot actual — carritos activos y contadores |

### Usuarios
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/users` | Admin | Listar todos los usuarios |
| PATCH | `/api/users/:id/role` | Admin | Cambiar rol de un usuario |
| PATCH | `/api/users/:id/status` | Admin | Activar o desactivar un usuario |

---

## Cómo funciona el SSE (Server-Sent Events)

SSE es una tecnología nativa del navegador que permite al servidor
enviar datos al cliente en tiempo real sin polling.

### Flujo completo:

1. El admin abre `/monitor`
2. El hook `useMonitor` crea una conexión `EventSource` hacia `/api/monitor/stream`
3. El servidor registra esa conexión en un `Set` global en `sse-store.ts`
4. Cuando un cliente hace cualquier acción en el carrito, el endpoint llama `broadcastEvent()`
5. `broadcastEvent()` itera el `Set` y envía el evento a todos los admins conectados
6. El admin recibe el evento instantáneamente sin recargar la página
7. Al cerrar `/monitor`, el cleanup del `useEffect` cierra la conexión y la remueve del `Set`

### Eventos disponibles:
| Evento | Cuándo se dispara | Datos incluidos |
|---|---|---|
| `cart:item_added` | Cliente agrega producto | userName, productName, quantity |
| `cart:item_removed` | Cliente elimina item | userName, cartId |
| `cart:abandoned` | Cliente vacía el carrito | userName, cartId |
| `cart:checkout` | Cliente confirma la orden | userName, totalAmount, itemCount |

### ¿Por qué SSE y no WebSockets?
SSE es unidireccional (servidor → cliente), más simple de implementar,
nativo del navegador sin librerías extra, y suficiente para notificaciones.
WebSockets son bidireccionales y necesarios solo cuando el cliente también
envía datos en tiempo real.

---

## Cómo funciona el Refresh Token automático

1. Al cargar la app, `AuthContext` llama `/api/auth/me`
2. Si responde `401` (token expirado), automáticamente llama `/api/auth/refresh`
3. Si el refresh es exitoso, reintenta `/api/auth/me` con el nuevo token
4. Si el refresh también falla, la sesión expiró — el usuario ve el login
5. El usuario nunca nota que el token se renovó

---

## Estructura de carpetas

```
carthub/
├── prisma/
│   ├── schema.prisma         # Modelos de BD: User, Product, Cart, Order, etc.
│   └── seed.ts               # Datos de prueba: 1 admin, 2 clientes, 9 productos
│
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Layout raíz — envuelve toda la app con los providers
│   │   ├── page.tsx          # Página raíz — redirige según rol
│   │   ├── error.tsx         # Página de error global
│   │   ├── not-found.tsx     # Página 404
│   │   │
│   │   ├── login/page.tsx          # Formulario de login
│   │   ├── register/page.tsx       # Formulario de registro
│   │   ├── catalog/page.tsx        # Catálogo de productos para customers
│   │   ├── cart/page.tsx           # Carrito con items, total y checkout
│   │   ├── orders/page.tsx         # Historial de órdenes del customer
│   │   │
│   │   ├── admin/
│   │   │   ├── products/page.tsx   # CRUD de productos con modal
│   │   │   ├── orders/page.tsx     # Ver y gestionar todas las órdenes
│   │   │   └── users/page.tsx      # Ver y gestionar todos los usuarios
│   │   │
│   │   ├── monitor/page.tsx        # Panel SSE en tiempo real
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts  # POST — registro
│   │       │   ├── login/route.ts     # POST — login con cookies
│   │       │   ├── logout/route.ts    # POST — invalida refresh token
│   │       │   ├── refresh/route.ts   # POST — renueva access token
│   │       │   └── me/route.ts        # GET — usuario actual
│   │       ├── products/
│   │       │   ├── route.ts           # GET — catálogo público
│   │       │   ├── admin/route.ts     # GET todos + POST crear
│   │       │   └── [id]/route.ts      # GET, PATCH, DELETE por id
│   │       ├── cart/
│   │       │   ├── route.ts           # GET + DELETE carrito
│   │       │   ├── checkout/route.ts  # POST confirmar orden
│   │       │   └── items/
│   │       │       ├── route.ts       # POST agregar item
│   │       │       └── [id]/route.ts  # PATCH + DELETE item
│   │       ├── orders/
│   │       │   ├── route.ts           # GET órdenes
│   │       │   └── [id]/route.ts      # GET + PATCH estado
│   │       ├── users/
│   │       │   ├── route.ts           # GET todos los usuarios
│   │       │   └── [id]/
│   │       │       ├── role/route.ts    # PATCH cambiar rol
│   │       │       └── status/route.ts  # PATCH cambiar estado
│   │       └── monitor/
│   │           ├── stream/route.ts    # GET conexión SSE
│   │           └── snapshot/route.ts  # GET estado actual
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx    # Botón con variantes (primary, secondary, danger) y loading
│   │   │   ├── Badge.tsx     # Badge de colores para estados
│   │   │   ├── Card.tsx      # Contenedor con sombra y borde
│   │   │   └── Modal.tsx     # Modal overlay para formularios
│   │   └── layout/
│   │       └── Navbar.tsx    # Navbar con links según rol y badge del carrito
│   │
│   ├── context/
│   │   ├── AuthContext.tsx   # Estado global del usuario + refresh automático de token
│   │   └── CartContext.tsx   # Estado global del carrito + acciones
│   │
│   ├── hooks/
│   │   ├── useMonitor.ts     # Conexión SSE con EventSource + lista de eventos
│   │   └── usePermission.ts  # Helper para verificar rol en componentes
│   │
│   ├── lib/
│   │   ├── prisma.ts         # Instancia global de PrismaClient con adapter pg
│   │   ├── jwt.ts            # Generar y verificar access/refresh tokens
│   │   ├── bcrypt.ts         # Hashear y comparar contraseñas
│   │   ├── api-response.ts   # successResponse() y errorResponse() estandarizados
│   │   ├── rbac.ts           # getAuthUser(), requireAdmin(), requireCustomer()
│   │   └── sse-store.ts      # Set global de clientes SSE + broadcastEvent()
│   │
│   ├── types/
│   │   ├── auth.ts           # UserPayload, JwtPayload, LoginBody, RegisterBody
│   │   ├── product.ts        # Product, CreateProductBody, UpdateProductBody
│   │   ├── cart.ts           # Cart, CartItem, AddCartItemBody
│   │   ├── order.ts          # Order, OrderItem
│   │   ├── monitor.ts        # SSEEvent, SSEEventType, MonitorSnapshot
│   │   └── api.ts            # ApiResponse<T> — formato estándar de respuestas
│   │
│   ├── validations/
│   │   ├── auth.schema.ts    # Zod: register y login
│   │   ├── product.schema.ts # Zod: crear y editar productos
│   │   └── cart.schema.ts    # Zod: agregar y actualizar items
│   │
│   ├── utils/
│   │   └── formatters.ts     # formatCurrency() y formatDate() con locale es-CO
│   │
│   └── proxy.ts              # Middleware Next.js 16 — protección de rutas por rol
│
├── .env                      
├── .env.example              
├── prisma.config.ts          # Configuración de conexión a BD para Prisma 7
├── .gitignore                
├── package.json              
├── package-lock.json        
└── README.md                
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
- Un usuario tiene exactamente **un registro de carrito** (se reactiva entre compras)
- Al hacer checkout, el carrito pasa a `ORDERED` y se crea una `Order`
- Cada `CartItem` y `OrderItem` guarda un **snapshot del precio** al momento de agregarse
- El stock se reduce **dentro de la transacción** del checkout
- Al cancelar una orden, el stock se **restaura automáticamente**

---

## Seguridad implementada

| Medida | Implementación |
|---|---|
| Contraseñas hasheadas | bcryptjs con saltRounds: 12 |
| Tokens en HttpOnly Cookies | No accesibles desde JavaScript — protección XSS |
| Access Token corto (15 min) | Minimiza ventana de ataque si es robado |
| Refresh Token automático | Se renueva silenciosamente sin interrumpir al usuario |
| Refresh Token en BD | Se invalida en logout — no puede reutilizarse |
| Protección de rutas | proxy.ts verifica token y rol en cada request |
| Total calculado en servidor | Nunca confiar en el total enviado por el cliente |
| Validaciones con Zod | Todos los endpoints validan el body antes de procesar |
| Soft delete de productos | No se eliminan si tienen órdenes asociadas |

---

## Conceptos clave

### ¿Por qué HttpOnly Cookies y no localStorage?
localStorage es accesible desde JavaScript — vulnerable a XSS.
Las HttpOnly cookies no son legibles desde JS. El navegador las envía
automáticamente en cada request sin exponerlas al código del cliente.

### ¿Por qué dos tokens (access + refresh)?
El access token dura 15 min. Si alguien lo roba, expira rápido.
El refresh token dura 7 días pero solo viaja a `/api/auth/refresh`,
minimizando su exposición. Al hacer logout se elimina de la BD.

### ¿Por qué prisma.$transaction()?
Garantiza atomicidad — crear la orden, reducir el stock y cambiar
el estado del carrito ocurren todos juntos o ninguno. Si falla uno,
se revierten todos los cambios.

### ¿Qué es el snapshot del precio (unitPrice)?
Al agregar un producto al carrito, guardamos el precio actual.
Si el admin cambia el precio después, el carrito no se ve afectado.
El cliente paga el precio que tenía cuando lo agregó.

### ¿Por qué el total se calcula en el servidor?
El cliente puede manipular cualquier dato que envíe. El servidor
siempre recalcula con los precios reales de la base de datos.

### ¿Cómo funciona el refresh automático?
Al cargar la app, `AuthContext` intenta obtener el usuario con el
access token actual. Si recibe un 401, automáticamente llama al
endpoint de refresh para obtener un nuevo access token y reintenta.
Todo ocurre de forma transparente para el usuario.