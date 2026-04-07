# Cronica de Campana - alpha funcional

Prototipo en React + Vite con una direccion visual fantasy-medieval, pensado para PC y celular.

## Que incluye ahora
- Pantalla de login con sesion local persistida
- Dashboard mas claro para campaña, recap y accesos rapidos
- Busqueda global entre personajes, misiones, sesiones, objetos y notas
- Bitacora tipo libro con autoguardado en `localStorage`
- Exportacion de dossier de campaña en `.md`
- Seccion de `Mascotas y transformaciones` separada del journal
- Integracion real con la API abierta del SRD 2014 para traer criaturas externas
- Guardado local de formas favoritas y mascotas/aliados

## Estructura
- `src/App.jsx`: shell principal, estado y vistas
- `src/components/`: login, overlay del diario, listas y cards
- `src/lib/srd.js`: integracion con SRD abierto
- `src/lib/storage.js`: persistencia local y export

## Importante
- La autenticacion real todavia no esta conectada a un backend; hoy funciona en modo local/demo.
- La sincronizacion entre dispositivos todavia no esta implementada.
- El proximo paso natural es `auth + base de datos + sync`.

## Como correrlo
```bash
npm install
npm run dev
```

Si `npm` o `node` no estan instalados en el entorno, primero hay que instalarlos para poder compilar o levantar el proyecto.
