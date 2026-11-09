# Temas a revisar / consultar

<!-- Scratchpad personal. No se lee ni usa automáticamente; solo cuando el usuario lo pide. -->
<!-- No marcar como aprendido por haber generado/leído código. -->

## Conceptos en uso (implementación actual)

### Express: montaje de routers con prefijo
- **Dónde:** `app.js:12-13` (`app.use('/api/genres', genresRoutes)`, `/api/albums`).
- **Problema:** separar rutas por recurso y mantener un prefijo de API común.
- **Entender:** cómo `app.use(path, router)` antepone el prefijo a cada ruta del router; diferencia entre `app.get` directo y router.
- **Riesgos:** cambiar el prefijo rompe todos los endpoints; routers exportados deben ser instancias de `express.Router()`.
- **Verificar:** `curl http://localhost:3000/api/genres` devuelve JSON; `/genres` devuelve 404.
- **Docs:** https://expressjs.com/en/guide/routing.html

### Express: middleware `express.json()`
- **Dónde:** `app.js:10`.
- **Problema:** parsear bodies JSON de POST/PUT en `req.body`.
- **Entender:** middleware global vs por ruta; qué pasa si no está (req.body undefined).
- **Riesgos:** sin él las validaciones `if (!name)` fallan de forma distinta; límite de tamaño por defecto (100kb).
- **Verificar:** POST con `Content-Type: application/json` funciona; sin header, req.body vacío.
- **Docs:** https://expressjs.com/en/4x/api.html#express.json

### Express: parámetros de ruta y body
- **Dónde:** `src/routes/genres.js` y `albums.js` (`req.params.id`, `req.body`).
- **Problema:** identificar recurso y recibir datos del cliente.
- **Entender:** `req.params` viene de `:id`; `req.body` del middleware; tipado (siempre string en params).
- **Riesgos:** `req.params.id` no validado como número; PostgreSQL castea, pero IDs no numéricos causan error 500.
- **Verificar:** GET `/api/genres/abc` → revisar respuesta (error 500, no 400).
- **Docs:** https://expressjs.com/en/4x/api.html#req.params

### Express: respuestas y códigos HTTP
- **Dónde:** todas las rutas (`res.status(201)`, `404`, `400`, `500`, `res.json`).
- **Problema:** comunicar resultado al cliente.
- **Entender:** semántica de 200/201/400/404/500; `return` tras enviar respuesta para evitar doble send.
- **Riesgos:** olvidar `return` puede enviar dos respuestas (ERR_HTTP_HEADERS_SENT); 500 con `e.message` filtra detalles internos.
- **Verificar:** DELETE inexistente → 404; POST sin campos → 400.
- **Docs:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

### Express: arranque con promesa
- **Dónde:** `app.js:15-24` (`initializeDatabase().then(...)`).
- **Problema:** no escuchar peticiones hasta que la BD esté lista.
- **Entender:** orden de inicialización; `process.exit(1)` en fallo.
- **Riesgos:** si `initializeDatabase` captura el error internamente (como hace en db.js), el `.catch` nunca se ejecuta y el servidor arranca sin tablas.
- **Verificar:** detener PostgreSQL y arrancar → observar si el servidor escucha o termina.
- **Docs:** https://expressjs.com/en/starter/hello-world.html

### `pg`: Pool y Client
- **Dónde:** `src/config/db.js:4-18` (adminPool, pool), uso de `client` en initializeDatabase.
- **Problema:** reutilizar conexiones y administrar dos bases (postgres default y musica_db).
- **Entender:** `Pool` gestiona conexiones; `client.connect()`/`release()`; diferencia adminPool (crear BD) vs pool (app).
- **Riesgos:** no liberar client (fuga); pool sin manejo de errores de conexión inactiva.
- **Verificar:** logs de conexión; revisar que client.release() esté en finally.
- **Docs:** https://node-postgres.com/apis/pool

### `pg`: consultas parametrizadas
- **Dónde:** todas las rutas (`$1`, `$2`...).
- **Problema:** prevenir SQL injection.
- **Entender:** placeholders y array de valores; por qué no interpolar strings.
- **Riesgos:** concatenar valores en la query reintroduce injection; IDs de params son strings pero pg castea.
- **Verificar:** enviar `name: "'; DROP TABLE genres;--"` en POST → tabla intacta.
- **Docs:** https://node-postgres.com/features/queries

