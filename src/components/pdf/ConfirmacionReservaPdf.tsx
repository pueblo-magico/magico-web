import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { PublicReservationStatus } from '../../../components/booking/bookingApi';

type Locale = 'es' | 'en';

const styles = StyleSheet.create({
  page: { padding: 42, backgroundColor: '#fbfaf6', color: '#132a24', fontFamily: 'Helvetica', fontSize: 10 },
  header: { padding: 26, borderRadius: 16, backgroundColor: '#00633f', color: '#ffffff' },
  eyebrow: { fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 12 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 26, lineHeight: 1.15 },
  subtitle: { marginTop: 8, fontSize: 11, lineHeight: 1.5, color: '#dcebe4' },
  code: { marginTop: 18, padding: 13, borderRadius: 8, backgroundColor: '#eef5f1', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  section: { marginTop: 20, padding: 18, borderRadius: 12, border: '1 solid #d9e3de', backgroundColor: '#ffffff' },
  sectionTitle: { marginBottom: 13, color: '#00633f', fontFamily: 'Helvetica-Bold', fontSize: 13 },
  grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginVertical: -7 },
  field: { width: '50%', paddingHorizontal: 6, paddingVertical: 7 },
  fieldLabel: { color: '#667870', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 },
  fieldValue: { marginTop: 4, fontFamily: 'Helvetica-Bold', fontSize: 10.5, lineHeight: 1.35 },
  priceRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottom: '1 solid #edf1ef' },
  priceLabel: { color: '#52665e' },
  priceValue: { fontFamily: 'Helvetica-Bold' },
  balanceRow: { borderBottom: 0, paddingTop: 11 },
  balanceLabel: { color: '#00633f', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  balanceValue: { color: '#00633f', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  impact: { marginTop: 20, padding: 15, borderRadius: 10, backgroundColor: '#eef7f2', color: '#15543e', fontSize: 9.5, lineHeight: 1.5 },
  help: { marginTop: 18, color: '#5d6e67', fontSize: 9, lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 24, left: 42, right: 42, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', color: '#7f8c86', fontSize: 8 },
});

const COPY = {
  es: {
    title: 'Confirmación de reserva', confirmed: 'Tu estadía está confirmada.', code: 'Código de reserva',
    details: 'Detalles de la estadía', checkIn: 'Llegada', checkOut: 'Salida', nights: 'Noches', guests: 'Personas',
    lodging: 'Alojamiento', modality: 'Modalidad', meals: 'Alimentación', preparation: 'Preparación',
    created: 'Reserva creada', confirmedAt: 'Confirmada', payment: 'Pago y saldo', total: 'Total de la estadía',
    deposit: 'Seña acreditada', balance: 'Saldo pendiente', method: 'Método de pago',
    breakfast: 'Desayuno incluido', fullBoard: 'Pensión completa (desayuno, almuerzo y cena)',
    private: 'Privada', shared: 'Compartida', camping: 'Camping', transfer: 'Transferencia', mercadoPago: 'Mercado Pago',
    impact: 'El 10% de tu inversión va directo a reforestar tabaquillos y restaurar nuestras sierras.',
    help: 'Guardá este documento y el código de reserva. Si necesitás ayuda, escribinos por WhatsApp desde pueblo-magico.com.',
    generated: 'Documento generado', page: 'Página',
  },
  en: {
    title: 'Booking confirmation', confirmed: 'Your stay is confirmed.', code: 'Reservation code',
    details: 'Stay details', checkIn: 'Arrival', checkOut: 'Departure', nights: 'Nights', guests: 'Guests',
    lodging: 'Accommodation', modality: 'Room type', meals: 'Meals', preparation: 'Preparation',
    created: 'Booking created', confirmedAt: 'Confirmed', payment: 'Payment and balance', total: 'Stay total',
    deposit: 'Deposit received', balance: 'Balance due', method: 'Payment method',
    breakfast: 'Breakfast included', fullBoard: 'Full board (breakfast, lunch and dinner)',
    private: 'Private', shared: 'Shared', camping: 'Camping', transfer: 'Bank transfer', mercadoPago: 'Mercado Pago',
    impact: '10% of your investment goes directly to reforesting tabaquillo trees and restoring our mountains.',
    help: 'Keep this document and your booking code. If you need help, contact us on WhatsApp from pueblo-magico.com.',
    generated: 'Document generated', page: 'Page',
  },
} as const;

function dateOnly(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

function dateTime(value: string | null, locale: Locale): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function money(value: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(value / 100);
}

function modalityLabel(value: string, locale: Locale): string {
  const c = COPY[locale];
  return value === 'privada' ? c.private : value === 'compartida' ? c.shared : value === 'camping' ? c.camping : value;
}

export function ConfirmacionReservaPdf({ status, locale }: {
  status: PublicReservationStatus;
  locale: Locale;
}) {
  const c = COPY[locale];
  const meal = status.estadia.regimen_alimentacion === 'pension_completa' ? c.fullBoard : c.breakfast;
  const method = status.pago.metodo === 'transferencia_mp' ? c.transfer : c.mercadoPago;
  const generatedAt = new Date().toISOString();

  return (
    <Document title={`${c.title} ${status.reserva.codigo}`} author="Pueblo Mágico" language={locale}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PUEBLO MÁGICO</Text>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.subtitle}>{c.confirmed}</Text>
        </View>

        <Text style={styles.code}>{c.code}: {status.reserva.codigo}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{c.details}</Text>
          <View style={styles.grid}>
            <Field label={c.checkIn} value={`${dateOnly(status.estadia.check_in, locale)} · 13:00`} />
            <Field label={c.checkOut} value={`${dateOnly(status.estadia.check_out, locale)} · 11:00`} />
            <Field label={c.nights} value={String(status.estadia.noches)} />
            <Field label={c.guests} value={String(status.estadia.personas)} />
            <Field label={c.lodging} value={status.estadia.alojamiento.nombre} />
            <Field label={c.modality} value={modalityLabel(status.estadia.modalidad, locale)} />
            <Field label={c.meals} value={meal} />
            {status.estadia.preparacion && <Field label={c.preparation} value={status.estadia.preparacion.nombre} />}
            <Field label={c.created} value={dateTime(status.reserva.created_at, locale)} />
            <Field label={c.confirmedAt} value={dateTime(status.reserva.confirmed_at, locale)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{c.payment}</Text>
          <PriceRow label={c.total} value={money(status.precio.total_centavos, status.precio.moneda, locale)} />
          <PriceRow label={c.deposit} value={money(status.precio.sena_centavos, status.precio.moneda, locale)} />
          <PriceRow label={c.method} value={method} />
          <View style={[styles.priceRow, styles.balanceRow]}>
            <Text style={styles.balanceLabel}>{c.balance}</Text>
            <Text style={styles.balanceValue}>{money(status.precio.saldo_centavos, status.precio.moneda, locale)}</Text>
          </View>
        </View>

        <Text style={styles.impact}>{c.impact}</Text>
        <Text style={styles.help}>{c.help}</Text>

        <View style={styles.footer} fixed>
          <Text>{c.generated}: {dateTime(generatedAt, locale)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${c.page} ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><Text style={styles.fieldValue}>{value}</Text></View>;
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.priceRow}><Text style={styles.priceLabel}>{label}</Text><Text style={styles.priceValue}>{value}</Text></View>;
}
