# HOMIX — Contexto Completo del Proyecto

## Qué es Homix

Marketplace web enfocado en la venta de productos de decoración de hogar. Conecta vendedores (personas que diseñan pinturas, esculturas, objetos decorativos) con compradores que buscan productos únicos para su hogar, todo en una plataforma especializada.

Proyecto construido por una sola persona. Activo y desplegado en producción.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Angular (NgModules, no standalone) | 16 |
| Estilos | SCSS | — |
| Backend/DB | Firebase: Firestore, Auth, Storage, Hosting | SDK 10.x |
| Cloud Functions | Firebase Functions (Gen 2) | 5.1.1 |
| Pagos | MercadoPago API (tarjeta, PSE, Efecty) | SDK 2.9.0 |
| SMS/WhatsApp | Twilio | 5.8.2 |
| Búsqueda | Fuse.js (fuzzy search) | 6.6.2 |
| Gráficas | Chart.js | 4.3.0 |
| Iconos | ng-icons (heroicons, ionicons, material, iconoir) | 25.x |
| Runtime | Node 20 (Functions), TypeScript 5.1 | — |

**Dependencias en frontend que deberían ir en functions:** `stripe`, `resend` están en el package.json raíz pero son server-side.

**Scripts externos cargados en index.html:** Stripe.js, Shopify Buy Button, MercadoPago SDK v2 (se cargan sincrónicamente).

---

## Estructura del Proyecto

```
/
├── src/
│   ├── index.html                  # Shell HTML (carga SDKs Stripe, Shopify, MercadoPago)
│   ├── main.ts                     # Bootstrap → AppModule
│   ├── styles.scss                 # Estilos globales (fuente custom 'font-uno')
│   ├── environments/
│   │   ├── environment.ts          # Config dev (Firebase, Stripe, MercadoPago keys)
│   │   └── environment.prod.ts     # Config prod
│   ├── assets/
│   │   ├── fonts/
│   │   └── img/                    # anuncios, ayuda, categoria, ilustraciones, logo,
│   │                                 nivel, opiniones, pago, productos, usuarios, videos
│   └── app/
│       ├── app.module.ts           # Módulo raíz (importa todos los feature modules)
│       ├── app-routing.module.ts   # Rutas principales
│       ├── app.component.*         # Solo <router-outlet>
│       ├── interfaces/             # Modelos de datos TypeScript
│       ├── servicios/              # Servicios inyectables
│       └── navegacion/             # TODOS los componentes de la app
│           ├── inicio/             # Página principal
│           ├── producto/           # Vista detalle de producto
│           ├── comprar/            # Flujo de checkout (3 pasos)
│           ├── busqueda/           # Búsqueda + carrito + guardados
│           ├── usuario/            # Registro, perfil, vender
│           ├── informacion/        # Ayuda, privacidad, términos, etc.
│           └── componentes-generales/  # Componentes compartidos
├── functions/
│   └── src/index.ts                # Cloud Functions (pagos, WhatsApp, webhook)
├── firestore.rules                 # Reglas Firestore
├── storage.rules                   # Reglas Storage
├── database.rules.json             # Reglas Realtime Database
├── firebase.json                   # Config Firebase Hosting + deploys
└── angular.json                    # Config Angular CLI
```

---

## Módulos y Routing

### AppModule (Eagerly loaded)
Importa directamente: `InicioModule`, `RegistroModule`, `PerfilModule`, `BusquedaModule`, `InformacionModule`, `VenderModule`, `ProductoModule`, `ComprarModule`, `PortalEmpleadoModule`, `ComponentesGeneralesModule`.

### Rutas Principales (app-routing.module.ts)