### `pg`: `RETURNING *`
- **Dónde:** INSERT/UPDATE/DELETE en rutas y seed.
- **Problema:** obtener la fila resultante sin consulta adicional.
- **Entender:** qué devuelve; útil para confirmar cambios.
- **Riesgos:** asumir que siempre hay fila (DELETE/UPDATE inexistente → rows vacío, manejado con 404).
- **Verificar:** POST genre → respuesta incluye id asignado.
- **Docs:** https://www.postgresql.org/docs/current/dml-returning.html

### PostgreSQL: JOIN (LEFT JOIN)
- **Dónde:** `src/routes/albums.js:8-12, 22-26`.
- **Problema:** mostrar nombre del género junto al álbum.
- **Entender:** LEFT JOIN conserva álbumes sin género; diferencia con INNER JOIN.
- **Riesgos:** si genre_id es NULL, genre_name será null (no error).
- **Verificar:** insertar álbum con genre_id NULL → aparece con genre_name null.
- **Docs:** https://www.postgresql.org/docs/current/tutorial-join.html

### PostgreSQL: FK con ON DELETE CASCADE
- **Dónde:** `src/config/db.js:49-53` (`genre_id ... ON DELETE CASCADE`).
- **Problema:** eliminar un género borra sus álbumes automáticamente.
- **Entender:** comportamiento en cascada; implicaciones de pérdida de datos.
- **Riesgos:** borrado accidental de muchos álbumes; no hay confirmación ni soft-delete.
- **Verificar:** DELETE genre con álbumes → álbumes desaparecen.
- **Docs:** https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK

### PostgreSQL: DDL idempotente
- **Dónde:** `src/config/db.js:40-54` (`CREATE TABLE IF NOT EXISTS`).
- **Problema:** arrancar sin migraciones formales.
- **Entender:** IF NOT EXISTS evita error en re-ejecuciones; no altera esquema existente.
- **Riesgos:** cambios de esquema (nuevas columnas) no se aplican; divergencia entre BD vieja y código.
- **Verificar:** reiniciar servidor → tablas no se recrean ni duplican.
- **Docs:** https://www.postgresql.org/docs/current/sql-createtable.html

### PostgreSQL: creación de BD desde otra BD
- **Dónde:** `src/config/db.js:20-33` (adminPool conecta a 'postgres').
- **Problema:** crear `musica_db` si no existe (no se puede CREATE DATABASE dentro de una transacción ni conectado a ella).
- **Entender:** conexión a BD por defecto; CREATE DATABASE.
- **Riesgos:** nombre de BD hardcodeado `'musica_db'` ignorando `DB_NAME`; si DB_NAME cambia, se crea otra BD y la app apunta a la configurada.
- **Verificar:** cambiar DB_NAME en .env → observar creación de BD distinta.
- **Docs:** https://www.postgresql.org/docs/current/sql-createdatabase.html

### Seed data condicional
- **Dónde:** `src/config/db.js:56-89` (solo si COUNT genres === 0).
- **Problema:** datos iniciales sin duplicar en reinicios.
- **Entender:** condición sobre tabla; género→id map para FK.
- **Riesgos:** si géneros existen pero álbumes no, no se reinsertan álbumes; seed no es transaccional (fallo parcial deja datos incompletos); re-ejecutar tras borrado manual puede no resembrar si quedan géneros.
- **Verificar:** borrar solo albums → reiniciar → álbumes no se reinsertan.
- **Docs:** (no hay doc oficial específica; lógica de aplicación)

### dotenv con ruta explícita
- **Dónde:** `app.js:1`, `src/config/db.js:1`.
- **Problema:** cargar .env independientemente del cwd.
- **Entender:** `__dirname` y `path.join`; por qué fallaba antes (cwd).
- **Riesgos:** si .env falta, process.env.* undefined → password no string → error SASL; doble llamada a dotenv (app.js y db.js) es redundante pero inofensiva.
- **Verificar:** ejecutar `node Express/app.js` desde `C:\Proyectos` → arranca.
- **Docs:** https://github.com/motdotla/dotenv#config

