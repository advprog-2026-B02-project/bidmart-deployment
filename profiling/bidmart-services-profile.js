import http from "k6/http";
import { check, group, sleep } from "k6";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const DURATION = __ENV.DURATION || "5m";
const STRICT = (__ENV.STRICT || "false").toLowerCase() === "true";

const AUTH_URL = __ENV.AUTH_URL || "http://auth-service:8081";
const BIDDING_URL = __ENV.BIDDING_URL || "http://bidding-service:8082";
const CATALOG_URL = __ENV.CATALOG_URL || "http://catalog-service:8083";
const WALLET_URL = __ENV.WALLET_URL || "http://wallet-service:8084";
const ORDER_URL = __ENV.ORDER_URL || "http://order-service:8085";
const NOTIFICATION_URL = __ENV.NOTIFICATION_URL || "http://notification-service:8086";
const FRONTEND_URL = __ENV.FRONTEND_URL || "http://frontend:3000";

const USER_ID = __ENV.USER_ID || "00000000-0000-4000-8000-000000000001";
const LISTING_ID = __ENV.LISTING_ID;
const AUCTION_ID = __ENV.AUCTION_ID;
const ORDER_ID = __ENV.ORDER_ID;
const JWT_TOKEN = __ENV.JWT_TOKEN;
const AUTH_EMAIL = __ENV.AUTH_EMAIL;
const AUTH_PASSWORD = __ENV.AUTH_PASSWORD;
const SESSION_COOKIE = __ENV.BIDMART_SESSION;

export const options = {
  scenarios: {
    auth: {
      executor: "constant-vus",
      exec: "authProfile",
      vus: Number(__ENV.AUTH_VUS || 3),
      duration: DURATION,
      tags: { service: "auth" },
    },
    catalog: {
      executor: "constant-vus",
      exec: "catalogProfile",
      vus: Number(__ENV.CATALOG_VUS || 10),
      duration: DURATION,
      tags: { service: "catalog" },
    },
    bidding: {
      executor: "constant-vus",
      exec: "biddingProfile",
      vus: Number(__ENV.BIDDING_VUS || 5),
      duration: DURATION,
      tags: { service: "bidding" },
    },
    wallet: {
      executor: "constant-vus",
      exec: "walletProfile",
      vus: Number(__ENV.WALLET_VUS || 5),
      duration: DURATION,
      tags: { service: "wallet" },
    },
    order: {
      executor: "constant-vus",
      exec: "orderProfile",
      vus: Number(__ENV.ORDER_VUS || 5),
      duration: DURATION,
      tags: { service: "order" },
    },
    notification: {
      executor: "constant-vus",
      exec: "notificationProfile",
      vus: Number(__ENV.NOTIFICATION_VUS || 5),
      duration: DURATION,
      tags: { service: "notification" },
    },
    frontend: {
      executor: "constant-vus",
      exec: "frontendProfile",
      vus: Number(__ENV.FRONTEND_VUS || 5),
      duration: DURATION,
      tags: { service: "frontend" },
    },
  },
  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.05"],
    "http_req_duration{service:auth}": ["p(95)<1500"],
    "http_req_duration{service:catalog}": ["p(95)<1500"],
    "http_req_duration{service:bidding}": ["p(95)<1500"],
    "http_req_duration{service:wallet}": ["p(95)<1500"],
    "http_req_duration{service:order}": ["p(95)<1500"],
    "http_req_duration{service:notification}": ["p(95)<1500"],
    "http_req_duration{service:frontend}": ["p(95)<2000"],
  },
};

export function authProfile() {
  group("auth", () => {
    request("GET", `${AUTH_URL}/health`, null, null, "auth", "health", [200]);

    if (AUTH_EMAIL && AUTH_PASSWORD) {
      request(
        "POST",
        `${AUTH_URL}/api/auth/login`,
        JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
        jsonParams(),
        "auth",
        "login",
        [200]
      );
    }
  });

  sleep(1);
}

export function catalogProfile() {
  group("catalog", () => {
    request("GET", `${CATALOG_URL}/catalog?page=0&size=20`, null, null, "catalog", "browse", [200]);

    if (LISTING_ID) {
      request("GET", `${CATALOG_URL}/listings/${LISTING_ID}`, null, null, "catalog", "detail", [200]);
    }
  });

  sleep(1);
}

