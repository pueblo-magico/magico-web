# Revisión legal del flujo de reservas online

WRESERV-39 alinea el contenido del sitio con el comportamiento implementado. El
texto sigue siendo un borrador y requiere aprobación legal y comercial humana
antes del lanzamiento productivo.

## Comportamiento reflejado

- Una cotización no bloquea inventario ni confirma una reserva.
- La reserva pública nace como `pendiente_pago` y retiene inventario durante el
  plazo configurable que muestra la interfaz.
- El código `RES-...` identifica la solicitud; la confirmación ocurre solamente
  después de verificar la seña.
- La seña, el saldo, la moneda y la vigencia provienen del snapshot de la
  cotización; no se fijan porcentajes en el texto legal.
- Un pago tardío requiere conciliación y no reactiva automáticamente una
  retención vencida.
- Si falla el destino automático de pago, la reserva puede continuar pendiente
  y recibir instrucciones manuales.
- La política comercial de cancelación está `pendiente_configuracion`; por eso
  no se publican porcentajes de devolución inventados.

## Norma verificada

- Ley 24.240 y Código Civil y Comercial: contratación a distancia y derecho de
  revocación.
- Disposición 954/2025: reemplaza la Resolución 424/2020, exige un enlace visible
  “BOTÓN DE ARREPENTIMIENTO”, sin registro previo, y constancia dentro de 24
  horas. Para servicios turísticos con fecha determinada agrega la anticipación
  mínima de 24 horas prevista en su artículo 2.
- Ley 25.326: acceso dentro de 10 días corridos; rectificación, actualización o
  supresión dentro de 5 días hábiles, con las excepciones legales aplicables.

Fuentes oficiales:

- https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-954-2025-417152/texto
- https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/actualizacion
- https://www.argentina.gob.ar/aaip/datospersonales/derechos

## Gate previo a producción

- [ ] Aprobación legal del texto ES/EN.
- [ ] Aprobación comercial de seña, saldo, cancelación y devolución.
- [ ] Publicación de una política versionada de cancelación en administración.
- [ ] Implementación y prueba de WRESERV-42, Botón de Arrepentimiento.
- [ ] Retiro del aviso de “Revisión legal previa al lanzamiento”.
- [ ] Validación visual y de enlaces en Preview.
