import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Home,
  Languages,
  MapPin,
  PackageCheck,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Ticket,
  ThumbsUp,
  Truck,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logoSrc from "../imports/new-york-jets-logo-0-1.png";
import heroVideo from "../imports/grok-video-9e94842e-7a91-4f32-8ace-1e4f9bb82a22.mp4";
import fieldVideo from "../imports/grok-video-67c07eb1-53de-4b2d-bf02-0ebcdcc7e644.mp4";
import shopCatalogData from "../data/jets-shop-catalog.json";
import { useV2Language, type V2Translate } from "./contexts/V2LanguageContext";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1920;
const jetsGreen = "#125740";
const ticketUrl = "https://www.newyorkjets.com/tickets/season-tickets/";
const jetsShopCartUrl = "https://www.jetsshop.com/cart";

type Flow = "concierge" | "suite" | "tickets" | "feedback" | "ship";
type MerchFlow = Extract<Flow, "concierge" | "suite" | "ship">;
type Screen =
  | "home"
  | "category"
  | "departments"
  | "products"
  | "detail"
  | "basket"
  | "fulfillment"
  | "checkout"
  | "inventory-error"
  | "ticket-start"
  | "ticket-lead"
  | "ticket-qr"
  | "ticket-confirm"
  | "feedback-start"
  | "lost-demand"
  | "experience"
  | "associate"
  | "feedback-confirm";

type ProductCategory = "hats" | "jerseys" | "sweatshirts" | "tshirts";
type CatalogProductCategory = ProductCategory | "all";

type Department = {
  id: string;
  label: string;
  count: number;
  resourceId: number;
  sourceUrl: string;
};

type Product = {
  id: string;
  sourceId?: string;
  category: CatalogProductCategory;
  categories: ProductCategory[];
  departments: string[];
  departmentLabels: string[];
  name: string;
  style: string;
  price: number;
  regularPrice?: number;
  priceDisplay?: string;
  image: string;
  sourceUrl?: string;
  badges?: string[];
  genderFit: string;
  sizes: string[];
  unavailableSizes?: string[];
  inventory: Record<string, number>;
};

type ShopCatalog = {
  generatedAt: string;
  sourceUrl: string;
  totalProductCount: number;
  catalogProductCount: number;
  seededProductCount: number;
  mainCategories: Array<Department & { id: ProductCategory }>;
  departments: Department[];
  products: Product[];
};

type CartLine = {
  product: Product;
  size: string;
  quantity: number;
};

type FlowCard = {
  flow: Flow;
  title: string;
  eyebrow: string;
  description: string;
  action: string;
  Icon: LucideIcon;
};

const shopCatalog = shopCatalogData as ShopCatalog;
const products = shopCatalog.products;
const mainCategories = shopCatalog.mainCategories;
const categoryLabels = Object.fromEntries(
  mainCategories.map((category) => [category.id, category.label]),
) as Record<ProductCategory, string>;

const flowCards: FlowCard[] = [
  {
    flow: "concierge",
    eyebrow: "Merchandise pickup",
    title: "Concierge Pickup",
    description: "Shop Jets gear now and pick it up at a nearby merchandise desk.",
    action: "Start Pickup Order",
    Icon: PackageCheck,
  },
  {
    flow: "suite",
    eyebrow: "Premium service",
    title: "Suite Delivery",
    description: "Send merchandise directly to your suite during the game.",
    action: "Deliver to Suite",
    Icon: Bell,
  },
  {
    flow: "ship",
    eyebrow: "Home delivery",
    title: "Ship to Home",
    description: "Buy through the stadium kiosk and have your order shipped after the game.",
    action: "Build Ship Order",
    Icon: Truck,
  },
  {
    flow: "tickets",
    eyebrow: "Jets ticketing",
    title: "Season Tickets",
    description: "View opportunities or request contact from a Jets representative.",
    action: "Explore Tickets",
    Icon: Ticket,
  },
];

const pickupLocations = [
  "Club-Level Concierge Desk",
  "MetLife Gate Shop Pickup",
  "Mezzanine Merchandise Window",
];

const suiteLocations = ["Suite 212B", "Suite 146A", "Coaches Club Table 18"];

const lostDemandProducts = products.filter((product) => product.categories.length > 0).slice(0, 6);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function flowTitle(flow: Flow | null, t: V2Translate) {
  if (flow === "concierge") return t("Concierge Merchandise Pickup");
  if (flow === "suite") return t("Suite Delivery");
  if (flow === "ship") return t("Ship-to-Home Ordering");
  if (flow === "tickets") return t("Season-Ticket Interest");
  if (flow === "feedback") return t("Team-Store Feedback");
  return t("Jets Retail Kiosk");
}

function fulfillmentLabel(flow: MerchFlow | null, t: V2Translate) {
  if (flow === "suite") return t("Delivery to suite");
  if (flow === "ship") return t("Ship to home");
  return t("Pickup at stadium desk");
}

function merchandiseBadgeLabel(badge: string, t: V2Translate) {
  if (badge.endsWith("% off")) {
    return t("{discount} off", { discount: badge.replace(" off", "") });
  }

  return t(badge);
}

