// Compatibilidad con el endpoint original de PR #45. Ambos paths comparten
// exactamente el mismo procesamiento e idempotencia.
export {
  onRequestGet,
  onRequestPost,
} from '../cucuru.ts';
