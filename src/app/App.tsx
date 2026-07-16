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
  CreditCard,
  Grid3X3,
  Home,
  MapPin,
  PackageCheck,
  QrCode,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logoSrc from "../imports/new-york-jets-logo-0-1.png";
import heroVideo from "../imports/grok-video-9e94842e-7a91-4f32-8ace-1e4f9bb82a22.mp4";
import fieldVideo from "../imports/grok-video-67c07eb1-53de-4b2d-bf02-0ebcdcc7e644.mp4";
import shopCatalogData from "../data/jets-shop-catalog.json";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1920;
const jetsGreen = "#125740";
const ticketUrl = "https://www.newyorkjets.com/tickets/season-tickets/";

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
  | "mobile"
  | "payment"
  | "confirmation"
  | "inventory-error"
  | "payment-error"
  | "assist-code"
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
    title: "Concierge Merchandise Pickup",
    description: "Shop Jets gear now and pick it up at a nearby merchandise desk.",
    action: "Start Pickup Order",
    Icon: PackageCheck,
  },
  {
    flow: "suite",
    eyebrow: "Premium service",
    title: "Suite Delivery",
    description: "Send paid merchandise directly to your suite during the game.",
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

function flowTitle(flow: Flow | null) {
  if (flow === "concierge") return "Concierge Merchandise Pickup";
  if (flow === "suite") return "Suite Delivery";
  if (flow === "ship") return "Ship-to-Home Ordering";
  if (flow === "tickets") return "Season-Ticket Interest";
  if (flow === "feedback") return "Team-Store Feedback";
  return "Jets Retail Kiosk";
}

function fulfillmentLabel(flow: MerchFlow | null) {
  if (flow === "suite") return "Delivery to suite";
  if (flow === "ship") return "Ship to home";
  return "Pickup at stadium desk";
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
  const [selectedSize, setSelectedSize] = useState("XL");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(pickupLocations[0]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [textConsent, setTextConsent] = useState(true);
  const [ticketContactMethod, setTicketContactMethod] = useState("Text me");
  const [lostProduct, setLostProduct] = useState(lostDemandProducts[0]);
  const [lostSize, setLostSize] = useState("M");
  const [feedbackReason, setFeedbackReason] = useState("The checkout line was too long.");
  const [associateHelp, setAssociateHelp] = useState("No associate was available");
  const [confirmationId, setConfirmationId] = useState(buildOrderId(null));

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
    setSelectedSize("XL");
    setQuantity(1);
  };

  const startFlow = (flow: Flow) => {
    setActiveFlow(flow);
    setCart([]);
    setQuantity(1);
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
    else if (screen === "mobile") setScreen("fulfillment");
    else if (screen === "payment") setScreen("mobile");
    else if (screen === "inventory-error") setScreen("detail");
    else if (screen === "payment-error") setScreen("payment");
    else if (screen === "assist-code") setScreen("payment-error");
    else if (screen === "confirmation") setScreen("payment");
    else if (screen === "ticket-lead" || screen === "ticket-qr") setScreen("ticket-start");
    else if (screen === "ticket-confirm") setScreen("ticket-lead");
    else if (screen === "lost-demand") setScreen("feedback-start");
    else if (screen === "experience") setScreen("lost-demand");
    else if (screen === "associate") setScreen("experience");
    else if (screen === "feedback-confirm") setScreen("associate");
  };

  const addProductToCart = () => {
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
    const firstAvailableSize = product.sizes.find((size) => product.inventory[size] > 0) ?? product.sizes[0];
    setSelectedSize(firstAvailableSize);
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
            onNext={() => setScreen("mobile")}
          />
        );
      case "mobile":
        return (
          <MobileConsentScreen
            activeFlow={merchFlow}
            mobileNumber={mobileNumber}
            textConsent={textConsent}
            onNumberChange={setMobileNumber}
            onConsentChange={setTextConsent}
            onNext={() => setScreen("payment")}
          />
        );
      case "payment":
        return (
          <PaymentScreen
            activeFlow={merchFlow}
            total={total}
            orderId={orderId}
            onComplete={() => setScreen("confirmation")}
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
      case "payment-error":
        return <PaymentErrorScreen onRetry={() => setScreen("payment")} onAssist={() => setScreen("assist-code")} />;
      case "assist-code":
        return <AssistCodeScreen orderId={orderId} onDone={() => setScreen("confirmation")} />;
      case "confirmation":
        return (
          <ConfirmationScreen
            activeFlow={merchFlow}
            orderId={orderId}
            selectedLocation={selectedLocation}
            mobileNumber={mobileNumber}
            total={total}
            onClose={goHome}
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
            onHome={goHome}
          >
            {renderContent()}
          </KioskFrame>
        </div>
      </div>
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
  const isHome = screen === "home";
  const background = isHome ? heroVideo : fieldVideo;

  return (
    <div className={isHome ? "kiosk-frame home-mode" : "kiosk-frame"}>
      <video className="kiosk-video" autoPlay loop muted playsInline>
        <source src={background} type="video/mp4" />
      </video>
      <div className="kiosk-scrim" />
      {!isHome && (
        <div className="top-nav">
          <button className="round-button" onClick={onBack} aria-label="Back">
            <ArrowLeft />
          </button>
          <div className="nav-title">
            <img src={logoSrc} alt="New York Jets" />
            <span>{flowTitle(activeFlow)}</span>
          </div>
          <button className="round-button" onClick={onHome} aria-label="Home">
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
  return (
    <>
      <section className="home-hero">
        <img src={logoSrc} alt="New York Jets" />
        <div className="home-venue">
          <MapPin size={28} />
          <span>MetLife Stadium</span>
        </div>
        <p className="kicker">Jets Game Day</p>
        <h1>
          <span>Elevate Your Jets</span>
          <span>Game Day</span>
        </h1>
        <p>Shop smarter, enjoy premium service, and get more from every moment at MetLife Stadium.</p>
      </section>
      <section className="home-services" aria-label="Choose a Jets game day service">
        <header>
          <strong>What would you like to do?</strong>
        </header>
        <div className="home-service-menu">
          {flowCards.map(({ flow, eyebrow, title, description, action, Icon }) => (
            <button key={flow} className={`home-service-option service-${flow}`} onClick={() => onStart(flow)}>
              <div className="service-icon">
                <Icon size={48} />
              </div>
              <div className="service-copy">
                <span>{eyebrow}</span>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
              <div className="service-action">
                <span>{action}</span>
                <ChevronRight size={34} />
              </div>
            </button>
          ))}
        </div>
      </section>
      <div className="home-footer-strip">
        <BadgeCheck size={26} />
        <span>Official New York Jets game day services</span>
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
  const featured = Object.fromEntries(
    categories.map((category) => [
      category.id,
      products.find((product) => product.categories.includes(category.id) && product.categories.length === 1)?.image ??
        products.find((product) => product.categories.includes(category.id))?.image ??
        products[0].image,
    ]),
  ) as Record<ProductCategory, string>;

  return (
    <div className="content-stack category-screen">
      <ScreenHeader
        kicker={fulfillmentLabel(activeFlow)}
        title="Find Your Jets Gear"
        copy="Featured categories and every Jets Shop department."
      />
      <div className="catalog-toolbar">
        <div className="catalog-ready">
          <BadgeCheck />
          <div>
            <strong>{shopCatalog.catalogProductCount.toLocaleString()} products</strong>
            <span>Ready to browse</span>
          </div>
        </div>
        <div className="catalog-toolbar-actions">
          <div className="catalog-cart-count" aria-label={`${cartCount} items in basket`}>
            <ShoppingCart />
            <span>{cartCount}</span>
          </div>
          <button className="departments-button" onClick={onAllDepartments}>
            <Grid3X3 />
            <span>All Departments</span>
            <small>{shopCatalog.departments.length}</small>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <button key={category.id} className="category-card" onClick={() => onSelectCategory(category.id)}>
            <img src={featured[category.id]} alt={category.label} />
            <span>{category.label}</span>
            <small>{products.filter((product) => product.categories.includes(category.id)).length.toLocaleString()} items</small>
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
  return (
    <div className="content-stack departments-screen">
      <ScreenHeader
        kicker="All Departments"
        title="Shop Every Department"
        copy="All Jets Shop categories in one place."
      />
      <div className="department-grid">
        {departments.map((department) => {
          const availableCount = products.filter((product) => product.departments.includes(department.id)).length;
          const featuredProduct = products.find((product) => product.departments.includes(department.id));
          return (
            <button key={department.id} className="department-card" onClick={() => onSelectDepartment(department)}>
              {featuredProduct && <img src={featuredProduct.image} alt="" />}
              <div>
                <strong>{department.label}</strong>
                <span>{availableCount.toLocaleString()} items</span>
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
  const title = department?.label ?? categoryLabels[category];
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
        kicker="Browse merchandise"
        title={title}
        copy={`${productList.length.toLocaleString()} products available to browse.`}
      />
      <div className="catalog-controls">
        <label className="search-bar">
          <Search size={30} />
          <input
            type="search"
            aria-label={`Search ${title}`}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player, product, brand or style"
          />
          <span>{filteredProducts.length.toLocaleString()}</span>
        </label>
        <div className="page-controls" aria-label="Catalog pages">
          <button
            aria-label="Previous product page"
            disabled={page === 0}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          >
            <ChevronLeft />
          </button>
          <span>{page + 1} / {pageCount}</span>
          <button
            aria-label="Next product page"
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
              {product.badges?.[0] && <small className="product-badge">{product.badges[0]}</small>}
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
            <strong>No matching products</strong>
            <span>Try a player name, product type, brand or style.</span>
          </div>
        )}
      </div>
      <div className="product-actions">
        <button className="secondary-action" onClick={onBackToSelection}>
          Back to Selection
        </button>
        <button className="primary-action" onClick={onBasket}>
          Review Basket
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
  return (
    <div className="detail-layout">
      <img className="detail-image" src={product.image} alt={product.name} />
      <section className="detail-panel">
        <p className="kicker">{product.style}</p>
        <h2>{product.name}</h2>
        <div className="price-row">
          <strong>{product.priceDisplay ?? formatPrice(product.price)}</strong>
          <span>{product.genderFit}</span>
        </div>
        <div className="size-grid">
          {product.sizes.map((size) => {
            const available = product.inventory[size] > 0;
            return (
              <button
                key={size}
                className={size === selectedSize ? "size-chip selected" : "size-chip"}
                onClick={() => onSelectSize(size)}
              >
                <span>{size}</span>
                <small>{available ? "Available" : "Unavailable"}</small>
              </button>
            );
          })}
        </div>
        <div className="detail-controls">
          <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => onQuantityChange(Math.min(9, quantity + 1))}>+</button>
        </div>
        <div className="inventory-panel">
          <BadgeCheck />
          <div>
            <strong>Selection confirmed</strong>
            <span>
              Size {selectedSize} · {fulfillmentLabel(activeFlow)}.
            </span>
          </div>
        </div>
        <button className="primary-action" onClick={onAdd}>
          Add to Basket
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
  return (
    <div className="content-stack basket-screen">
      <ScreenHeader
        kicker="Review order"
        title="Your Basket"
        copy="Review your items and fulfillment details before payment."
      />
      <div className="basket-list">
        {cart.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={56} />
            <strong>No items yet</strong>
            <span>Add merchandise to build this order.</span>
          </div>
        ) : (
          cart.map((line, index) => (
            <div key={`${line.product.id}-${line.size}-${index}`} className="basket-line">
              <img src={line.product.image} alt={line.product.name} />
              <div>
                <strong>{line.product.name}</strong>
                <span>
                  Size {line.size} · Qty {line.quantity} · {fulfillmentLabel(activeFlow)}
                </span>
                <small>Ready for checkout</small>
              </div>
              <button onClick={() => onRemove(index)}>Remove</button>
            </div>
          ))
        )}
      </div>
      <div className="totals-panel">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        <Row label="Shipping / delivery" value={deliveryFee ? formatPrice(deliveryFee) : "Included"} />
        <Row label="Estimated tax" value={formatPrice(subtotal * 0.06625)} />
        <Row label="Total due at kiosk" value={formatPrice(total)} strong />
      </div>
      <div className="dual-actions">
        <button className="secondary-action" onClick={onContinueShopping}>
          Add More
        </button>
        <button className="primary-action" disabled={!cart.length} onClick={onNext}>
          Continue
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
  const options =
    activeFlow === "suite"
      ? suiteLocations
      : activeFlow === "ship"
        ? ["Use saved address", "Enter address on kiosk", "Secure phone address entry"]
        : pickupLocations;

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Fulfillment"
        title={
          activeFlow === "suite"
            ? "Confirm Suite Delivery"
            : activeFlow === "ship"
              ? "Choose Shipping Details"
              : "Choose Pickup Location"
        }
        copy={
          activeFlow === "ship"
            ? "Choose how you would like to provide a secure shipping address."
            : "Choose the most convenient location for your order."
        }
      />
      <div className="option-list">
        {options.map((option) => (
          <button
            key={option}
            className={selectedLocation === option ? "option-row selected" : "option-row"}
            onClick={() => onSelectLocation(option)}
          >
            <MapPin />
            <span>{option}</span>
            <Check />
          </button>
        ))}
      </div>
      {activeFlow === "ship" && (
        <div className="info-panel">
          <Truck />
          <div>
            <strong>Estimated delivery: 3-5 business days</strong>
            <span>Shipping cost and delivery window are displayed before payment.</span>
          </div>
        </div>
      )}
      <button className="primary-action bottom-action" onClick={onNext}>
        Continue
      </button>
    </div>
  );
}

function MobileConsentScreen({
  activeFlow,
  mobileNumber,
  textConsent,
  onNumberChange,
  onConsentChange,
  onNext,
}: {
  activeFlow: MerchFlow | null;
  mobileNumber: string;
  textConsent: boolean;
  onNumberChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Notifications"
        title="Where Should We Text Updates?"
        copy={
          activeFlow === "ship"
            ? "We will send your receipt now and tracking details when your order ships."
            : "We will text you as soon as your order is ready."
        }
      />
      <div className="phone-panel">
        <Smartphone size={72} />
        <label>
          Mobile number
          <input
            type="tel"
            value={mobileNumber}
            onChange={(event) => onNumberChange(event.target.value)}
            placeholder="(201) 555-0123"
          />
        </label>
      </div>
      <button className={textConsent ? "consent-card selected" : "consent-card"} onClick={() => onConsentChange(!textConsent)}>
        <Check />
        <span>
          I agree to receive order updates by text message from New York Jets game day retail.
          Message and data rates may apply.
        </span>
      </button>
      <button className="primary-action bottom-action" disabled={!textConsent || !mobileNumber.trim()} onClick={onNext}>
        Continue to Payment
      </button>
    </div>
  );
}

function PaymentScreen({
  activeFlow,
  total,
  orderId,
  onComplete,
}: {
  activeFlow: MerchFlow | null;
  total: number;
  orderId: string;
  onComplete: () => void;
}) {
  const receiptUrl = `${window.location.origin}${window.location.pathname}?order=${orderId}`;

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Kiosk payment"
        title="Tap or Insert Card"
        copy="Use the payment terminal below to securely complete your order."
      />
      <div className="payment-card">
        <CreditCard size={96} />
        <strong>{formatPrice(total)}</strong>
        <span>{fulfillmentLabel(activeFlow)} · Order {orderId}</span>
      </div>
      <div className="qr-status">
        <QRCodeSVG value={receiptUrl} size={170} bgColor="#ffffff" fgColor={jetsGreen} />
        <div>
          <strong>Receipt and order status</strong>
          <span>Scan after payment to keep your order details.</span>
        </div>
      </div>
      <button className="primary-action" onClick={onComplete}>
        Pay {formatPrice(total)}
      </button>
    </div>
  );
}

function ConfirmationScreen({
  activeFlow,
  orderId,
  selectedLocation,
  mobileNumber,
  total,
  onClose,
}: {
  activeFlow: MerchFlow | null;
  orderId: string;
  selectedLocation: string;
  mobileNumber: string;
  total: number;
  onClose: () => void;
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  useEffect(() => {
    const startedAt = Date.now();
    const countdown = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setSecondsRemaining(Math.max(0, 10 - elapsedSeconds));
    }, 250);
    const reset = window.setTimeout(onClose, 10_000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(reset);
    };
  }, [onClose]);

  const message =
    activeFlow === "suite"
      ? `Your order is paid and will be delivered to ${selectedLocation} by stadium personnel.`
      : activeFlow === "ship"
        ? "Your order is confirmed and will be packed for shipment."
        : `Your order is being prepared and will be available at the ${selectedLocation}.`;

  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>Order Confirmed</h2>
      <p>{message}</p>
      <div className="confirm-card">
        <Row label="Order number" value={orderId} strong />
        <Row label="Total paid" value={formatPrice(total)} />
        <Row label="Text updates" value={mobileNumber} />
        <Row label="Estimated ready time" value={activeFlow === "ship" ? "Tracking sent when packed" : "18-22 minutes"} />
      </div>
      <div className="confirmation-exit">
        <span>Returning to the start in {secondsRemaining} seconds</span>
        <button className="primary-action" onClick={onClose}>Close</button>
      </div>
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
        kicker="Inventory issue"
        title="Size Unavailable"
        copy={`${product.name} is unavailable in one requested size. The kiosk blocks checkout and offers alternatives before payment.`}
      />
      <div className="alert-panel">
        <AlertTriangle size={72} />
        <div>
          <strong>Unable to reserve selected item</strong>
          <span>Size M now shows 0 available at this location.</span>
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
        Back to Basket
      </button>
    </div>
  );
}

function PaymentErrorScreen({ onRetry, onAssist }: { onRetry: () => void; onAssist: () => void }) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Payment issue"
        title="Payment Not Approved"
        copy="The order is preserved for a quick retry. Assisted checkout is available as a fallback."
      />
      <div className="alert-panel">
        <CreditCard size={72} />
        <div>
          <strong>Card reader declined the transaction</strong>
          <span>No payment was captured. Inventory hold remains active for 6 minutes.</span>
        </div>
      </div>
      <button className="primary-action" onClick={onRetry}>
        Try Payment Again
      </button>
      <button className="secondary-action" onClick={onAssist}>
        Generate Assisted Checkout Code
      </button>
    </div>
  );
}

function AssistCodeScreen({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Need help?"
        title="Assisted Checkout Code"
        copy="The fan presents this code at a concierge or merchandise desk. An associate accepts payment and submits the order."
      />
      <div className="code-card">
        <span>{orderId.replace("JETS", "DN")}</span>
        <QRCodeSVG value={`assisted-checkout:${orderId}`} size={230} bgColor="#ffffff" fgColor={jetsGreen} />
      </div>
      <button className="primary-action bottom-action" onClick={onDone}>
        Complete Order
      </button>
    </div>
  );
}

function TicketStartScreen({ onLead, onQr }: { onLead: () => void; onQr: () => void }) {
  return (
    <div className="content-stack ticket-screen">
      <ScreenHeader
        kicker="Jets official ticketing"
        title="Interested in Becoming a Season-Ticket Holder?"
        copy="Explore season-ticket opportunities or ask a Jets representative to contact you."
      />
      <button className="big-choice" onClick={onQr}>
        <Ticket />
        <span>View season-ticket opportunities</span>
        <ChevronRight />
      </button>
      <button className="big-choice" onClick={onLead}>
        <Users />
        <span>Request contact from a Jets representative</span>
        <ChevronRight />
      </button>
    </div>
  );
}

function TicketQrScreen({ onLead }: { onLead: () => void }) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Season tickets"
        title="Scan to View Official Jets Options"
        copy="Fans can continue on the Jets approved ticketing experience or request follow-up."
      />
      <div className="large-qr-card">
        <QRCodeSVG value={ticketUrl} size={360} bgColor="#ffffff" fgColor={jetsGreen} />
        <span>newyorkjets.com/tickets/season-tickets</span>
      </div>
      <button className="primary-action bottom-action" onClick={onLead}>
        Request Contact Instead
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
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const hasPreferredContact = contactMethod === "Email me" ? email.trim() : mobile.trim();
  const canSubmit = Boolean(name.trim() && hasPreferredContact);

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Season tickets"
        title="How Should the Jets Follow Up?"
        copy="Share your contact information and choose your preferred response."
      />
      <div className="lead-form">
        <label>
          Name
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
        </label>
        <label>
          Mobile
          <input
            type="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="Mobile number"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
          />
        </label>
      </div>
      <div className="segmented">
        {["Text me", "Email me", "Call me"].map((method) => (
          <button
            key={method}
            className={contactMethod === method ? "selected" : ""}
            onClick={() => onContactMethod(method)}
          >
            {method}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!canSubmit} onClick={onSubmit}>
        Submit Interest
      </button>
    </div>
  );
}

function TicketConfirmScreen({ contactMethod }: { contactMethod: string }) {
  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>Interest Submitted</h2>
      <p>A Jets representative will follow up using the fan's preferred method: {contactMethod}.</p>
    </div>
  );
}

function FeedbackStartScreen({ onFound, onMissing }: { onFound: () => void; onMissing: () => void }) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Team Store"
        title="Did You Find the Merchandise You Were Looking For?"
        copy="Tell us what worked and where we can help."
      />
      <div className="dual-choice">
        <button onClick={onFound}>
          <Check />
          <strong>Yes</strong>
          <span>I found what I wanted</span>
        </button>
        <button onClick={onMissing}>
          <Search />
          <strong>No</strong>
          <span>Help identify what was missing</span>
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
  product: Product;
  size: string;
  onProduct: (product: Product) => void;
  onSize: (size: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Merchandise search"
        title="What Were You Looking For?"
        copy="Choose the closest match, then tell us the size you needed."
      />
      <div className="lost-product-grid">
        {lostDemandProducts.map((candidate) => (
          <button
            key={candidate.id}
            className={product.id === candidate.id ? "selected" : ""}
            onClick={() => onProduct(candidate)}
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
          >
            {candidateSize}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" onClick={onNext}>
        Continue
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
        kicker="Shopping experience"
        title="Did We Make Shopping Easy?"
        copy="Let us know what would have made your visit better."
      />
      <div className="reason-list">
        {reasons.map((candidate) => (
          <button key={candidate} className={reason === candidate ? "selected" : ""} onClick={() => onReason(candidate)}>
            {candidate}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" onClick={onNext}>
        Continue
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
  const options = ["Satisfied with assistance", "No associate was available", "Not satisfied with assistance"];

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker="Associate interaction"
        title="Did You Interact with a Store Associate?"
        copy="Your feedback helps us deliver better game day service."
      />
      <div className="option-list">
        {options.map((option) => (
          <button
            key={option}
            className={associateHelp === option ? "option-row selected" : "option-row"}
            onClick={() => onAssociateHelp(option)}
          >
            <Users />
            <span>{option}</span>
            <Check />
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" onClick={onComplete}>
        Submit Feedback
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
  product: Product;
  size: string;
  reason: string;
  associateHelp: string;
}) {
  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>Thank You</h2>
      <p>Your feedback helps the Jets improve merchandise availability and the gameday store experience.</p>
      <div className="confirm-card">
        <Row label="Missing item" value={product.name} />
        <Row label="Requested size" value={size} />
        <Row label="Experience issue" value={reason} />
        <Row label="Associate response" value={associateHelp} />
      </div>
    </div>
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