| Ruta | Componente | Carga |
|------|-----------|-------|
| `/` | InicioComponent | Eager |
| `/vender` | ComoVenderComponent | Eager |
| `/vender/asesoria` | AsesoriaVenderComponent | Eager |
| `/publicar` | PublicarModule | **Lazy** (`loadChildren`) |
| `/ofertas-del-dia` | OfertasDelDiaComponent | Eager |
| `/:id/ventas/detalle-venta/:id` | DetalleVentaComponent | Eager |
| `/:id/:id/:id/enviar-mensaje` | EnviarMensajeComponent | Eager |

### Rutas por Feature Module

**Producto** → `prod/:id` → ProductoComponent

**Búsqueda:**
- `busqueda/:id` — resultados
- `:id/historial` — historial de búsqueda
- `:id` → children: `carrito`, `guardados`

**Registro** (bajo `cuenta/`):
- `iniciar-sesion` (con authGuard)
- `crear-cuenta` (con authGuard)
- `phone-validation` (3 sub-rutas para SMS)
- `email-sent`

**Perfil** (bajo `:id`):
- `perfil/informacion` — datos personales
- `compras` y `compras/detalle-compra/:id`
- `favoritos`, `opiniones`, `novedades`, `reputacion`
- `metricas` → children: `ventas`, `visitas`, `favoritos`
- `publicaciones` y `editar-publicacion/:id`
- `tu-dinero`
- `ventas` → **Lazy** (VentasModule)
- `facturacion` → **Lazy** (FacturacionModule)

**Vender/Publicar** (bajo `formulario/`):
- `paso1` a `paso10` — formulario de publicación de 10 pasos
- `producto-publicado/:id`

**Información:**
- `atencion-cliente`, `atencion-cliente/:id`, `ticket/:id`
- `ayuda` → **Lazy** (compras, mis-datos, general)
- `notificaciones`, `privacidad`, `quienes-somos`, `terminos-condiciones`

**Comprar** (bajo `comprar/`):
- `checkout` (3 pasos: dirección → detalles → pago)
- `checkout/response` — respuesta post-pago

---

## Componentes Compartidos (componentes-generales)

9 componentes exportados globalmente:

| Componente | Propósito |
|-----------|-----------|
| `barra-menu` | Navbar principal |
| `footer` | Pie de página |
| `boton-compra` | Botón "Comprar ahora" reutilizable |
| `boton-carrito` | Botón para agregar al carrito |
| `cargando` | Spinner/loading indicator |
| `modal-confirmacion` | Diálogo de confirmación genérico |

---

## Modelo de Datos (Interfaces)

### Producto (`interfaces/producto/producto.ts`)
```
Producto {
  id, idUsuario, categoria, nombre, autoria, marca, modelo,
  fotos: string[], conSabor, sabor, sabores, tamanios: Tamanio[],
  subCategoria, soloPorHoy, masVendido, colores: {fotos, color}[],
  estilos: Estilo[], videos: {titulo, url}[], detalles: string[],
  descripcion, precio, envioGratis, tipoPublicacion, fecha: Timestamp,
  precioEnvio, vistas: Vistas[], descuento, precioComparacion,
  opiniones: Opinion[], calificacion, ventas, estado: boolean
}
Estilo { id, fotos: string[], estilo, nombre, unidades, sku }
Tamanio { gramos, precio, seleccion }
Opinion { tituloProducto, foto, calificacion, fecha, contenido, check }
```
**Nota:** Existe doble formato de fotos/estilos: legacy (DocumentReference a subcolecciones) y nuevo (strings directos). Los servicios manejan ambos.

### Usuario (`interfaces/usuario/usuario.ts`)
```
Usuario {
  id, usuario, nombre, correo, telefono, seguidores,
  registroHistorial, fechaRegistro, diasComoVendedor,
  direcciones: Direccion[], documento, tipoDocumento,
  tickets: DocRef[], reportes,
  dinero: Dinero { disponible, aLiberar, transacciones[] },
  ventas: DocRef[], compras: DocRef[], favoritos: DocRef[],
  opiniones: Opinion[], publicaciones: DocRef[], novedades: DocRef[],
  facturacion: Facturacion, notificaciones: Notificacion[],
  notificacionesRecibidas: NotificacionesRecibidas,
  emailsRecibidos: EmailsConfiguracion,
  referenciaCompra: referenciaCompra[], carrito: referenciaCompra[],
  guardados: referenciaCompra[], historial: DocRef[], siguiendo: string[]
}
```