### Módulos CommonJS
- **Dónde:** `require`/`module.exports` en todos los archivos.
- **Problema:** separar responsabilidades (config, rutas, app).
- **Entender:** cache de módulos; orden de evaluación; exports de objeto vs función.
- **Riesgos:** dependencias circulares; db.js se evalúa al primer require (crea pools inmediatamente, antes de que dotenv cargue si el orden falla).
- **Verificar:** revisar que `require('./src/config/db')` ocurra tras dotenv en app.js (sí).
- **Docs:** https://nodejs.org/api/modules.html

### Validación de entrada (manual)
- **Dónde:** rutas POST/PUT (`if (!name)`, `if (!title || ...)`).
- **Problema:** rechazar peticiones incompletas con 400.
- **Entender:** truthiness; `songs === undefined` permite 0; `!title` rechaza string vacío.
- **Riesgos:** no valida tipos (songs string pasa), longitudes, genre_id existente (FK error → 500 en vez de 400); no sanitiza.
- **Verificar:** POST album con songs:"abc" → error 500 de PostgreSQL.
- **Docs:** (validación de aplicación; ver Zod/Joi en opcionales)

### Manejo de errores en rutas
- **Dónde:** try/catch en cada handler, `res.status(500).json({ error: e.message })`.
- **Problema:** evitar que un error no capturado cierre el proceso.
- **Entender:** async handlers sin try/catch generan unhandled rejection en Express 4; Express 5 captura automáticamente (pero aquí se usa try/catch manual).
- **Riesgos:** mensaje de error filtrado al cliente (info leak); no hay middleware centralizado; errores de validación de BD se reportan como 500.
- **Verificar:** violar UNIQUE de genre → respuesta 500 con mensaje de PG.
- **Docs:** https://expressjs.com/en/guide/error-handling.html

### Variables de entorno y fallback
- **Dónde:** `app.js:8` (`process.env.PORT || 3000`); `src/config/db.js` (sin fallback en credenciales).
- **Problema:** configuración externa y puerto por defecto.
- **Entender:** `process.env` siempre string; `||` para default.
- **Riesgos:** `DB_PORT` string se pasa a pg (pg lo parsea); credenciales sin default → fallo claro si falta .env.
- **Verificar:** quitar PORT del .env → servidor en 3000.
- **Docs:** https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs

## Conceptos futuros / opcionales (no implementados)

- [ ] Validación con Zod/Joi → reemplazar checks manuales.
- [ ] Middleware de errores centralizado → unificar respuestas 500.
- [ ] CORS → conectar frontend.
- [ ] Autenticación (JWT/sesiones).
- [ ] Tests automatizados (Jest + Supertest) → no hay scripts de test.
- [ ] Logging estructurado.
- [ ] Documentación de API (Swagger/OpenAPI).
- [ ] Migraciones formales (node-pg-migrate/Prisma) → reemplazar DDL en código.
- [ ] Transacciones (BEGIN/COMMIT/ROLLBACK) → seed y operaciones multi-tabla.
- [ ] `.env.example` y `.gitignore` → no presentes en el repo.
- [ ] pnpm vs npm/yarn → lockfile pnpm-lock.yaml.
- [ ] Separación controllers/models → más allá de routes/config.

## Decisiones de implementación a revisar manualmente

- Nombre de BD hardcodeado `'musica_db'` en `createDatabaseIfNotExists` mientras `pool` usa `DB_NAME` → inconsistencia si DB_NAME cambia.
- Seed no transaccional y condicionado solo a `genres` vacío → riesgo de datos parciales.
- `e.message` de PostgreSQL expuesto al cliente → posible fuga de información.
- Validación por truthiness sin tipos ni existencia de FK → errores 500 evitables.
- Sin `RETURNING` en seed de albums (no necesario, pero inconsistente).
- `adminPool` y `pool` creados al cargar el módulo → si dotenv falla, error críptico.
- Sin manejo de errores de conexión inactiva del pool.
- Sin límite de tamaño de body ni rate limiting.
- AGENTS.md desactualizado (menciona `clase1.js` e `index.js` como entry; el entry real ahora es `app.js`).
