const OUTBOX_KEY = "jibe-jets-stadium-orders-outbox-v2";
const ORDERS_API_URL = "https://ny-jets-retail-orders-v2.vercel.app/api/orders";
const DELIVERY_TIMEOUT_MS = 10000;

export type StadiumOrderService = "concierge" | "suite";
export type StadiumOrderStatus = "new" | "preparing" | "ready" | "out-for-delivery" | "fulfilled";

export type StadiumOrderItem = {
  id: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type StadiumOrder = {
  version: 1;
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  kioskId: string;
  service: StadiumOrderService;
  status: StadiumOrderStatus;
  customer: {
    name: string;
    phone: string;
  };
  fulfillment: {
    location: string;
    instructions: string;
  };
  items: StadiumOrderItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
};

export type StadiumOrderDeliveryResult = "delivered" | "queued";

function readOutbox() {
  try {
    const value = window.localStorage.getItem(OUTBOX_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as StadiumOrder[] : [];
  } catch {
    return [];
  }
}

function writeOutbox(orders: StadiumOrder[]) {
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(orders));
  } catch {
    // The active kiosk flow still proceeds if storage is unavailable.
  }
}

function queueOrder(order: StadiumOrder) {
  const queued = readOutbox();
  const existingIndex = queued.findIndex((item) => item.id === order.id);

  if (existingIndex >= 0) queued[existingIndex] = order;
  else queued.push(order);

  writeOutbox(queued);
}

function removeQueuedOrder(orderId: string) {
  writeOutbox(readOutbox().filter((order) => order.id !== orderId));
}

async function sendOrder(order: StadiumOrder) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(ORDERS_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order }),
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });

    // A deleted order should not remain in the kiosk retry queue forever.
    return response.ok || response.status === 410;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

let flushPromise: Promise<void> | null = null;

export async function submitStadiumOrder(order: StadiumOrder): Promise<StadiumOrderDeliveryResult> {
  queueOrder(order);
  const delivered = await sendOrder(order);

  if (delivered) removeQueuedOrder(order.id);
  return delivered ? "delivered" : "queued";
}

export function flushQueuedStadiumOrders() {
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    const queued = readOutbox();

    for (const order of queued) {
      const delivered = await sendOrder(order);
      if (!delivered) break;
      removeQueuedOrder(order.id);
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}