### Venta (`interfaces/venta.ts`)
```
Venta {
  numVenta, referencias: porComprar[],
  fechaVenta, enCamino, fechaEnCamino, entregado, fechaEntrega,
  idCliente, idVendedor, datosEnvio: Direccion,
  cancelada, reclamos: Reclamo[], despachosDemorados: DespachoDemorado[]
}
```

### Dirección (`interfaces/usuario/subInterfaces/direccion.ts`)
```
Direccion {
  nombresApellidos, telefono, tipoIdentidad, numeroIdentificacion,
  municipioLocalidad, barrio, direccion: string[],
  detalle, indicaciones, direccionPredeterminada
}
```

### Chat (`interfaces/chat.ts`)
```
Chat { numVenta, mensajes: Mensaje[], bloqueoCliente, bloqueoVendedor }
Mensaje { fecha, contenido, remitente }
```

### MercadoPago (`interfaces/mercadopago.ts`)
```
MercadoPagoPaymentData { token, amount, description, installments, payment_method_id, payer }
MercadoPagoPaymentResponse { success, payment: { id, status, status_detail, ... }, error }
MercadoPagoBrickConfig { initialization, customization, callbacks }
```

### Otros
- `Ticket` — soporte al cliente con respuesta
- `Novedad` — noticias/novedades del vendedor
- `MovimientoDinero` — movimientos financieros
- `Dinero` + `transacion` — balance y transacciones del vendedor
- `Notificacion` — sistema de notificaciones in-app
- `EmailsConfiguracion` — preferencias de emails
- `referenciaCompra` — referencia a producto en carrito/compra (producto: DocRef, estilo, unidades, tamanioIndex)
- `porComprar` — snapshot desnormalizado del producto para la venta

---

## Colecciones en Firestore

| Colección | Documento | Descripción |
|-----------|-----------|-------------|
| `usuarios` | uid del Auth | Perfil completo del usuario |
| `usuarios-internos` | uid | Usuarios internos/empleados |
| `productos` | auto-generated | Catálogo de productos |
| `productos/{id}/estilos` | auto-generated | Estilos del producto (formato legacy) |
| `ventas` | numVenta | Registro de ventas |
| `chats` | numVenta | Chat vinculado a cada venta |
| `mercadopago_payments` | paymentId | Registros de pagos MercadoPago |

**Relaciones:** Se usan `DocumentReference` para vincular usuarios ↔ productos, usuarios ↔ ventas, etc. Esto permite resolver datos bajo demanda.

---

## Servicios

### AuthService (`servicios/usuarios/auth.service.ts`)
- Autenticación: email/password, Google, Facebook, Twitter
- Registro: crea documento en `usuarios` con datos iniciales + notificación de bienvenida
- Métodos: `singIn()`, `singInGoogle()`, `signOut()`, `sendEmail()`, `addUserFirestore()`
- Validaciones: `getTelefonoExistente()`, `getNombreUsuarioExistente()`, `getCorreoExistente()`
- Observable: `userState$` (estado de auth reactivo)
- Flujo post-login: redirige a validación de teléfono vía SMS/WhatsApp

### ComprarService (`servicios/comprar/comprar.service.ts`)
- Flujo completo de compra: producto → dirección → pago
- Carrito: `agregarReferenciaCarrito()`, `eliminarReferenciaCarrito()`
- Guardados: `agregarReferenciaGuardado()`, `eliminarReferenciaGuardado()`
- Compra rápida: `prepararCompraRapida()` (guarda en memoria + Firestore)
- Direcciones: CRUD completo
- Pagos: `procesarPagoMercadoPago()` → Cloud Function → MercadoPago API
- `procesarPagoCompleto()` — maneja tarjeta/PSE/Efecty con lógica diferenciada
- Crea venta + chat automáticamente al completar
- Subjects RxJS: `iniciarPago$`, `pagoAprobado$`

