# Entrega Challenge Sr Fullstack (Microservicios)

## 0) Resumen ejecutivo
El objetivo fue evolucionar el backend inicial (NestJS + PostgreSQL) a un modelo event-driven, resolver los principales problemas para hacerlo ejecutable y mostrar el flujo completo con un frontend React.

Resultado:
1. Backend funcionando con endpoints de auth, roles, categorías, productos y salud.
2. Eventos de dominio implementados y consumidos de forma desacoplada.
3. Evidencia de asincronía visible en UI mediante timeline por producto.
4. Web React funcional y role-aware (Admin, Merchant, Customer).
5. Base preparada para deploy separado (API + Web) en Vercel, con Neon Postgres.

---

## 1) Objetivo del challenge
Evolucionar el sistema de catálogo e inventario hacia un enfoque event-driven, con cambios mínimos pero justificados, y demostrar el flujo de punta a punta desde una web simple.

---

## 2) Problemas detectados (Antes) y correcciones (Después)
1. Antes: no había endpoint de health estándar para integración y monitoreo.
   Después: se agregó `GET /health` y alias `GET /api/health`.

2. Antes: faltaba CORS para frontend y backend en dominios separados.
   Después: se habilitó CORS básico en `main.ts` para entorno demo.

3. Antes: faltaban endpoints de lectura para UX real.
   Después: se agregaron `GET /product` (con filtros), `GET /category`, `GET /user` (admin), `GET /role` (admin).

4. Antes: el lifecycle de producto no tenía desactivación explícita.
   Después: se agregó `POST /product/:id/deactivate`.

5. Antes: gestión de roles podía generar ambigüedad.
   Después: se definió rol único efectivo para no-admin con `POST /role/change` y se deshabilitó `POST /role/assign`.

---

## 3) Diseño Event-Driven implementado
Eventos de dominio:
1. `product.created`
2. `product.activated`
3. `product.deactivated`

Puntos de emisión:
1. creación de producto,
2. activación de producto,
3. desactivación de producto.

Consumidores desacoplados:
1. `ProductEventLogListener`: persiste eventos en `product_event`.
2. `ProductActivationMetadataListener`: actualiza `activatedAt` al activar.

Proyección de eventos:
1. tabla `product_event`,
2. índices por `productId`, `type`, `occurredAt`,
3. FK a producto con `ON DELETE CASCADE`.

---

## 4) Flujo asincrónico (event-driven) mostrado en UI
```text
POST /product/create
  -> emite product.created
    -> listener guarda PRODUCT_CREATED en product_event
      -> frontend consulta GET /product/:id/events

POST /product/:id/activate
  -> emite product.activated
    -> listener guarda PRODUCT_ACTIVATED
    -> listener actualiza activatedAt
      -> frontend refresca timeline

POST /product/:id/deactivate
  -> emite product.deactivated
    -> listener guarda PRODUCT_DEACTIVATED
      -> frontend refresca timeline
```

---

## 5) Endpoints principales (estado final)

Auth:
1. `POST /auth/register`
2. `POST /auth/login`

User / Role:
1. `GET /user/profile`
2. `GET /user` (admin)
3. `GET /role` (admin)
4. `POST /role/change` (admin, rol único para no-admin)
5. `POST /role/assign` (admin, deshabilitado intencionalmente)

Product / Category:
1. `GET /category`
2. `GET /product`
3. `GET /product/:id`
4. `GET /product/:id/events`
5. `POST /product/create` (admin/merchant)
6. `POST /product/:id/details` (admin/merchant)
7. `POST /product/:id/activate` (admin/merchant)
8. `POST /product/:id/deactivate` (admin/merchant)
9. `DELETE /product/:id` (admin/merchant)

Health:
1. `GET /health`
2. `GET /api/health`

---

## 6) Frontend React (`apps/web`)
Se construyó una consola en React + Vite + TypeScript con:
1. registro/login,
2. sesión JWT,
3. navegación por rol,
4. listado y filtros de productos,
5. creación de producto,
6. detalle de producto con lectura clara para todos,
7. acciones de lifecycle según permisos,
8. timeline de eventos por producto,
9. gestión de roles para admin.

---

## 7) Matriz de permisos final
1. Admin:
   - crear productos,
   - editar cualquier producto,
   - activar/desactivar cualquier producto,
   - ver usuarios,
   - cambiar roles,
   - ver catálogo.

2. Merchant:
   - crear productos,
   - editar solo productos propios,
   - activar/desactivar solo productos propios,
   - ver catálogo.

3. Customer:
   - ver catálogo y detalle/timeline en modo lectura.

---

## 8) Flujo de demo recomendado
1. Registrar usuario y login.
2. Login como admin.
3. Cambiar el usuario a rol Merchant.
4. Login como Merchant.
5. Crear producto.
6. Completar/editar datos.
7. Activar producto.
8. Ver timeline (`PRODUCT_CREATED`, `PRODUCT_ACTIVATED`).
9. Desactivar producto.
10. Ver `PRODUCT_DEACTIVATED`.

---

## 9) Evidencia sugerida para anexar
1. Captura de login/registro.
2. Captura de admin cambiando rol.
3. Captura de creación de producto.
4. Captura de activación/desactivación.
5. Captura de timeline con eventos.
6. Captura de deploy (frontend y backend públicos).

---

## 10) Cómo levantar local

Backend (raíz):
```bash
npm install
docker-compose up -d
npm run migration:run
npm run seed:run
npm run start:dev
```

Frontend (`apps/web`):
```bash
npm --prefix apps/web install
npm --prefix apps/web run dev
```

Fullstack (desde raíz):
```bash
npm run dev
```

---

## 11) Deploy propuesto (Vercel + Neon)
1. Proyecto API en Vercel:
   - Root Directory: raíz del repo.
   - Variables: `DATABASE_URL`, `JWT_SECRET`, etc.

2. Proyecto Web en Vercel:
   - Root Directory: `apps/web`.
   - Variable: `VITE_API_BASE_URL=https://<tu-api>.vercel.app`.

3. Base de datos:
   - Neon Postgres.
   - Solo backend accede a DB.

---

## 12) URLs públicas
1. Backend: `<URL_BACKEND>`
2. Frontend: `<URL_FRONTEND>`

---

## 13) Decisiones técnicas clave
1. Cambios mínimos pero suficientes para demostrar criterio técnico.
2. Event-driven in-process para simplicidad del challenge.
3. Proyección de eventos para hacer visible la asincronía en frontend.
4. Rol único efectivo para no-admin y evitar conflictos de permisos.
5. Frontend desacoplado de DB; integración exclusivamente por API.

---

## 14) Limitaciones actuales y próximos pasos
Limitaciones:
1. Event bus in-process (sin broker externo).
2. No se implementó full CRUD de inventory/variations/prices para esta fase.
3. CI/CD completo queda como fase siguiente.

Próximos pasos:
1. Pipeline GitHub Actions (lint/test/build/deploy por entorno).
2. Hardening de CORS y políticas de seguridad para producción.
3. Evolución a broker (ej: RabbitMQ/Kafka) si se requiere escalabilidad asíncrona.
