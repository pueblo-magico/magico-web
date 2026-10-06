export type CodigoErrorReserva =
  | 'RESERVA_NO_ENCONTRADA'
  | 'DATOS_INVALIDOS'
  | 'CONFLICTO_RESERVA'
  | 'ERROR_INTERNO';

export class ErrorReserva extends Error {
  readonly codigo: CodigoErrorReserva;

  constructor(codigo: CodigoErrorReserva, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorReserva';
    this.codigo = codigo;
  }
}
