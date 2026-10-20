-- The public quote remains payment-method neutral. Once the guest chooses a
-- method, the reservation stores the applied commercial adjustment so the
-- displayed total, expected payment and provider checkout remain auditable.
ALTER TABLE reserva_metodos_pago ADD COLUMN recargo_porcentaje_bps INTEGER NOT NULL DEFAULT 0
  CHECK (recargo_porcentaje_bps BETWEEN 0 AND 10000);
ALTER TABLE reserva_metodos_pago ADD COLUMN recargo_total_centavos INTEGER NOT NULL DEFAULT 0
  CHECK (recargo_total_centavos >= 0);
ALTER TABLE reserva_metodos_pago ADD COLUMN recargo_sena_centavos INTEGER NOT NULL DEFAULT 0
  CHECK (recargo_sena_centavos >= 0);

CREATE TRIGGER reserva_metodo_transferencia_sin_recargo_insert
BEFORE INSERT ON reserva_metodos_pago
WHEN NEW.metodo = 'transferencia_mp' AND (
  NEW.recargo_porcentaje_bps <> 0
  OR NEW.recargo_total_centavos <> 0
  OR NEW.recargo_sena_centavos <> 0
)
BEGIN
  SELECT RAISE(ABORT, 'bank transfer cannot include a payment-method surcharge');
END;

CREATE TRIGGER reserva_metodo_transferencia_sin_recargo_update
BEFORE UPDATE ON reserva_metodos_pago
WHEN NEW.metodo = 'transferencia_mp' AND (
  NEW.recargo_porcentaje_bps <> 0
  OR NEW.recargo_total_centavos <> 0
  OR NEW.recargo_sena_centavos <> 0
)
BEGIN
  SELECT RAISE(ABORT, 'bank transfer cannot include a payment-method surcharge');
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0038', 'recargos auditables por medio de pago',
        'migrations/0038_payment_method_surcharges.sql');