### ProductosService (`servicios/productos/productos.service.ts`)
- CRUD productos + fotos + estilos
- Doble formato: legacy (DocumentReference + Storage) y nuevo (strings en assets)
- `obtenerProductos()` — trae TODOS los productos activos (sin paginación)
- `obtenerProductosSimilares()` — filtro por categoría
- Favoritos/carrito/historial: operaciones sobre el documento del usuario
- Soft delete: `estado: false` (no se borran físicamente)

### VenderService (`servicios/vender/vender.service.ts`)
- Estado del formulario de publicación de 10 pasos
- Validadores de texto (conteo de caracteres)
- Reset de estado

### Otros Servicios
- `ChatsService` — obtener chat por ID
- `VendedorService` — verificar si usuario tiene productos activos
- `InformacionPerfilService` — estado de selección en perfil
- `MetricasService` — periodo de tiempo para dashboard de vendedor (BehaviorSubject)
- `EditarEstilosPublicacionService` — estilos en edición de publicación
- `DataSharingService` — paso temporal de datos entre componentes (sin query params)

---

## Cloud Functions (`functions/src/index.ts`)

Todas Gen 2, región `us-central1`, 256MiB, 60s timeout.

### 1. `enviarWhatsApp` (onCall)
- Envía código de verificación vía WhatsApp usando Twilio
- Input: `{ numero, codigo }`
- Credenciales: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` (env vars)

### 2. `crearPagoMercadoPago` (onCall)
- Procesa pagos con MercadoPago REST API (`POST /v1/payments`)
- Soporta: tarjetas (con token), PSE (bank transfer), Efecty (cash)
- Captura IP del usuario para antifraude
- Genera idempotency key
- Guarda registro en colección `mercadopago_payments`
- Credencial: `MERCADOPAGO_ACCESS_TOKEN` (env var)

### 3. `webhookMercadoPago` (onRequest)
- Recibe notificaciones de MercadoPago sobre cambios de estado de pagos
- Consulta la API de MercadoPago para obtener datos completos
- Actualiza/crea documento en `mercadopago_payments`

### 4. `simularAprobacionPago` (onRequest) — SOLO TESTING
- Simula un pago aprobado en Firestore (para desarrollo)

---

## Flujo de Compra Completo

```
1. Usuario navega productos (InicioComponent / BusquedaComponent)
2. Ve detalle (ProductoComponent en /prod/:id)
3. "Comprar ahora" → prepararCompraRapida() guarda en memoria + Firestore
   ó "Agregar al carrito" → agregarReferenciaCarrito()
4. Checkout (ComprarComponent) — 3 pasos:
   Paso 1: Selección/creación de dirección de envío
   Paso 2: Revisión de detalles (productos agrupados por vendedor)
   Paso 3: Pago con MercadoPago Brick (tarjeta/PSE/Efecty)
5. ResumenCompraComponent monta MercadoPago Payment Brick
6. Usuario completa pago → procesarPagoCompleto()
7. Cloud Function crearPagoMercadoPago → MercadoPago API
8. Si tarjeta: respuesta inmediata
   Si PSE: redirige al banco → webhook actualiza estado
9. agregarVenta() crea documento en ventas/ + chat/ + actualiza usuario
10. RespuestaCompraComponent muestra resultado
```

---

## Flujo de Autenticación

```
1. Usuario en /cuenta/iniciar-sesion o /cuenta/crear-cuenta (protegido por authGuard inverso)
2. Login: email/password ó Google popup
3. Si usuario nuevo → addUserFirestore() crea perfil → redirige a phone-validation
4. Si usuario existente → busca teléfono en Firestore → redirige a validación SMS
5. Validación: Cloud Function enviarWhatsApp envía código por WhatsApp
6. Usuario ingresa código → verificado → acceso completo
```

---

## Flujo de Publicación (Vendedor)

```
1. /vender — landing page informativa
2. /publicar/formulario/paso1 a paso10:
   paso1: Categoría
   paso2: Nombre del producto
   paso3: Autoría/marca/modelo
   paso4: Fotos
   paso5: Estilos/variantes
   paso6: Detalles/especificaciones
   paso7: Descripción
   paso8: Precio
   paso9: Envío (gratis o con costo)
   paso10: Tipo de publicación
