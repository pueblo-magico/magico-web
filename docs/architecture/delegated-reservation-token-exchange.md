# Intercambio de token delegado para Reservas

Este checkpoint agrega un cliente **server-only y sin wiring** para preparar una
futura llamada delegada desde Mágico Web hacia Mágico Reservas. No reemplaza el
writer actual ni modifica `/api/admin/crear`.

El cliente aplica RFC 8693 mediante `application/x-www-form-urlencoded` y exige
configuración explícita de issuer, token endpoint, audience y client ID. El
issuer y el endpoint deben usar HTTPS, pertenecer al mismo origen y no contener
credenciales, query ni fragmento. La llamada usa redirect manual y un timeout
corto.

Las dos credenciales provienen exclusivamente de puertos inyectados:

- un proveedor server-only del token humano de Mágico Auth;
- un proveedor server-only de la aserción del cliente confidencial.

Este módulo no lee cookies, variables de entorno ni secretos por sí mismo. No
decodifica ni inventa claims. Tampoco registra tokens, cuerpos o descripciones
de error del proveedor. Sólo devuelve un bearer access token si la respuesta es
JSON válida, declara el tipo RFC esperado y vence en cinco minutos o menos.

Los errores externos se normalizan a códigos sin detalles sensibles. Los tests
prueban intercambio correcto, respuesta inválida o no JSON, rechazo OAuth,
tipo de token ausente o incorrecto, timeout, fallas de proveedores y redacción.
Un guard adicional demuestra que ninguna ruta actual importa el cliente.

## Estado de activación

La capacidad no se puede activar desde el runtime actual. Faltan, en checkpoints
separados y explícitamente aprobados, los proveedores reales de credenciales,
la configuración server-only, el handler consumidor y el cutover del writer.
