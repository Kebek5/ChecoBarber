export type PaymentMethod = 'MERCADOPAGO' | 'LINK' | 'PAYPAL' | 'TERMINAL' | 'CASH'
export type DeliveryType = 'SHIPPING' | 'PICKUP'

export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'reembolsado'
export type StoredPaymentMethod = 'mercadopago' | 'link' | 'paypal' | 'terminal' | 'efectivo'

export interface PaymentMethodOption {
   id: PaymentMethod
   label: string
   description: string
   pickupOnly: boolean
}

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
   {
      id: 'LINK',
      label: 'Mercado Pago',
      description: 'Tarjeta de crédito o débito, saldo de Mercado Pago, OXXO y más. Te llevamos a Mercado Pago para pagar.',
      pickupOnly: false,
   },
   {
      id: 'PAYPAL',
      label: 'PayPal',
      description: 'Paga con tu cuenta PayPal o con tarjeta como invitado.',
      pickupOnly: false,
   },
   {
      id: 'TERMINAL',
      label: 'Tarjeta en terminal al recoger',
      description: 'Pagas con tarjeta en la barbería al recoger tu pedido.',
      pickupOnly: true,
   },
   {
      id: 'CASH',
      label: 'Efectivo al recoger',
      description: 'Pagas en efectivo en la barbería al recoger tu pedido.',
      pickupOnly: true,
   },
]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
   pendiente: 'Pago pendiente',
   aprobado: 'Pagado',
   rechazado: 'Pago rechazado',
   cancelado: 'Cancelado',
   reembolsado: 'Reembolsado',
}

export const STORED_METHOD_LABEL: Record<StoredPaymentMethod, string> = {
   mercadopago: 'Tarjeta o tienda de conveniencia',
   link: 'Link de pago Mercado Pago',
   paypal: 'PayPal',
   terminal: 'Tarjeta en terminal al recoger',
   efectivo: 'Efectivo al recoger',
}

export const EVENT_LABEL: Record<string, string> = {
   pedido_creado: 'Pedido creado',
   pago_creado: 'Intento de pago',
   link_generado: 'Link de pago generado',
   orden_creada: 'Orden de PayPal creada',
   pago_capturado: 'Pago con PayPal',
   cobro_enviado_a_terminal: 'Cobro enviado a la terminal',
   cobro_cancelado: 'Cobro en terminal cancelado',
   pago_efectivo_confirmado: 'Pago en efectivo confirmado',
   stock_devuelto: 'Productos liberados',
   sincronizacion: 'Estado actualizado',
}

export const eventLabel = (evento: string): string =>
   EVENT_LABEL[evento] ?? (evento.startsWith('webhook_') ? 'Notificación del procesador de pagos' : evento)

// Mensajes claros para los rechazos más comunes de Mercado Pago
const REJECTIONS: Record<string, string> = {
   cc_rejected_insufficient_amount: 'La tarjeta no tiene fondos suficientes.',
   cc_rejected_bad_filled_security_code: 'El código de seguridad es incorrecto.',
   cc_rejected_bad_filled_date: 'La fecha de vencimiento es incorrecta.',
   cc_rejected_bad_filled_card_number: 'El número de tarjeta es incorrecto.',
   cc_rejected_bad_filled_other: 'Revisa los datos de la tarjeta.',
   cc_rejected_call_for_authorize: 'Debes autorizar el pago con tu banco.',
   cc_rejected_card_disabled: 'La tarjeta está desactivada. Llama a tu banco.',
   cc_rejected_duplicated_payment: 'Ya hiciste un pago por ese monto. Usa otra tarjeta.',
   cc_rejected_high_risk: 'El pago fue rechazado por seguridad. Usa otro medio.',
   cc_rejected_max_attempts: 'Llegaste al límite de intentos. Usa otra tarjeta.',
}

export const rejectionMessage = (statusDetail?: string | null): string =>
   (statusDetail && REJECTIONS[statusDetail]) || 'El pago fue rechazado. Intenta con otra tarjeta o medio de pago.'

export interface TrackedOrderLine {
   producto: string
   cantidad: number
   precioUnitario: number
}

export interface TrackedOrderEvent {
   evento: string
   estado: string | null
   fecha: string
}

// Lo que devuelve GET /pagos/estado/:referencia
export interface TrackedOrder {
   referencia: string
   fecha: string
   total: number
   estadoPedido: string
   estadoPago: PaymentStatus
   metodoPago: StoredPaymentMethod
   tipoEntrega: 'envio' | 'recoger'
   urlPago: string | null
   pagadoEn: string | null
   lineas: TrackedOrderLine[]
   eventos: TrackedOrderEvent[]
}

export interface BrickPaymentResult {
   referencia: string
   estado: PaymentStatus
   status: string
   statusDetail: string
   tipo: string
   ticketUrl: string | null
}