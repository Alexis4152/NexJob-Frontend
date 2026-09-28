import { formatCurrency, formatDate, formatLocalDateEs } from '../utils/format'

/** Presenta la cotizacion del prestador como un ticket de compra: mas facil de leer
 * de un vistazo que una tabla plana, y deja claro que es un desglose "formal". */
export default function QuoteTicket({ booking }) {
  return (
    <div className="quote-ticket bg-white rounded-2xl shadow-sm border border-gray-100 px-5 pt-6 pb-5 mb-5">
      <div className="text-center mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7h6M9 11h6M9 15h3"></path><path d="M5 4h14v16l-3-2-3 2-3-2-3 2-2-2z"></path></svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900">{booking.providerBusinessName}</h3>
        <p className="text-xs text-gray-400">Cotizacion de servicio</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Folio <span className="font-mono text-gray-700">{booking.folio}</span></span>
        {booking.quoteSentAt && <span>{formatDate(booking.quoteSentAt)}</span>}
      </div>

      <div className="border-t-2 border-dashed border-gray-200 mb-4" />

      <div className="space-y-3 mb-4">
        {booking.quoteItems?.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.concept}</p>
              <p className="text-xs text-gray-400">{item.quantity} {item.unit} &times; {formatCurrency(item.unitCost)}</p>
            </div>
            <span className="text-sm font-semibold text-gray-900 shrink-0 tabular-nums">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-gray-200 mb-4" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-900">Total a pagar</span>
        <span className="text-2xl font-extrabold text-primary-700 tabular-nums">{formatCurrency(booking.quoteTotal)}</span>
      </div>

      {booking.estimatedDeliveryDate && (
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Entrega estimada: <span className="font-semibold text-gray-700">{formatLocalDateEs(booking.estimatedDeliveryDate)}</span>
        </p>
      )}

      {booking.quoteNote && (
        <div className="bg-primary-50 rounded-lg px-3 py-2.5 mt-3">
          <p className="text-xs text-primary-800 leading-relaxed">
            <span className="font-semibold">Nota del prestador: </span>{booking.quoteNote}
          </p>
        </div>
      )}
    </div>
  )
}
