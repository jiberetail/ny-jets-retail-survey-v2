import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type V2Language = "en" | "es";
export type TranslationValues = Record<string, string | number>;
export type V2Translate = (english: string, values?: TranslationValues) => string;

type V2LanguageContextValue = {
  language: V2Language;
  setLanguage: (language: V2Language) => void;
  t: V2Translate;
};

const spanish: Record<string, string> = {
  Language: "Idioma",
  English: "Inglés",
  Spanish: "Español",
  Back: "Atrás",
  Home: "Inicio",
  Continue: "Continuar",
  Close: "Cerrar",
  "Start over": "Comenzar de nuevo",
  "Your cart will be cleared": "Se vaciará tu carrito",
  "Are you sure you want to start over?": "¿Seguro que quieres comenzar de nuevo?",
  "Keep My Cart": "Conservar mi carrito",
  "Start Over": "Comenzar de nuevo",

  "Concierge Merchandise Pickup": "Recogida Concierge de Mercancía",
  "Suite Delivery": "Entrega a la Suite",
  "Ship-to-Home Ordering": "Pedidos con Envío a Casa",
  "Season-Ticket Interest": "Interés en Abonos de Temporada",
  "Team-Store Feedback": "Comentarios de la Tienda",
  "Jets Retail Kiosk": "Quiosco de los Jets",
  "Delivery to suite": "Entrega a la suite",
  "Ship to home": "Envío a casa",
  "Pickup at stadium desk": "Recogida en el estadio",

  "Jets Game Day": "Día de Partido de los Jets",
  "Elevate Your Jets": "Vive la Pasión Jets",
  "Game Day": "en Cada Partido",
  "Shop smarter, enjoy premium service, and get more from every moment at MetLife Stadium.":
    "Compra de forma inteligente, disfruta un servicio premium y aprovecha cada momento en MetLife Stadium.",
  "Choose a Jets game day service": "Elige un servicio para el día de partido de los Jets",
  "What would you like to do?": "¿Qué te gustaría hacer?",
  "Merchandise pickup": "Recogida de mercancía",
  "Concierge Pickup": "Recogida Concierge",
  "Shop Jets gear now and pick it up at a nearby merchandise desk.":
    "Compra artículos de los Jets y recógelos en un mostrador de mercancía cercano.",
  "Start Pickup Order": "Iniciar pedido",
  "Premium service": "Servicio premium",
  "Send merchandise directly to your suite during the game.":
    "Recibe la mercancía directamente en tu suite durante el partido.",
  "Deliver to Suite": "Entregar en la suite",
  "Home delivery": "Entrega a domicilio",
  "Ship to Home": "Enviar a Casa",
  "Buy through the stadium kiosk and have your order shipped after the game.":
    "Compra en el quiosco del estadio y recibe tu pedido después del partido.",
  "Build Ship Order": "Crear pedido con envío",
  "Jets ticketing": "Boletos de los Jets",
  "Season Tickets": "Abonos de Temporada",
  "View opportunities or request contact from a Jets representative.":
    "Explora oportunidades o solicita que te contacte un representante de los Jets.",
  "Explore Tickets": "Explorar boletos",
  "Official New York Jets game day services": "Servicios oficiales de los New York Jets para el día de partido",

  "Find Your Jets Gear": "Encuentra tus Artículos de los Jets",
  "Featured categories and every Jets Shop department.": "Categorías destacadas y todos los departamentos de Jets Shop.",
  "{count} products": "{count} productos",
  "Ready to browse": "Listo para explorar",
  "{count} items in basket": "{count} artículos en el carrito",
  "All Departments": "Todos los Departamentos",
  Hats: "Gorras",
  Jerseys: "Jerseys",
  Sweatshirts: "Sudaderas",
  "T-Shirts": "Camisetas",
  "{count} items": "{count} artículos",
  "Shop Every Department": "Explora Todos los Departamentos",
  "All Jets Shop categories in one place.": "Todas las categorías de Jets Shop en un solo lugar.",
  "Browse merchandise": "Explorar mercancía",
  "{count} products available to browse.": "{count} productos disponibles.",
  "Search {title}": "Buscar en {title}",
  "Search player, product, brand or style": "Buscar jugador, producto, marca o estilo",
  "Catalog pages": "Páginas del catálogo",
  "Previous product page": "Página anterior de productos",
  "Next product page": "Página siguiente de productos",
  "No matching products": "No hay productos coincidentes",
  "Try a player name, product type, brand or style.": "Prueba con un jugador, tipo de producto, marca o estilo.",
  "Back to Selection": "Volver a la Selección",
  "Review Basket": "Revisar Carrito",
  "Ready to ship": "Listo para enviar",
  "Few left": "Quedan pocos",
  "{discount} off": "{discount} de descuento",

  Accessories: "Accesorios",
  "Auto Accessories": "Accesorios para Autos",
  "Blankets, Bed & Bath": "Mantas, Cama y Baño",
  "Books & DVDs": "Libros y DVD",
  Collectibles: "Coleccionables",
  "Cups, Mugs & Shots": "Vasos, Tazas y Vasos de Shot",
  "Dresses & Skirts": "Vestidos y Faldas",
  "Flags & Banners": "Banderas y Pancartas",
  "Gameday & Tailgate": "Día de Partido y Tailgate",
  "Gift Cards": "Tarjetas de Regalo",
  "Golf & More": "Golf y Más",
  "Home Office & School": "Oficina, Hogar y Escuela",
  Jackets: "Chaquetas",
  "Kitchen & Bar": "Cocina y Bar",
  "Lawn & Garden": "Patio y Jardín",
  "License Plate & Frames": "Matrículas y Marcos",
  "Luggage & Sportbags": "Equipaje y Bolsas Deportivas",
  "Pet Supplies": "Artículos para Mascotas",
  Polos: "Polos",
  Rompers: "Mamelucos",
  "Shoes & Socks": "Zapatos y Calcetines",
  "Shorts & Pants": "Pantalones Cortos y Largos",
  "Sweaters & Dress Shirts": "Suéteres y Camisas de Vestir",
  "Sweatshirts & Fleece": "Sudaderas y Forro Polar",
  Swimsuits: "Trajes de Baño",
  "Underwear & Sleepwear": "Ropa Interior y de Dormir",
  "Wallets & Checkbooks": "Carteras y Chequeras",
  "Watches & Clocks": "Relojes",
  "Sale Items": "Artículos en Oferta",

  "Men's fit": "Corte para hombre",
  "Women's fit": "Corte para mujer",
  "Girl's fit": "Corte para niña",
  "Youth fit": "Corte juvenil",
  "Unisex fit": "Corte unisex",
  "Fan fit": "Corte para aficionado",
  Available: "Disponible",
  Unavailable: "No disponible",
  "Selection confirmed": "Selección confirmada",
  "Choose a size": "Elige una talla",
  "Size {size} · {fulfillment}.": "Talla {size} · {fulfillment}.",
  "Select an available size before adding this item.": "Selecciona una talla disponible antes de agregar este artículo.",
  "Add to Basket": "Agregar al Carrito",

  "Review order": "Revisar pedido",
  "Your Basket": "Tu Carrito",
  "Review your items and fulfillment details before online checkout.":
    "Revisa tus artículos y los detalles de entrega antes de continuar al pago en línea.",
  "No items yet": "Aún no hay artículos",
  "Add merchandise to build this order.": "Agrega mercancía para crear este pedido.",
  "Size {size} · Qty {quantity} · {fulfillment}": "Talla {size} · Cant. {quantity} · {fulfillment}",
  "Ready for checkout": "Listo para finalizar la compra",
  Each: "Cada uno",
  "{price} item total": "{price} total del artículo",
  Remove: "Eliminar",
  Subtotal: "Subtotal",
  "Shipping / delivery": "Envío / entrega",
  Included: "Incluido",
  "Estimated tax": "Impuesto estimado",
  "Estimated order total": "Total estimado del pedido",
  "Add More": "Agregar Más",

  Fulfillment: "Entrega",
  "Confirm Suite Delivery": "Confirmar Entrega a la Suite",
  "Choose Shipping Details": "Elegir Detalles de Envío",
  "Choose Pickup Location": "Elegir Lugar de Recogida",
  "Your address and delivery options will be completed securely on your phone.":
    "Completarás tu dirección y las opciones de entrega de forma segura en tu teléfono.",
  "Choose the most convenient location for your order.": "Elige el lugar más conveniente para tu pedido.",
  "Enter shipping details on your phone": "Ingresar datos de envío en tu teléfono",
  "Club-Level Concierge Desk": "Mostrador Concierge del Nivel Club",
  "MetLife Gate Shop Pickup": "Recogida en la Tienda de la Puerta MetLife",
  "Mezzanine Merchandise Window": "Ventanilla de Mercancía del Mezzanine",
  "Estimated delivery: 3-5 business days": "Entrega estimada: 3 a 5 días hábiles",
  "Shipping cost and delivery timing are confirmed during online checkout.":
    "El costo y el plazo de entrega se confirman durante el pago en línea.",

  "Mobile number": "Número de móvil",
  "Secure online checkout": "Pago seguro en línea",
  "Scan to Complete Your Purchase": "Escanea para Completar tu Compra",
  "Continue on Jets Shop to review your cart and pay securely from your phone.":
    "Continúa en Jets Shop para revisar tu carrito y pagar de forma segura desde tu teléfono.",
  "Jets Shop checkout QR code": "Código QR para finalizar la compra en Jets Shop",
  "Official Jets Shop": "Tienda Oficial Jets Shop",
  "Scan with your phone camera": "Escanea con la cámara de tu teléfono",
  "Opens jetsshop.com/cart": "Abre jetsshop.com/cart",
  "Checkout stays on your phone": "La compra se completa en tu teléfono",
  "Finish in three quick steps": "Termina en tres pasos rápidos",
  "Scan the QR code": "Escanea el código QR",
  "Open it with your phone camera.": "Ábrelo con la cámara de tu teléfono.",
  "Review your Jets Shop cart": "Revisa tu carrito de Jets Shop",
  "Confirm products, sizes, and fulfillment.": "Confirma productos, tallas y entrega.",
  "Pay securely on your phone": "Paga de forma segura en tu teléfono",
  "Jets Shop handles all payment details.": "Jets Shop gestiona todos los datos de pago.",
  "Kiosk selection": "Selección del quiosco",
  "1 item": "1 artículo",
  "Estimated total": "Total estimado",
  Reference: "Referencia",
  "Shipping details entered on your phone": "Datos de envío ingresados en tu teléfono",
  "Prices, availability, taxes, and fulfillment are confirmed on Jets Shop before purchase.":
    "Los precios, la disponibilidad, los impuestos y la entrega se confirman en Jets Shop antes de comprar.",
  "Done - Clear Kiosk": "Listo - Limpiar Quiosco",

  "Inventory issue": "Problema de inventario",
  "Size Unavailable": "Talla No Disponible",
  "{product} is unavailable in one requested size. The kiosk blocks checkout and offers alternatives before online checkout.":
    "{product} no está disponible en una talla solicitada. El quiosco bloquea la compra y ofrece alternativas antes del pago en línea.",
  "Unable to reserve selected item": "No se pudo reservar el artículo seleccionado",
  "Size M now shows 0 available at this location.": "La talla M ahora muestra 0 disponibles en este lugar.",
  "Back to Basket": "Volver al Carrito",

  "Jets official ticketing": "Boletos oficiales de los Jets",
  "Interested in Becoming a Season-Ticket Holder?": "¿Te Interesa Tener Abonos de Temporada?",
  "Explore season-ticket opportunities or ask a Jets representative to contact you.":
    "Explora oportunidades de abonos o solicita que te contacte un representante de los Jets.",
  "View season-ticket opportunities": "Ver oportunidades de abonos de temporada",
  "Request contact from a Jets representative": "Solicitar contacto de un representante de los Jets",
  "Season tickets": "Abonos de temporada",
  "Scan to View Official Jets Options": "Escanea para Ver Opciones Oficiales de los Jets",
  "Fans can continue on the Jets approved ticketing experience or request follow-up.":
    "Continúa en la experiencia de boletos aprobada por los Jets o solicita seguimiento.",
  "Request Contact Instead": "Solicitar Contacto",
  "How Should the Jets Follow Up?": "¿Cómo Deben Contactarte los Jets?",
  "Share your contact information and choose your preferred response.":
    "Comparte tu información y elige cómo prefieres recibir una respuesta.",
  Name: "Nombre",
  "Full name": "Nombre completo",
  Mobile: "Móvil",
  Email: "Correo electrónico",
  "Email address": "Dirección de correo electrónico",
  "Text me": "Mensaje de texto",
  "Email me": "Correo electrónico",
  "Call me": "Llamada",
  "Submit Interest": "Enviar Interés",
  "Interest Submitted": "Interés Enviado",
  "A Jets representative will follow up using the fan's preferred method: {method}.":
    "Un representante de los Jets dará seguimiento por el método preferido: {method}.",

  "Team Store": "Tienda del Equipo",
  "Did You Find the Merchandise You Were Looking For?": "¿Encontraste la Mercancía que Buscabas?",
  "Tell us what worked and where we can help.": "Cuéntanos qué funcionó y dónde podemos ayudarte.",
  Yes: "Sí",
  "I found what I wanted": "Encontré lo que quería",
  No: "No",
  "Help identify what was missing": "Ayúdanos a identificar lo que faltaba",
  "Merchandise search": "Búsqueda de mercancía",
  "What Were You Looking For?": "¿Qué Estabas Buscando?",
  "Choose the closest match, then tell us the size you needed.":
    "Elige la opción más parecida y dinos qué talla necesitabas.",
  "Shopping experience": "Experiencia de compra",
  "Did We Make Shopping Easy?": "¿Hicimos Fácil tu Compra?",
  "Let us know what would have made your visit better.": "Dinos qué habría mejorado tu visita.",
  "The checkout line was too long.": "La fila para pagar era demasiado larga.",
  "The store was too crowded.": "La tienda estaba demasiado llena.",
  "I needed help but could not find an associate.": "Necesitaba ayuda, pero no encontré a un asociado.",
  "I could not find the product or size I wanted.": "No encontré el producto o la talla que quería.",
  "The merchandise selection was limited.": "La selección de mercancía era limitada.",
  "Other.": "Otro.",
  "Associate interaction": "Interacción con un asociado",
  "Did You Interact with a Store Associate?": "¿Interactuaste con un Asociado de la Tienda?",
  "Your feedback helps us deliver better game day service.":
    "Tus comentarios nos ayudan a ofrecer un mejor servicio el día del partido.",
  "Satisfied with assistance": "Satisfecho con la ayuda",
  "No associate was available": "No había ningún asociado disponible",
  "Not satisfied with assistance": "No satisfecho con la ayuda",
  "Submit Feedback": "Enviar Comentarios",
  "Thank You": "Gracias",
  "Your feedback helps the Jets improve merchandise availability and the gameday store experience.":
    "Tus comentarios ayudan a los Jets a mejorar la disponibilidad y la experiencia en la tienda.",
  "Missing item": "Artículo faltante",
  "Not provided": "No proporcionado",
  "Requested size": "Talla solicitada",
  "Experience issue": "Problema de experiencia",
  "Associate response": "Respuesta sobre el asociado",
};

function interpolate(template: string, values: TranslationValues = {}) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.split(`{${key}}`).join(String(value)),
    template,
  );
}

const defaultValue: V2LanguageContextValue = {
  language: "en",
  setLanguage: () => {},
  t: (english, values) => interpolate(english, values),
};

const V2LanguageContext = createContext<V2LanguageContextValue>(defaultValue);

export function V2LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<V2Language>("en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: V2Translate = (english, values) => {
    const template = language === "es" ? spanish[english] ?? english : english;
    return interpolate(template, values);
  };

  return (
    <V2LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </V2LanguageContext.Provider>
  );
}

export function useV2Language() {
  return useContext(V2LanguageContext);
}
