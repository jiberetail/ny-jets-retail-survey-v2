import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = "https://www.jetsshop.com";
const SOURCE_PATH = "/new-york-jets/o-3572+t-47710422+z-91106-3083982614";
const CACHE_PATH = process.env.JETS_SHOP_HTML ?? "/tmp/jets-shop-full.html";
const PRODUCT_CACHE_PATH = process.env.JETS_SHOP_PRODUCTS ?? "/tmp/jets-shop-products.json";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const MAIN_CATEGORIES = [
  { label: "Hats", slug: "hats", resourceId: 3082 },
  { label: "Jerseys", slug: "jerseys", resourceId: 3084 },
  { label: "Sweatshirts", slug: "sweatshirts", resourceId: 3088 },
  { label: "T-Shirts", slug: "tshirts", resourceId: 3089 },
];

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function absoluteUrl(url = "") {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

async function fetchShopHtml() {
  const url = `${BASE_URL}${SOURCE_PATH}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": USER_AGENT,
      },
    });

    if (response.ok) return response.text();
    console.warn(`Jets Shop returned ${response.status}; using cached HTML at ${CACHE_PATH}.`);
  } catch (error) {
    console.warn(`Jets Shop fetch failed; using cached HTML at ${CACHE_PATH}.`);
    console.warn(error instanceof Error ? error.message : error);
  }

  if (!existsSync(CACHE_PATH)) {
    throw new Error(`Could not fetch Jets Shop and no cached HTML exists at ${CACHE_PATH}.`);
  }

  return readFile(CACHE_PATH, "utf8");
}

function extractPlatformData(html) {
  const match = html.match(/<script>var __platform_data__=([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Could not find Jets Shop platform data in the page HTML.");
  return JSON.parse(match[1]);
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number);
}

function getProductPrice(product) {
  if (typeof product.price === "number") return product.price;

  const price =
    product.price?.discountPrice?.money?.userCurrencyValue ??
    product.price?.sale?.money?.userCurrencyValue ??
    product.price?.regular?.money?.userCurrencyValue ??
    product.priceCard?.prices?.[0]?.price?.userCurrencyValue ??
    "0";

  return Number(price);
}

function getProductImage(product, imageHostname) {
  if (product.image) return product.image;

  const selected =
    product.media?.find((media) => media.mediaMetadataValues?.includes("STACKED")) ??
    product.media?.find((media) => media.type === "Image") ??
    product.media?.[0];

  return selected?.url ? `https://${imageHostname}/${selected.url}` : "";
}

function inferFit(productName) {
  const prefix = productName.split(" ")[0] ?? "";
  if (prefix.includes("'")) return `${prefix.replace(/\s+/g, " ")} fit`;
  if (productName.startsWith("Unisex")) return "Unisex fit";
  if (productName.startsWith("Youth")) return "Youth fit";
  return "Fan fit";
}

function inferSizes(productName, categorySlugs, departmentLabels) {
  const name = productName.toLowerCase();
  const labels = departmentLabels.join(" ").toLowerCase();

  if (categorySlugs.includes("hats") || labels.includes("hat") || name.includes("hat") || name.includes("cap")) {
    return name.includes("fitted") ? ["6 7/8", "7", "7 1/8", "7 1/4", "7 3/8", "7 1/2"] : ["OSFA"];
  }

  if (categorySlugs.includes("jerseys") || name.includes("jersey")) return ["S", "M", "L", "XL", "2XL", "3XL"];
  if (categorySlugs.includes("sweatshirts")) return ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  if (categorySlugs.includes("tshirts") || name.includes("t-shirt") || name.includes("top")) {
    return ["XS", "S", "M", "L", "XL", "2XL"];
  }
  if (name.includes("shorts") || name.includes("pants")) return ["S", "M", "L", "XL", "2XL"];
  if (name.includes("shoe") || name.includes("slide")) return ["8", "9", "10", "11", "12"];
  return ["OSFA"];
}

function inventoryFor(productId, sizes) {
  return Object.fromEntries(
    sizes.map((size, index) => {
      let hash = 0;
      for (const char of `${productId}-${size}`) hash = (hash * 31 + char.charCodeAt(0)) % 997;
      const value = sizes.length > 1 && index === 0 ? hash % 3 : 3 + (hash % 18);
      return [size, value];
    }),
  );
}

function normalizeDepartment(link) {
  return {
    id: slugify(link.text),
    label: link.text,
    count: link.productCount ?? 0,
    resourceId: link.resourceId,
    sourceUrl: absoluteUrl(link.href),
  };
}

function normalizeProduct(product, departmentByResourceId, imageHostname) {
  const productDepartmentIds = product.departmentIds ?? [];
  const departmentMatches = productDepartmentIds
    .map((resourceId) => departmentByResourceId.get(resourceId))
    .filter(Boolean);
  const markdownPercent = product.markdownPercent ?? product.price?.markdownPercent ?? 0;
  const saleDepartment = departmentByResourceId.get(1);
  if (markdownPercent > 0 && saleDepartment && !departmentMatches.includes(saleDepartment)) {
    departmentMatches.push(saleDepartment);
  }
  const categoryMatches = MAIN_CATEGORIES.filter((category) => productDepartmentIds.includes(category.resourceId));
  const categorySlugs = categoryMatches.map((category) => category.slug);
  const departmentLabels = departmentMatches.map((department) => department.label);
  const price = getProductPrice(product);
  const sizes = inferSizes(product.title, categorySlugs, departmentLabels);
  const id = `p-${product.productId}`;

  return {
    id,
    sourceId: product.productId,
    name: product.title.replace(/\s+/g, " ").trim(),
    category: categorySlugs[0] ?? "all",
    categories: categorySlugs,
    departments: departmentMatches.map((department) => department.id),
    departmentLabels,
    style: product.brand ?? product.brandResource?.value ?? product.topSeller?.value ?? "Jets Shop",
    genderFit: inferFit(product.title),
    price,
    regularPrice:
      typeof product.regularPrice === "number"
        ? product.regularPrice
        : Number(product.price?.regular?.money?.userCurrencyValue ?? price),
    priceDisplay: formatPrice(price),
    image: getProductImage(product, imageHostname),
    sourceUrl: absoluteUrl(product.url),
    badges: [
      product.fewLeft ? "Few left" : "",
      product.readyToShip ? "Ready to ship" : "",
      markdownPercent ? `${markdownPercent}% off` : "",
    ].filter(Boolean),
    sizes,
    inventory: inventoryFor(id, sizes),
  };
}

async function main() {
  const html = await fetchShopHtml();
  const platformData = extractPlatformData(html);
  const browseData = platformData["browse-data"];
  const imageHostname = platformData.initialAppContext?.imageHostname ?? "fanatics.frgimages.com";
  const allDepartmentFacet = browseData.facets.find((facet) => facet.title === "All Departments");

  if (!allDepartmentFacet?.links?.length) {
    throw new Error("Could not find All Departments in the Jets Shop data.");
  }

  const departments = allDepartmentFacet.links.map(normalizeDepartment);
  const departmentByResourceId = new Map(departments.map((department) => [department.resourceId, department]));
  const mainCategories = MAIN_CATEGORIES.map((category) => {
    const source = departmentByResourceId.get(category.resourceId);
    return {
      id: category.slug,
      label: category.label,
      count: source?.count ?? 0,
      resourceId: category.resourceId,
      sourceUrl: source?.sourceUrl ?? "",
    };
  });
  const productCache = existsSync(PRODUCT_CACHE_PATH)
    ? JSON.parse(await readFile(PRODUCT_CACHE_PATH, "utf8"))
    : null;
  const sourceProducts = productCache?.products?.length ? productCache.products : browseData.products;
  const products = sourceProducts
    .map((product) => normalizeProduct(product, departmentByResourceId, imageHostname))
    .filter((product) => product.image);

  const catalog = {
    generatedAt: new Date().toISOString(),
    sourceUrl: absoluteUrl(SOURCE_PATH),
    totalProductCount: productCache?.officialTotal ?? browseData.totalProductCount ?? 0,
    catalogProductCount: products.length,
    seededProductCount: products.length,
    mainCategories,
    departments,
    products,
  };

  const outputDir = path.resolve("src/data");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "jets-shop-catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);

  console.log(
    `Wrote ${products.length} distinct products and ${departments.length} departments from Jets Shop (${catalog.totalProductCount} total result slots).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
