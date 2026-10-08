import type { TipoAlojamiento } from './models.ts';

const MENSAJE_PRIVACIDAD_REFUGIO =
  'Por la cantidad que son, podríamos ubicarlos en una habitación privada dentro del refugio sin cargo extra (sujeto a disponibilidad al momento de asignar camas).';

export function mensajePrivacidad(tipo: TipoAlojamiento, personas: number): string {
  return tipo === 'refugio' && (personas === 3 || personas === 4) ? MENSAJE_PRIVACIDAD_REFUGIO : '';
}
