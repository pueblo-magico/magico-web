import React, { useRef } from 'react';

// Filtro anti-bots invisible para los formularios públicos — no le agrega
// nada a la persona real:
//   - trampa: un campo oculto que solo un bot completa.
//   - tiempo: un humano tarda más de 3 s en llenar un formulario.
// Si esBot() da true, el formulario debe simular éxito sin enviar nada
// (así el bot no aprende a esquivarlo).
const MS_MINIMO = 3000;

export function useAntiBot() {
  const inicio = useRef(Date.now());
  const trampaRef = useRef<HTMLInputElement>(null);

  const trampa = (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        No completar este campo
        <input ref={trampaRef} type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );

  const esBot = () => Boolean(trampaRef.current?.value) || Date.now() - inicio.current < MS_MINIMO;
  const msLlenado = () => Date.now() - inicio.current;

  return { trampa, esBot, msLlenado, trampaValor: () => trampaRef.current?.value || '' };
}
