import { Peer, type DataConnection } from "peerjs";

export const STADIUM_ORDERS_CHANNEL = "jets-stadium-orders-v2";
export const STADIUM_ORDERS_DASHBOARD_PEER_ID = "jibe-jets-stadium-orders-v2";

const OUTBOX_KEY = "jibe-jets-stadium-orders-outbox-v2";
const DELIVERY_TIMEOUT_MS = 5500;

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

type StadiumOrderCreatedMessage = {
  type: "stadium-order-created";
  channel: typeof STADIUM_ORDERS_CHANNEL;
  order: StadiumOrder;
};

type StadiumOrderAcceptedMessage = {
  type: "stadium-order-accepted";
  channel: typeof STADIUM_ORDERS_CHANNEL;
  orderId: string;
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

function isAcceptedMessage(value: unknown, orderId: string): value is StadiumOrderAcceptedMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<StadiumOrderAcceptedMessage>;
  return message.type === "stadium-order-accepted"
    && message.channel === STADIUM_ORDERS_CHANNEL
    && message.orderId === orderId;
}

function sendOrder(order: StadiumOrder) {
  return new Promise<boolean>((resolve) => {
    const peer = new Peer({ debug: 1 });
    let connection: DataConnection | null = null;
    let settled = false;

    const finish = (delivered: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      connection?.close();
      peer.destroy();
      resolve(delivered);
    };

    const timeoutId = window.setTimeout(() => finish(false), DELIVERY_TIMEOUT_MS);

    peer.on("open", () => {
      connection = peer.connect(STADIUM_ORDERS_DASHBOARD_PEER_ID, {
        reliable: true,
        serialization: "json",
        metadata: { channel: STADIUM_ORDERS_CHANNEL },
      });

      connection.on("open", () => {
        const message: StadiumOrderCreatedMessage = {
          type: "stadium-order-created",
          channel: STADIUM_ORDERS_CHANNEL,
          order,
        };
        connection?.send(message);
      });

      connection.on("data", (message) => {
        if (isAcceptedMessage(message, order.id)) finish(true);
      });

      connection.on("error", () => finish(false));
    });

    peer.on("error", () => finish(false));
  });
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