3. /publicar/producto-publicado/:id — confirmación
```

---

## Convenciones del Código

- **Idioma:** Español para nombres de variables, servicios, rutas y componentes
- **Estructura de carpetas:** `navegacion/` contiene todo lo visual; `servicios/` toda la lógica
- **Naming de rutas:** kebab-case en español (`comprar/checkout`, `crear-cuenta`, `tu-dinero`)
- **TypeScript strict mode** habilitado con `strictTemplates`
- **Formularios:** Mix de template-driven y reactive forms
- **Estado:** No usa NgRx/store — estado manejado con servicios + BehaviorSubject/Subject
- **Fotos de productos:** Ruta convencional `assets/img/productos/{nombre}.webp`
- **Soft delete:** Productos se desactivan con `estado: false`, no se eliminan
- **Change detection:** Default (no OnPush)
- **Responsive:** `@HostListener('window:resize')` con flag `esModoMovil`

---

## Variables de Entorno

### Frontend (`src/environments/`)
```typescript
environment.firebase = {
  apiKey, authDomain, projectId, storageBucket,
  messagingSenderId, appId, measurementId
}
environment.stripe.key      // Stripe publishable key
environment.mercadoPago.publicKey  // MercadoPago public key
```

### Cloud Functions (`.env` / Firebase config)
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
MERCADOPAGO_ACCESS_TOKEN
```

---

## Proyecto Firebase

- **Project ID:** `homix0523`
- **Hosting:** `homix0523.web.app`
- **Build output:** `dist/homix`
- **Deploy:** `firebase deploy --only hosting` (frontend), `firebase deploy --only functions` (backend)
- **Región functions:** `us-central1`

---

## Problemas Conocidos

### Seguridad (Crítico)
- Firestore rules: cualquier usuario autenticado puede escribir en cualquier documento
- Storage rules: lectura y escritura pública sin autenticación
- Realtime Database rules: lectura y escritura pública total
- Webhook MercadoPago no valida firma HMAC
- `simularAprobacionPago` expuesta en producción
- Claves de Stripe live visibles en archivos de environment

### Routing
- Parámetros duplicados `:id/:id/:id` en rutas de app-routing — Angular solo resuelve el último

### Rendimiento
- La mayoría de módulos se cargan eagerly (no lazy)
- `obtenerProductos()` trae TODOS los documentos sin paginación
- 3 SDKs externos se cargan sincrónicamente en index.html

### Código
- `singIn` en vez de `signIn` (typo consistente)
- Uso frecuente de `any` y `!` (non-null assertion)
- Console.logs abundantes que llegan a producción
- Interfaces vacías pendientes: `AtencionCliente`, `Facturacion`, `ReporteReclamo`
- Campos marcados como `// BORRAR` en Venta
- Inconsistencia en tipos de fecha (Date vs Timestamp vs any)
- Dependencias server-side (stripe, resend) en package.json del frontend

---

## Comandos Útiles

```bash
# Desarrollo
ng serve                              # Servidor local :4200

# Build
ng build                              # Build producción
ng build --configuration development  # Build desarrollo

# Deploy
firebase deploy --only hosting        # Deploy frontend
firebase deploy --only functions      # Deploy Cloud Functions
firebase deploy                       # Deploy todo

# Tests
ng test                               # Unit tests con Karma

# Functions local
cd functions && npm run serve         # Emulador local de functions
```
