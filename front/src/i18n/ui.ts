export const languages = { es: 'Español', en: 'English' } as const
export type Lang = keyof typeof languages
export const defaultLang: Lang = 'es'

export const getLang = (locale?: string | null): Lang => (locale === 'en' ? 'en' : 'es')

const es = {
   skipToContent: 'Saltar al contenido',
   siteDescription: 'Productos para cabello y barba en ChecoBarber: ceras, aceites y más. Compra en línea y agenda tu cita.',
   language: 'Idioma',
   logoAlt: 'ChecoBarber',

   navBook: 'Agendar cita',
   navMyOrders: 'Mis compras',
   navCart: 'Tu carrito',
   navHello: 'Hola, {name}',
   navLogout: 'Cerrar sesión',
   navLogin: 'Iniciar sesión',
   navRegister: 'Registrarse',
   searchPlaceholder: 'Busca cera, cortes...',
   searchLabel: 'Buscar productos',

   footerContact: 'Contacto',
   footerSitemap: 'Mapa del sitio',
   footerShop: 'Tienda',
   footerCart: 'Carrito',

   heroBadge: 'Haircuts & Shaves',
   heroTitle1: 'Chequito Barber.',
   heroTitle2: 'Cuida cada detalle.',
   heroText: 'Descubre nuestra selección de productos para cabello y barba y lleva tu rutina de cuidado al siguiente nivel.',
   heroShop: 'Ver productos',
   heroMore: 'Conoce más',
   heroLogoAlt: 'Logo de ChecoBarber',

   categories: 'Categorías',
   allCategories: 'Todas las categorías',
   shopAll: 'Todos los productos',
   shopResults: 'Resultados para “{q}”',
   shopAvailable: 'Productos disponibles',
   shopEmpty: 'No se encontraron productos disponibles en esta sección.',
   shopError: 'Error de conexión',
   noImage: 'Sin imagen',
   viewDetail: 'Ver detalle',
   add: 'Añadir',

   backToCatalog: 'Volver al catálogo',
   stockAvailable: 'Stock disponible: {n} unidades',
   soldOut: 'Agotado',
   addToCart: 'Añadir al carrito',
   goToCart: 'Ir al carrito',
   productNotFound: 'No se encontró el producto.',
   productFallback: 'Producto',
   productDescription: 'Compra {name} en ChecoBarber.',
   productUnavailable: 'Producto no disponible en ChecoBarber.',

   categoryFallback: 'Categoría',
   categoryDescription: 'Productos de {name} en ChecoBarber: cuidado para cabello y barba. Compra en línea.',
   homeTitle: 'ChecoBarber | Productos para cabello y barba',
   homeDescription: 'Tienda en línea de ChecoBarber: ceras, aceites y productos para el cuidado de cabello y barba. Compra fácil y agenda tu cita.',

   cartTitleSeo: 'Carrito | ChecoBarber',
   cartItemsOne: '1 artículo en tu carrito',
   cartItemsMany: '{n} artículos en tu carrito',
   miniEmpty: 'Aún no has agregado productos.',
   total: 'Total',
   viewCart: 'Ver carrito',
   cartYourOrder: 'Tu compra',
   cartHeading: 'Carrito',
   cartCount: '{n} producto(s) en tu carrito',
   keepShopping: 'Seguir comprando',
   cartEmpty: 'Tu carrito está vacío',
   cartEmptyHint: 'Agrega algunos productos para comenzar tu compra.',
   perUnit: 'por unidad',
   removeOne: 'Quitar una unidad',
   addOne: 'Agregar una unidad',
   remove: 'Eliminar',
   summary: 'Resumen',
   products: 'Productos',
   subtotal: 'Subtotal',
   checkout: 'Continuar al checkout',
}

export type UiKey = keyof typeof es

const en: Record<UiKey, string> = {
   skipToContent: 'Skip to content',
   siteDescription: 'Hair and beard products at ChecoBarber: waxes, oils and more. Shop online and book your appointment.',
   language: 'Language',
   logoAlt: 'ChecoBarber',

   navBook: 'Book appointment',
   navMyOrders: 'My orders',
   navCart: 'Your cart',
   navHello: 'Hi, {name}',
   navLogout: 'Log out',
   navLogin: 'Log in',
   navRegister: 'Sign up',
   searchPlaceholder: 'Search wax, cuts...',
   searchLabel: 'Search products',

   footerContact: 'Contact',
   footerSitemap: 'Site map',
   footerShop: 'Shop',
   footerCart: 'Cart',

   heroBadge: 'Haircuts & Shaves',
   heroTitle1: 'Chequito Barber.',
   heroTitle2: 'Take care of every detail.',
   heroText: 'Discover our selection of hair and beard products and take your grooming routine to the next level.',
   heroShop: 'Shop products',
   heroMore: 'Learn more',
   heroLogoAlt: 'ChecoBarber logo',

   categories: 'Categories',
   allCategories: 'All categories',
   shopAll: 'All products',
   shopResults: 'Results for “{q}”',
   shopAvailable: 'Available products',
   shopEmpty: 'No products available in this section.',
   shopError: 'Connection error',
   noImage: 'No image',
   viewDetail: 'View details',
   add: 'Add',

   backToCatalog: 'Back to catalog',
   stockAvailable: 'In stock: {n} units',
   soldOut: 'Sold out',
   addToCart: 'Add to cart',
   goToCart: 'Go to cart',
   productNotFound: 'Product not found.',
   productFallback: 'Product',
   productDescription: 'Buy {name} at ChecoBarber.',
   productUnavailable: 'Product not available at ChecoBarber.',

   categoryFallback: 'Category',
   categoryDescription: '{name} products at ChecoBarber: hair and beard care. Shop online.',
   homeTitle: 'ChecoBarber | Hair and beard products',
   homeDescription: 'ChecoBarber online store: waxes, oils and hair and beard care products. Easy shopping and appointment booking.',

   cartTitleSeo: 'Cart | ChecoBarber',
   cartItemsOne: '1 item in your cart',
   cartItemsMany: '{n} items in your cart',
   miniEmpty: "You haven't added any products yet.",
   total: 'Total',
   viewCart: 'View cart',
   cartYourOrder: 'Your order',
   cartHeading: 'Cart',
   cartCount: '{n} product(s) in your cart',
   keepShopping: 'Keep shopping',
   cartEmpty: 'Your cart is empty',
   cartEmptyHint: 'Add some products to start your order.',
   perUnit: 'per unit',
   removeOne: 'Remove one unit',
   addOne: 'Add one unit',
   remove: 'Remove',
   summary: 'Summary',
   products: 'Products',
   subtotal: 'Subtotal',
   checkout: 'Continue to checkout',
}

const ui: Record<Lang, Record<UiKey, string>> = { es, en }

/** t('en', 'navHello', { name: 'Ana' }) → "Hi, Ana" */
export function t(lang: Lang, key: UiKey, vars: Record<string, string | number> = {}): string {
   let text = ui[lang][key] ?? ui.es[key]
   for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, () => String(value))
   }
   return text
}