function buildOrderId(flow: Flow | null) {
  const prefix = flow === "tickets" ? "LEAD" : flow === "feedback" ? "DATA" : "JETS";
  return `${prefix}-${Math.floor(1200 + Math.random() * 7800)}`;
}

export default function App() {
  const [stageScale, setStageScale] = useState(1);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [category, setCategory] = useState<ProductCategory>("jerseys");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [ticketContactMethod, setTicketContactMethod] = useState("");
  const [lostProduct, setLostProduct] = useState<Product | null>(null);
  const [lostSize, setLostSize] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [associateHelp, setAssociateHelp] = useState("");
  const [confirmationId, setConfirmationId] = useState(buildOrderId(null));
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  useEffect(() => {
    const fitStageToViewport = () => {
      setStageScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    };

    fitStageToViewport();
    window.addEventListener("resize", fitStageToViewport);
    return () => window.removeEventListener("resize", fitStageToViewport);
  }, []);

  const merchFlow = activeFlow === "concierge" || activeFlow === "suite" || activeFlow === "ship" ? activeFlow : null;
  const visibleProducts = useMemo(() => {
    if (selectedDepartment) {
      return products.filter((product) => product.departments.includes(selectedDepartment.id));
    }

    return products.filter((product) => product.categories.includes(category));
  }, [category, selectedDepartment]);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const deliveryFee = activeFlow === "ship" ? 8.95 : activeFlow === "suite" ? 0 : 0;
  const tax = subtotal * 0.06625;
  const total = subtotal + deliveryFee + tax;
  const orderId = confirmationId;

  const goHome = () => {
    setScreen("home");
    setActiveFlow(null);
    setCart([]);
    setSelectedProduct(products[0]);
    setSelectedDepartment(null);
    setSelectedSize("");
    setQuantity(1);
    setSelectedLocation("");
    setTicketContactMethod("");
    setLostProduct(null);
    setLostSize("");
    setFeedbackReason("");
    setAssociateHelp("");
    setShowStartOverDialog(false);
  };

  const requestHome = () => {
    if (cart.length) {
      setShowStartOverDialog(true);
      return;
    }

    goHome();
  };

  const startFlow = (flow: Flow) => {
    setActiveFlow(flow);
    setCart([]);
    setQuantity(1);
    setSelectedSize("");
    setSelectedLocation("");
    setTicketContactMethod("");
    setLostProduct(null);
    setLostSize("");
    setFeedbackReason("");
    setAssociateHelp("");
    setConfirmationId(buildOrderId(flow));
    if (flow === "tickets") {
      setScreen("ticket-start");
      return;
    }
    if (flow === "feedback") {
      setScreen("feedback-start");
      return;
    }
    setCategory("hats");
    setSelectedDepartment(null);
    setScreen("category");
  };

  const back = () => {
    if (screen === "home") return;
    if (screen === "category" || screen === "ticket-start" || screen === "feedback-start") {
      goHome();
      return;
    }
    if (screen === "departments") setScreen("category");
    else if (screen === "products") setScreen(selectedDepartment ? "departments" : "category");
    else if (screen === "detail") setScreen("products");
    else if (screen === "basket") setScreen("products");
    else if (screen === "fulfillment") setScreen("basket");
    else if (screen === "checkout") setScreen("fulfillment");
    else if (screen === "inventory-error") setScreen("detail");
    else if (screen === "ticket-lead" || screen === "ticket-qr") setScreen("ticket-start");
    else if (screen === "ticket-confirm") setScreen("ticket-lead");
    else if (screen === "lost-demand") setScreen("feedback-start");
    else if (screen === "experience") setScreen("lost-demand");
    else if (screen === "associate") setScreen("experience");
    else if (screen === "feedback-confirm") setScreen("associate");
  };

  const addProductToCart = () => {
    if (!selectedSize) return;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (line) => line.product.id === selectedProduct.id && line.size === selectedSize,
      );
      if (existing) {
        return currentCart.map((line) =>
          line.product.id === selectedProduct.id && line.size === selectedSize
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...currentCart, { product: selectedProduct, size: selectedSize, quantity }];
    });
    setScreen("basket");
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize("");
    setQuantity(1);
    setScreen("detail");
  };

  const renderContent = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onStart={startFlow} />;
      case "category":
        return (
          <CategoryScreen
            activeFlow={merchFlow}
            cartCount={cart.length}
            categories={mainCategories}
            onSelectCategory={(nextCategory) => {
              setCategory(nextCategory);
              setSelectedDepartment(null);
              setScreen("products");
            }}
            onAllDepartments={() => setScreen("departments")}
          />
        );
      case "departments":
        return (
          <DepartmentsScreen
            departments={shopCatalog.departments}
            onSelectDepartment={(department) => {
              setSelectedDepartment(department);
              setScreen("products");
            }}
          />
        );
      case "products":
        return (
          <ProductsScreen
            category={category}
            department={selectedDepartment}
            products={visibleProducts}
            onSelectProduct={selectProduct}
            onBackToSelection={() => setScreen(selectedDepartment ? "departments" : "category")}
            onBasket={() => setScreen("basket")}
          />
        );
      case "detail":
        return (
          <DetailScreen
            activeFlow={merchFlow}
            product={selectedProduct}
            selectedSize={selectedSize}
            quantity={quantity}
            onSelectSize={(size) => {
              if (selectedProduct.inventory[size] === 0) setScreen("inventory-error");
              else setSelectedSize(size);
            }}
            onQuantityChange={setQuantity}
            onAdd={addProductToCart}
          />
        );
      case "basket":
        return (
          <BasketScreen
            activeFlow={merchFlow}
            cart={cart}
            subtotal={subtotal}
            total={total}
            deliveryFee={deliveryFee}
            onContinueShopping={() => setScreen("category")}
            onRemove={(index) => setCart((currentCart) => currentCart.filter((_, itemIndex) => itemIndex !== index))}
            onNext={() => setScreen("fulfillment")}
          />
        );
      case "fulfillment":
        return (
          <FulfillmentScreen
            activeFlow={merchFlow}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onNext={() => setScreen("checkout")}
          />
        );
      case "checkout":
        return (
          <CheckoutHandoffScreen
            activeFlow={merchFlow}
            cart={cart}
            total={total}
            orderId={orderId}
            selectedLocation={selectedLocation}
            onClose={goHome}
          />
        );
      case "inventory-error":
        return (
          <InventoryErrorScreen
            product={selectedProduct}
            onChooseAlternative={(product) => selectProduct(product)}
            onBackToBasket={() => setScreen(cart.length ? "basket" : "products")}
          />
        );
      case "ticket-start":
        return <TicketStartScreen onLead={() => setScreen("ticket-lead")} onQr={() => setScreen("ticket-qr")} />;
      case "ticket-lead":
        return (
          <TicketLeadScreen
            contactMethod={ticketContactMethod}
            onContactMethod={setTicketContactMethod}
            onSubmit={() => setScreen("ticket-confirm")}
          />
        );
      case "ticket-qr":
        return <TicketQrScreen onLead={() => setScreen("ticket-lead")} />;
      case "ticket-confirm":
        return <TicketConfirmScreen contactMethod={ticketContactMethod} />;
      case "feedback-start":
        return <FeedbackStartScreen onFound={() => setScreen("experience")} onMissing={() => setScreen("lost-demand")} />;
      case "lost-demand":
        return (
          <LostDemandScreen
            product={lostProduct}
            size={lostSize}
            onProduct={setLostProduct}
            onSize={setLostSize}
            onNext={() => setScreen("experience")}
          />
        );
      case "experience":
        return (
          <ExperienceScreen
            reason={feedbackReason}
            onReason={setFeedbackReason}
            onNext={() => setScreen("associate")}
          />
        );
      case "associate":
        return (
          <AssociateScreen
            associateHelp={associateHelp}
            onAssociateHelp={setAssociateHelp}
            onComplete={() => setScreen("feedback-confirm")}
          />
        );
      case "feedback-confirm":
        return (
          <FeedbackConfirmScreen
            product={lostProduct}
            size={lostSize}
            reason={feedbackReason}
            associateHelp={associateHelp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="v2-shell">
      <div
        className="v2-stage-wrap"
        style={{ width: STAGE_WIDTH * stageScale, height: STAGE_HEIGHT * stageScale }}
      >
        <div
          className="v2-stage"
          style={{ transform: `scale(${stageScale})`, transformOrigin: "top left" }}
        >
          <KioskFrame
            activeFlow={activeFlow}
            screen={screen}
            cartCount={cart.reduce((count, line) => count + line.quantity, 0)}
            onBack={back}
            onHome={requestHome}
          >
            {renderContent()}
          </KioskFrame>
          {showStartOverDialog && (
            <StartOverDialog
              onCancel={() => setShowStartOverDialog(false)}
              onConfirm={goHome}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StartOverDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="start-over-overlay">
      <section
        className="start-over-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-over-title"
        aria-describedby="start-over-copy"
      >
        <div className="start-over-icon" aria-hidden="true">
          <AlertTriangle />
        </div>
        <p className="kicker">{t("Start over")}</p>
        <h2 id="start-over-title">{t("Your cart will be cleared")}</h2>
        <p id="start-over-copy">{t("Are you sure you want to start over?")}</p>
        <div className="start-over-actions">
          <button className="keep-cart-action" onClick={onCancel}>{t("Keep My Cart")}</button>
          <button className="clear-cart-action" onClick={onConfirm}>{t("Start Over")}</button>
        </div>
      </section>
    </div>
  );
}

function KioskFrame({
  activeFlow,
  screen,
  cartCount,
  onBack,
  onHome,
  children,
}: {
  activeFlow: Flow | null;
  screen: Screen;
  cartCount: number;
  onBack: () => void;
  onHome: () => void;
  children: ReactNode;
}) {
  const { t } = useV2Language();
  const isHome = screen === "home";
  const background = isHome ? heroVideo : fieldVideo;

  return (
    <div className={isHome ? "kiosk-frame home-mode" : "kiosk-frame"}>
      <video
        key={isHome ? "splash-background" : "grass-background"}
        className="kiosk-video"
        src={background}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="kiosk-scrim" />
      {!isHome && (
        <div className="top-nav">
          <button className="round-button" onClick={onBack} aria-label={t("Back")}>
            <ArrowLeft />
          </button>
          <div className="nav-title">
            <img src={logoSrc} alt="New York Jets" />
            <span>{flowTitle(activeFlow, t)}</span>
          </div>
          <button className="round-button" onClick={onHome} aria-label={t("Home")}>
            <Home />
          </button>
        </div>
      )}
      {!isHome && activeFlow !== "tickets" && activeFlow !== "feedback" && (
        <div className="cart-pill">
          <ShoppingCart size={28} />
          <span>{cartCount}</span>
        </div>
      )}
      <main className={isHome ? "screen home-screen" : "screen"}>{children}</main>
    </div>
  );
}

function HomeScreen({ onStart }: { onStart: (flow: Flow) => void }) {
  const { language, setLanguage, t } = useV2Language();

  return (
    <>
      <section className="home-hero">
        <img src={logoSrc} alt="New York Jets" />
        <div className="home-venue">
          <MapPin size={28} />
          <span>MetLife Stadium</span>
        </div>
        <p className="kicker">{t("Jets Game Day")}</p>
        <h1>
          <span>{t("Elevate Your Jets")}</span>
          <span>{t("Game Day")}</span>
        </h1>
        <p>{t("Shop smarter, enjoy premium service, and get more from every moment at MetLife Stadium.")}</p>
      </section>
      <section className="home-services" aria-label={t("Choose a Jets game day service")}>
        <header>
          <strong>{t("What would you like to do?")}</strong>
          <div className="language-picker" role="group" aria-label={t("Language")}>
            <Languages aria-hidden="true" />
            <button
              className={language === "en" ? "selected" : ""}
              onClick={() => setLanguage("en")}
              aria-label={t("English")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
            <button
              className={language === "es" ? "selected" : ""}
              onClick={() => setLanguage("es")}
              aria-label={t("Spanish")}
              aria-pressed={language === "es"}
            >
              ES
            </button>
          </div>
        </header>
        <div className="home-service-menu">
          {flowCards.map(({ flow, eyebrow, title, description, action, Icon }) => (
            <button key={flow} className={`home-service-option service-${flow}`} onClick={() => onStart(flow)}>
              <div className="service-icon">
                <Icon size={48} />
              </div>
              <div className="service-copy">
                <span>{t(eyebrow)}</span>
                <strong>{t(title)}</strong>
                <p>{t(description)}</p>
              </div>
              <div className="service-action">
                <span>{t(action)}</span>
                <ChevronRight size={34} />
              </div>
            </button>
          ))}
        </div>
      </section>
      <div className="home-footer-strip">
        <BadgeCheck size={26} />
        <span>{t("Official New York Jets game day services")}</span>
      </div>
    </>
  );
}

function CategoryScreen({
  activeFlow,
  cartCount,
  categories,
  onSelectCategory,
  onAllDepartments,
}: {
  activeFlow: MerchFlow | null;
  cartCount: number;
  categories: Array<Department & { id: ProductCategory }>;
  onSelectCategory: (category: ProductCategory) => void;
  onAllDepartments: () => void;
}) {
  const { t } = useV2Language();
  const featured = Object.fromEntries(
    categories.map((category) => {
      const featuredProduct = category.id === "jerseys"
        ? products.find((product) => product.id === "p-200422502")
        : products.find((product) => product.categories.includes(category.id) && product.categories.length === 1);

      return [
        category.id,
        featuredProduct?.image ??
          products.find((product) => product.categories.includes(category.id))?.image ??
          products[0].image,
      ];
    }),
  ) as Record<ProductCategory, string>;

  return (
    <div className="content-stack category-screen">
      <ScreenHeader
        kicker={fulfillmentLabel(activeFlow, t)}
        title={t("Find Your Jets Gear")}
        copy={t("Featured categories and every Jets Shop department.")}
      />
      <div className="catalog-toolbar">
        <div className="catalog-ready">
          <BadgeCheck />
          <div>
            <strong>{t("{count} products", { count: shopCatalog.catalogProductCount.toLocaleString() })}</strong>
            <span>{t("Ready to browse")}</span>
          </div>
        </div>
        <div className="catalog-toolbar-actions">
          <div className="catalog-cart-count" aria-label={t("{count} items in basket", { count: cartCount })}>
            <ShoppingCart />
            <span>{cartCount}</span>
          </div>
          <button className="departments-button" onClick={onAllDepartments}>
            <Grid3X3 />
            <span>{t("All Departments")}</span>
            <small>{shopCatalog.departments.length}</small>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <button key={category.id} className="category-card" onClick={() => onSelectCategory(category.id)}>
            <img src={featured[category.id]} alt={t(category.label)} />
            <span>{t(category.label)}</span>
            <small>{t("{count} items", { count: products.filter((product) => product.categories.includes(category.id)).length.toLocaleString() })}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentsScreen({
  departments,
  onSelectDepartment,
}: {
  departments: Department[];
  onSelectDepartment: (department: Department) => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack departments-screen">
      <ScreenHeader
        kicker={t("All Departments")}
        title={t("Shop Every Department")}
        copy={t("All Jets Shop categories in one place.")}
      />
      <div className="department-grid">
        {departments.map((department) => {
          const availableCount = products.filter((product) => product.departments.includes(department.id)).length;
          const featuredProduct = products.find((product) => product.departments.includes(department.id));
          return (
            <button key={department.id} className="department-card" onClick={() => onSelectDepartment(department)}>
              {featuredProduct && <img src={featuredProduct.image} alt="" />}
              <div>
                <strong>{t(department.label)}</strong>
                <span>{t("{count} items", { count: availableCount.toLocaleString() })}</span>
              </div>
              <ChevronRight />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsScreen({
  category,
  department,
  products: productList,
  onSelectProduct,
  onBackToSelection,
  onBasket,
}: {
  category: ProductCategory;
  department: Department | null;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBackToSelection: () => void;
  onBasket: () => void;
}) {
  const { t } = useV2Language();
  const title = t(department?.label ?? categoryLabels[category]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return productList;
    return productList.filter((product) =>
      [product.name, product.style, product.genderFit, ...product.departmentLabels, ...(product.badges ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [productList, query]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pageProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setQuery("");
    setPage(0);
  }, [category, department?.id]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  return (
    <div className="content-stack products-screen">
      <ScreenHeader
        kicker={t("Browse merchandise")}
        title={title}
        copy={t("{count} products available to browse.", { count: productList.length.toLocaleString() })}
      />
      <div className="catalog-controls">
        <label className="search-bar">
          <Search size={30} />
          <input
            type="search"
            aria-label={t("Search {title}", { title })}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search player, product, brand or style")}
          />
          <span>{filteredProducts.length.toLocaleString()}</span>
        </label>
        <div className="page-controls" aria-label={t("Catalog pages")}>
          <button
            aria-label={t("Previous product page")}
            disabled={page === 0}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          >
            <ChevronLeft />
          </button>
          <span>{page + 1} / {pageCount}</span>
          <button
            aria-label={t("Next product page")}
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="product-grid">
        {pageProducts.length ? (
          pageProducts.map((product) => (
            <button key={product.id} className="product-card" onClick={() => onSelectProduct(product)}>
              {product.badges?.[0] && <small className="product-badge">{merchandiseBadgeLabel(product.badges[0], t)}</small>}
              <img src={product.image} alt={product.name} />
              <strong>{product.name}</strong>
              <div className="product-price">
                <span>{product.priceDisplay ?? formatPrice(product.price)}</span>
                {product.regularPrice && product.regularPrice > product.price && (
                  <del>{formatPrice(product.regularPrice)}</del>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="empty-state product-empty">
            <Search size={66} />
            <strong>{t("No matching products")}</strong>
            <span>{t("Try a player name, product type, brand or style.")}</span>
          </div>
        )}
      </div>
      <div className="product-actions">
        <button className="secondary-action" onClick={onBackToSelection}>
          {t("Back to Selection")}
        </button>
        <button className="primary-action" onClick={onBasket}>
          {t("Review Basket")}
        </button>
      </div>
    </div>
  );
}

function DetailScreen({
  activeFlow,
  product,
  selectedSize,
  quantity,
  onSelectSize,
  onQuantityChange,
  onAdd,
}: {
  activeFlow: MerchFlow | null;
  product: Product;
  selectedSize: string;
  quantity: number;
  onSelectSize: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAdd: () => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="detail-layout">
      <img className="detail-image" src={product.image} alt={product.name} />
      <section className="detail-panel">
        <p className="kicker">{product.style}</p>
        <h2>{product.name}</h2>
        <div className="price-row">
          <strong>{product.priceDisplay ?? formatPrice(product.price)}</strong>
          <span>{t(product.genderFit)}</span>
        </div>
        <div className="size-grid">
          {product.sizes.map((size) => {
            const available = product.inventory[size] > 0;
            return (
              <button
                key={size}
                className={size === selectedSize ? "size-chip selected" : "size-chip"}
                onClick={() => onSelectSize(size)}
                aria-pressed={size === selectedSize}
              >
                <span>{size}</span>
                <small>{available ? t("Available") : t("Unavailable")}</small>
              </button>
            );
          })}
        </div>
        <div className="detail-controls">
          <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => onQuantityChange(Math.min(9, quantity + 1))}>+</button>
        </div>
        <div className={selectedSize ? "inventory-panel" : "inventory-panel pending"}>
          {selectedSize ? <BadgeCheck /> : <ShoppingBag />}
          <div>
            <strong>{selectedSize ? t("Selection confirmed") : t("Choose a size")}</strong>
            <span>
              {selectedSize
                ? t("Size {size} · {fulfillment}.", { size: selectedSize, fulfillment: fulfillmentLabel(activeFlow, t) })
                : t("Select an available size before adding this item.")}
            </span>
          </div>
        </div>
        <button className="primary-action" disabled={!selectedSize} onClick={onAdd}>
          {t("Add to Basket")}
        </button>
      </section>
    </div>
  );
}

function BasketScreen({
  activeFlow,
  cart,
  subtotal,
  total,
  deliveryFee,
  onContinueShopping,
  onRemove,
  onNext,
}: {
  activeFlow: MerchFlow | null;
  cart: CartLine[];
  subtotal: number;
  total: number;
  deliveryFee: number;
  onContinueShopping: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack basket-screen">
      <ScreenHeader
        kicker={t("Review order")}
        title={t("Your Basket")}
        copy={t("Review your items and fulfillment details before online checkout.")}
      />
      <div className="basket-list">
        {cart.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={56} />
            <strong>{t("No items yet")}</strong>
            <span>{t("Add merchandise to build this order.")}</span>
          </div>
        ) : (
          cart.map((line, index) => (
            <div key={`${line.product.id}-${line.size}-${index}`} className="basket-line">
              <img src={line.product.image} alt={line.product.name} />
              <div className="basket-line-copy">
                <strong>{line.product.name}</strong>
                <span>
                  {t("Size {size} · Qty {quantity} · {fulfillment}", {
                    size: line.size,
                    quantity: line.quantity,
                    fulfillment: fulfillmentLabel(activeFlow, t),
                  })}
                </span>
                <small>{t("Ready for checkout")}</small>
              </div>
              <div className="basket-line-price">
                <span>{t("Each")}</span>
                <strong>{formatPrice(line.product.price)}</strong>
                {line.quantity > 1 && (
                  <small>{t("{price} item total", { price: formatPrice(line.product.price * line.quantity) })}</small>
                )}
              </div>
              <button onClick={() => onRemove(index)}>{t("Remove")}</button>
            </div>
          ))
        )}
      </div>
      <div className="totals-panel">
        <Row label={t("Subtotal")} value={formatPrice(subtotal)} />
        <Row label={t("Shipping / delivery")} value={deliveryFee ? formatPrice(deliveryFee) : t("Included")} />
        <Row label={t("Estimated tax")} value={formatPrice(subtotal * 0.06625)} />
        <Row label={t("Estimated order total")} value={formatPrice(total)} strong />
      </div>
      <div className="dual-actions">
        <button className="secondary-action add-more-action" onClick={onContinueShopping}>
          {t("Add More")}
        </button>
        <button className="primary-action" disabled={!cart.length} onClick={onNext}>
          {t("Continue")}
        </button>
      </div>
    </div>
  );
}

function FulfillmentScreen({
  activeFlow,
  selectedLocation,
  onSelectLocation,
  onNext,
}: {
  activeFlow: MerchFlow | null;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();
  const options =
    activeFlow === "suite"
      ? suiteLocations
      : activeFlow === "ship"
        ? ["Enter shipping details on your phone"]
        : pickupLocations;

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Fulfillment")}
        title={
          activeFlow === "suite"
            ? t("Confirm Suite Delivery")
            : activeFlow === "ship"
              ? t("Choose Shipping Details")
              : t("Choose Pickup Location")
        }
        copy={
          activeFlow === "ship"
            ? t("Your address and delivery options will be completed securely on your phone.")
            : t("Choose the most convenient location for your order.")
        }
      />
      <div className="option-list">
        {options.map((option) => {
          const isSelected = selectedLocation === option;

          return (
            <button
              key={option}
              className={isSelected ? "option-row selected" : "option-row"}
              onClick={() => onSelectLocation(option)}
              aria-pressed={isSelected}
            >
              <MapPin />
              <span>{t(option)}</span>
              <SelectionMark selected={isSelected} />
            </button>
          );
        })}
      </div>
      {activeFlow === "ship" && (
        <div className="info-panel">
          <Truck />
          <div>
            <strong>{t("Estimated delivery: 3-5 business days")}</strong>
            <span>{t("Shipping cost and delivery timing are confirmed during online checkout.")}</span>
          </div>
        </div>
      )}
      <button className="primary-action bottom-action" disabled={!selectedLocation} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function CheckoutHandoffScreen({
  activeFlow,
  cart,
  total,
  orderId,
  selectedLocation,
  onClose,
}: {
  activeFlow: MerchFlow | null;
  cart: CartLine[];
  total: number;
  orderId: string;
  selectedLocation: string;
  onClose: () => void;
}) {
  const { t } = useV2Language();
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0);
  const itemCountLabel = itemCount === 1 ? t("1 item") : t("{count} items", { count: itemCount });
  const checkoutUrl = new URL(jetsShopCartUrl);
  checkoutUrl.searchParams.set("utm_source", "metlife_stadium_kiosk");
  checkoutUrl.searchParams.set("utm_medium", "qr");
  checkoutUrl.searchParams.set("utm_campaign", "jets_game_day_checkout");
  checkoutUrl.searchParams.set("utm_content", activeFlow ?? "retail");
  checkoutUrl.searchParams.set("kiosk_ref", orderId);
  const fulfillment = activeFlow === "ship"
    ? t("Shipping details entered on your phone")
    : t(selectedLocation);

  return (
    <div className="content-stack checkout-screen">
      <ScreenHeader
        kicker={t("Secure online checkout")}
        title={t("Scan to Complete Your Purchase")}
        copy={t("Continue on Jets Shop to review your cart and pay securely from your phone.")}
      />
      <div className="checkout-layout">
        <section className="checkout-qr-card" aria-label={t("Jets Shop checkout QR code")}>
          <div className="checkout-qr-mark">
            <QrCode />
            <span>{t("Official Jets Shop")}</span>
          </div>
          <div className="checkout-qr-shell">
            <QRCodeSVG
              value={checkoutUrl.toString()}
              size={352}
              level="M"
              bgColor="#ffffff"
              fgColor={jetsGreen}
            />
          </div>
          <strong>{t("Scan with your phone camera")}</strong>
          <span>{t("Opens jetsshop.com/cart")}</span>
        </section>
        <section className="checkout-instructions">
          <div className="checkout-secure-label">
            <ShieldCheck />
            <span>{t("Checkout stays on your phone")}</span>
          </div>
          <Smartphone size={82} />
          <h3>{t("Finish in three quick steps")}</h3>
          <div className="checkout-steps">
            <div className="checkout-step">
              <span>1</span>
              <div>
                <strong>{t("Scan the QR code")}</strong>
                <small>{t("Open it with your phone camera.")}</small>
              </div>
            </div>
            <div className="checkout-step">
              <span>2</span>
              <div>
                <strong>{t("Review your Jets Shop cart")}</strong>
                <small>{t("Confirm products, sizes, and fulfillment.")}</small>
              </div>
            </div>
            <div className="checkout-step">
              <span>3</span>
              <div>
                <strong>{t("Pay securely on your phone")}</strong>
                <small>{t("Jets Shop handles all payment details.")}</small>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="checkout-order-strip">
        <div>
          <span>{t("Kiosk selection")}</span>
          <strong>{itemCountLabel}</strong>
        </div>
        <div>
          <span>{t("Estimated total")}</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div>
          <span>{t("Fulfillment")}</span>
          <strong>{fulfillment}</strong>
        </div>
        <div>
          <span>{t("Reference")}</span>
          <strong>{orderId}</strong>
        </div>
      </div>
      <div className="checkout-trust-strip">
        <ShieldCheck />
        <span>{t("Prices, availability, taxes, and fulfillment are confirmed on Jets Shop before purchase.")}</span>
      </div>
      <button className="primary-action checkout-done-action" onClick={onClose}>
        <Check />
        {t("Done - Clear Kiosk")}
      </button>
    </div>
  );
}

function InventoryErrorScreen({
  product,
  onChooseAlternative,
  onBackToBasket,
}: {
  product: Product;
  onChooseAlternative: (product: Product) => void;
  onBackToBasket: () => void;
}) {
  const { t } = useV2Language();
  const alternatives = products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categories.some((category) => product.categories.includes(category)),
    )
    .slice(0, 2);

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Inventory issue")}
        title={t("Size Unavailable")}
        copy={t("{product} is unavailable in one requested size. The kiosk blocks checkout and offers alternatives before online checkout.", { product: product.name })}
      />
      <div className="alert-panel">
        <AlertTriangle size={72} />
        <div>
          <strong>{t("Unable to reserve selected item")}</strong>
          <span>{t("Size M now shows 0 available at this location.")}</span>
        </div>
      </div>
      <div className="alternative-grid">
        {alternatives.map((alternative) => (
          <button key={alternative.id} onClick={() => onChooseAlternative(alternative)}>
            <img src={alternative.image} alt={alternative.name} />
            <strong>{alternative.name}</strong>
            <span>{alternative.priceDisplay ?? formatPrice(alternative.price)}</span>
          </button>
        ))}
      </div>
      <button className="secondary-action bottom-action" onClick={onBackToBasket}>
        {t("Back to Basket")}
      </button>
    </div>
  );
}

function TicketStartScreen({ onLead, onQr }: { onLead: () => void; onQr: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack ticket-screen">
      <ScreenHeader
        kicker={t("Jets official ticketing")}
        title={t("Interested in Becoming a Season-Ticket Holder?")}
        copy={t("Explore season-ticket opportunities or ask a Jets representative to contact you.")}
      />
      <button className="big-choice" onClick={onQr}>
        <Ticket />
        <span>{t("View season-ticket opportunities")}</span>
        <ChevronRight />
      </button>
      <button className="big-choice" onClick={onLead}>
        <Users />
        <span>{t("Request contact from a Jets representative")}</span>
        <ChevronRight />
      </button>
    </div>
  );
}

function TicketQrScreen({ onLead }: { onLead: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Season tickets")}
        title={t("Scan to View Official Jets Options")}
        copy={t("Fans can continue on the Jets approved ticketing experience or request follow-up.")}
      />
      <div className="large-qr-card">
        <QRCodeSVG value={ticketUrl} size={360} bgColor="#ffffff" fgColor={jetsGreen} />
        <span>newyorkjets.com/tickets/season-tickets</span>
      </div>
      <button className="primary-action bottom-action" onClick={onLead}>
        {t("Request Contact Instead")}
      </button>
    </div>
  );
}

function TicketLeadScreen({
  contactMethod,
  onContactMethod,
  onSubmit,
}: {
  contactMethod: string;
  onContactMethod: (method: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useV2Language();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const hasPreferredContact = contactMethod === "Email me" ? email.trim() : contactMethod ? mobile.trim() : "";
  const canSubmit = Boolean(contactMethod && name.trim() && hasPreferredContact);

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Season tickets")}
        title={t("How Should the Jets Follow Up?")}
        copy={t("Share your contact information and choose your preferred response.")}
      />
      <div className="lead-form">
        <label>
          {t("Name")}
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Full name")} />
        </label>
        <label>
          {t("Mobile")}
          <input
            type="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder={t("Mobile number")}
          />
        </label>
        <label>
          {t("Email")}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("Email address")}
          />
        </label>
      </div>
      <div className="segmented">
        {["Text me", "Email me", "Call me"].map((method) => (
          <button
            key={method}
            className={contactMethod === method ? "selected" : ""}
            onClick={() => onContactMethod(method)}
            aria-pressed={contactMethod === method}
          >
            {t(method)}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!canSubmit} onClick={onSubmit}>
        {t("Submit Interest")}
      </button>
    </div>
  );
}

function TicketConfirmScreen({ contactMethod }: { contactMethod: string }) {
  const { t } = useV2Language();

  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>{t("Interest Submitted")}</h2>
      <p>{t("A Jets representative will follow up using the fan's preferred method: {method}.", { method: t(contactMethod) })}</p>
    </div>
  );
}

function FeedbackStartScreen({ onFound, onMissing }: { onFound: () => void; onMissing: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Team Store")}
        title={t("Did You Find the Merchandise You Were Looking For?")}
        copy={t("Tell us what worked and where we can help.")}
      />
      <div className="dual-choice">
        <button onClick={onFound}>
          <ThumbsUp />
          <strong>{t("Yes")}</strong>
          <span>{t("I found what I wanted")}</span>
        </button>
        <button onClick={onMissing}>
          <Search />
          <strong>{t("No")}</strong>
          <span>{t("Help identify what was missing")}</span>
        </button>
      </div>
    </div>
  );
}

function LostDemandScreen({
  product,
  size,
  onProduct,
  onSize,
  onNext,
}: {
  product: Product | null;
  size: string;
  onProduct: (product: Product) => void;
  onSize: (size: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Merchandise search")}
        title={t("What Were You Looking For?")}
        copy={t("Choose the closest match, then tell us the size you needed.")}
      />
      <div className="lost-product-grid">
        {lostDemandProducts.map((candidate) => (
          <button
            key={candidate.id}
            className={product?.id === candidate.id ? "selected" : ""}
            onClick={() => onProduct(candidate)}
            aria-pressed={product?.id === candidate.id}
          >
            <img src={candidate.image} alt={candidate.name} />
            <span>{candidate.name}</span>
          </button>
        ))}
      </div>
      <div className="segmented">
        {["XS", "S", "M", "L", "XL", "XXL"].map((candidateSize) => (
          <button
            key={candidateSize}
            className={size === candidateSize ? "selected" : ""}
            onClick={() => onSize(candidateSize)}
            aria-pressed={size === candidateSize}
          >
            {candidateSize}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!product || !size} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function ExperienceScreen({
  reason,
  onReason,
  onNext,
}: {
  reason: string;
  onReason: (reason: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();
  const reasons = [
    "The checkout line was too long.",
    "The store was too crowded.",
    "I needed help but could not find an associate.",
    "I could not find the product or size I wanted.",
    "The merchandise selection was limited.",
    "Other.",
  ];

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Shopping experience")}
        title={t("Did We Make Shopping Easy?")}
        copy={t("Let us know what would have made your visit better.")}
      />
      <div className="reason-list">
        {reasons.map((candidate) => (
          <button
            key={candidate}
            className={reason === candidate ? "selected" : ""}
            onClick={() => onReason(candidate)}
            aria-pressed={reason === candidate}
          >
            {t(candidate)}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!reason} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function AssociateScreen({
  associateHelp,
  onAssociateHelp,
  onComplete,
}: {
  associateHelp: string;
  onAssociateHelp: (value: string) => void;
  onComplete: () => void;
}) {
  const { t } = useV2Language();
  const options = ["Satisfied with assistance", "No associate was available", "Not satisfied with assistance"];

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Associate interaction")}
        title={t("Did You Interact with a Store Associate?")}
        copy={t("Your feedback helps us deliver better game day service.")}
      />
      <div className="option-list">
        {options.map((option) => {
          const isSelected = associateHelp === option;

          return (
            <button
              key={option}
              className={isSelected ? "option-row selected" : "option-row"}
              onClick={() => onAssociateHelp(option)}
              aria-pressed={isSelected}
            >
              <Users />
              <span>{t(option)}</span>
              <SelectionMark selected={isSelected} />
            </button>
          );
        })}
      </div>
      <button className="primary-action bottom-action" disabled={!associateHelp} onClick={onComplete}>
        {t("Submit Feedback")}
      </button>
    </div>
  );
}

function FeedbackConfirmScreen({
  product,
  size,
  reason,
  associateHelp,
}: {
  product: Product | null;
  size: string;
  reason: string;
  associateHelp: string;
}) {
  const { t } = useV2Language();

  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>{t("Thank You")}</h2>
      <p>{t("Your feedback helps the Jets improve merchandise availability and the gameday store experience.")}</p>
      <div className="confirm-card">
        <Row label={t("Missing item")} value={product?.name ?? t("Not provided")} />
        <Row label={t("Requested size")} value={size} />
        <Row label={t("Experience issue")} value={reason ? t(reason) : ""} />
        <Row label={t("Associate response")} value={associateHelp ? t(associateHelp) : ""} />
      </div>
    </div>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span className="selection-mark" aria-hidden="true">
      {selected ? <Check size={24} strokeWidth={3} /> : null}
    </span>
  );
}

function ScreenHeader({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <header className="screen-header">
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </header>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "row strong" : "row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