export function biddingProfile() {
  group("bidding", () => {
    const params = userHeaderParams();
    request("GET", `${BIDDING_URL}/auctions/my-bids?page=0&size=20`, null, params, "bidding", "my-bids", [200]);

    if (LISTING_ID) {
      request("GET", `${BIDDING_URL}/auctions/listings/${LISTING_ID}`, null, null, "bidding", "listing", [200]);
    }

    if (AUCTION_ID) {
      request("GET", `${BIDDING_URL}/auctions/${AUCTION_ID}`, null, null, "bidding", "auction", [200]);
      request("GET", `${BIDDING_URL}/auctions/${AUCTION_ID}/bids?page=0&size=20`, null, null, "bidding", "bids", [200]);
      request("GET", `${BIDDING_URL}/auctions/${AUCTION_ID}/result`, null, null, "bidding", "result", [200]);
    }
  });

  sleep(1);
}

export function walletProfile() {
  group("wallet", () => {
    request("GET", `${WALLET_URL}/actuator/health`, null, null, "wallet", "health", [200]);

    if (JWT_TOKEN) {
      const params = bearerParams();
      request("GET", `${WALLET_URL}/api/v1/wallet/me`, null, params, "wallet", "summary", [200]);
      request("GET", `${WALLET_URL}/api/v1/wallet/me/transactions?page=0&size=20`, null, params, "wallet", "transactions", [200]);
    }
  });

  sleep(1);
}

export function orderProfile() {
  group("order", () => {
    const params = userHeaderParams();
    request("GET", `${ORDER_URL}/api/v1/orders?role=BUYER&page=0&size=20`, null, params, "order", "buyer-list", [200]);
    request("GET", `${ORDER_URL}/api/v1/orders?role=SELLER&page=0&size=20`, null, params, "order", "seller-list", [200]);

    if (ORDER_ID) {
      request("GET", `${ORDER_URL}/api/v1/orders/${ORDER_ID}`, null, params, "order", "detail", [200]);
    }
  });

  sleep(1);
}

export function notificationProfile() {
  group("notification", () => {
    const params = userHeaderParams();
    request("GET", `${NOTIFICATION_URL}/api/v1/notifications?page=0&size=20`, null, params, "notification", "list", [200]);
    request("GET", `${NOTIFICATION_URL}/api/v1/notifications/preferences`, null, params, "notification", "preferences", [200]);
  });

  sleep(1);
}

export function frontendProfile() {
  group("frontend", () => {
    request("GET", `${FRONTEND_URL}/login`, null, null, "frontend", "login-page", [200]);
    request("GET", `${FRONTEND_URL}/register`, null, null, "frontend", "register-page", [200]);

    if (SESSION_COOKIE) {
      const params = { headers: { Cookie: `bidmart_session=${SESSION_COOKIE}` } };
      request("GET", `${FRONTEND_URL}/catalog`, null, params, "frontend", "catalog-page", [200]);
      request("GET", `${FRONTEND_URL}/orders`, null, params, "frontend", "orders-page", [200]);
    }
  });

  sleep(1);
}

function request(method, url, body, params, service, name, strictStatuses) {
  const requestParams = params || {};
  requestParams.tags = Object.assign({}, requestParams.tags || {}, {
    service,
    name,
  });

  const response = http.request(method, url, body, requestParams);
  const labels = {};

  labels[`${service} ${name} no 5xx`] = (r) => r.status < 500;
  if (STRICT) {
    labels[`${service} ${name} strict status`] = (r) => strictStatuses.includes(r.status);
  }

  check(response, labels);
  return response;
}

function jsonParams(extraHeaders = {}) {
  return {
    headers: Object.assign(
      {
        "Content-Type": "application/json",
      },
      extraHeaders
    ),
  };
}

function userHeaderParams(extraHeaders = {}) {
  return {
    headers: Object.assign(
      {
        "X-User-Id": USER_ID,
      },
      extraHeaders
    ),
  };
}

function bearerParams(extraHeaders = {}) {
  return {
    headers: Object.assign(
      {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
      extraHeaders
    ),
  };
}
