import * as cheerio from "cheerio";

function parsePrice(raw: string) {
  const normalized = raw.replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  return Number(normalized);
}

function scrapeBooksToScrape($: cheerio.CheerioAPI) {
  const title = $(".product_main h1").text().trim();
  const rawPrice = $(".product_main .price_color").first().text().trim();
  const numericPrice = Number(rawPrice.replace(/[^\d.]/g, ""));

  if (!title || Number.isNaN(numericPrice)) {
    throw new Error("Could not parse title or price from books.toscrape");
  }

  return {
    title,
    price: numericPrice,
    currency: "GBP",
  };
}

function scrapeOlimpica($: cheerio.CheerioAPI) {
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim();

  const jsonLdNodes = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of jsonLdNodes) {
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        const offer = candidate?.offers;
        const priceValue = offer?.price ?? offer?.lowPrice ?? offer?.highPrice;
        const currency = offer?.priceCurrency ?? "COP";
        const parsedPrice = typeof priceValue === "number" ? priceValue : parsePrice(String(priceValue ?? ""));

        if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
          return {
            title: candidate?.name?.trim?.() || title || "Producto Olímpica",
            price: parsedPrice,
            currency,
          };
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks and continue.
    }
  }

  const rawPriceBySelector =
    $("[data-price]").first().attr("data-price") ||
    $(".price").first().text().trim() ||
    $(".vtex-product-price-1-x-sellingPriceValue").first().text().trim();

  const fallbackPrice = parsePrice(rawPriceBySelector ?? "");

  if (!title || Number.isNaN(fallbackPrice) || fallbackPrice <= 0) {
    throw new Error("Could not parse title or price from olimpica.com");
  }

  return {
    title,
    price: fallbackPrice,
    currency: "COP",
  };
}

function scrapeAlkosto($: cheerio.CheerioAPI) {
  const titleTag = $("title").first().text().trim();
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    titleTag;

  const jsonLdNodes = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of jsonLdNodes) {
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        const type = candidate?.["@type"];
        if (type) {
          const types = Array.isArray(type) ? type.map((t: unknown) => String(t).toLowerCase()) : [String(type).toLowerCase()];
          if (!types.includes("product")) continue;
        }

        const offer = candidate?.offers;
        const priceValue = offer?.price ?? offer?.lowPrice ?? offer?.highPrice;
        const currency = offer?.priceCurrency ?? "COP";
        const parsedPrice = typeof priceValue === "number" ? priceValue : parsePrice(String(priceValue ?? ""));

        if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
          const candidateName = candidate?.name?.trim?.();
          const finalTitle =
            candidateName && !/audio para el hogar/i.test(candidateName)
              ? candidateName
              : title;

          return {
            title: finalTitle || "Producto Alkosto",
            price: parsedPrice,
            currency,
          };
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks and continue.
    }
  }

  const rawPriceBySelector =
    $("[data-price]").first().attr("data-price") ||
    $(".price").first().text().trim() ||
    $(".product__price").first().text().trim() ||
    $(".js-price").first().text().trim();

  let fallbackPrice = parsePrice(rawPriceBySelector ?? "");

  if (Number.isNaN(fallbackPrice) || fallbackPrice <= 0) {
    const html = $.html();
    const regexPriceMatch = html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i);
    fallbackPrice = regexPriceMatch ? Number(regexPriceMatch[1]) : Number.NaN;
  }

  const isGenericTitle = /audio para el hogar/i.test(title || "");
  const inferredTitle = isGenericTitle
    ? titleTag.replace(/\s*\|\s*Alkosto.*/i, "").trim()
    : title;

  if (!inferredTitle || Number.isNaN(fallbackPrice) || fallbackPrice <= 0) {
    throw new Error("Could not parse title or price from alkosto.com");
  }

  return {
    title: inferredTitle,
    price: fallbackPrice,
    currency: "COP",
  };
}

function scrapeOportunidades($: cheerio.CheerioAPI) {
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    $("title").first().text().trim();

  const jsonLdNodes = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of jsonLdNodes) {
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        const offer = candidate?.offers;
        const priceValue = offer?.price ?? offer?.lowPrice ?? offer?.highPrice;
        const currency = offer?.priceCurrency ?? "COP";
        const parsedPrice = typeof priceValue === "number" ? priceValue : parsePrice(String(priceValue ?? ""));

        if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
          return {
            title: candidate?.name?.trim?.() || title || "Producto Oportunidades",
            price: parsedPrice,
            currency,
          };
        }
      }
    } catch {
      // ignore malformed json-ld
    }
  }

  const rawPriceBySelector =
    $("[data-price]").first().attr("data-price") ||
    $(".price").first().text().trim() ||
    $(".product__price").first().text().trim() ||
    $(".vtex-product-price-1-x-sellingPriceValue").first().text().trim();

  const fallbackPrice = parsePrice(rawPriceBySelector ?? "");

  if (!title || Number.isNaN(fallbackPrice) || fallbackPrice <= 0) {
    throw new Error("Could not parse title or price from oportunidades.com.co");
  }

  return {
    title,
    price: fallbackPrice,
    currency: "COP",
  };
}

function scrapeShein($: cheerio.CheerioAPI) {
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim();

  const jsonLdNodes = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of jsonLdNodes) {
    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        const offer = candidate?.offers;
        const priceValue = offer?.price ?? offer?.lowPrice ?? offer?.highPrice;
        const currency = offer?.priceCurrency ?? "COP";
        const parsedPrice = typeof priceValue === "number" ? priceValue : parsePrice(String(priceValue ?? ""));

        if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
          return {
            title: candidate?.name?.trim?.() || title || "Producto Shein",
            price: parsedPrice,
            currency,
          };
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks and continue.
    }
  }

  const rawPriceBySelector =
    $("[data-price]").first().attr("data-price") ||
    $(".from-price").first().text().trim() ||
    $(".product-intro__head-mainprice").first().text().trim() ||
    $(".product-sale-price").first().text().trim();

  const fallbackPrice = parsePrice(rawPriceBySelector ?? "");

  if (!title || Number.isNaN(fallbackPrice) || fallbackPrice <= 0) {
    throw new Error("Could not parse title or price from shein.com.co");
  }

  return {
    title,
    price: fallbackPrice,
    currency: "COP",
  };
}

async function scrapeSheinWithScrapeDo(url: string) {
  const apiKey = process.env.SCRAPEDO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SCRAPEDO_API_KEY for Shein scraping");
  }

  const endpoint = new URL("https://api.scrape.do/");
  endpoint.searchParams.set("token", apiKey);
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("render", "true");
  endpoint.searchParams.set("super", "true");
  endpoint.searchParams.set("waitUntil", "networkidle");

  const res = await fetch(endpoint.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Scrape.do request failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  try {
    return scrapeShein($);
  } catch (error) {
    const maybeChallenge = html.includes("Please verify") || html.includes("captcha") || html.includes("Cloudflare");
    if (maybeChallenge) {
      throw new Error("Shein blocked extraction via Scrape.do (challenge/captcha detected)");
    }
    throw error;
  }
}

export async function scrapeBookPrice(url: string) {
  const hostname = new URL(url).hostname.replace("www.", "");

  if (hostname === "shein.com.co") {
    return scrapeSheinWithScrapeDo(url);
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PriceWatcherBot/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Error fetching ${url}: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  if (hostname === "books.toscrape.com") {
    return scrapeBooksToScrape($);
  }

  if (hostname === "olimpica.com") {
    return scrapeOlimpica($);
  }

  if (hostname === "alkosto.com") {
    return scrapeAlkosto($);
  }

  if (hostname === "oportunidades.com.co") {
    return scrapeOportunidades($);
  }

  throw new Error(`Unsupported domain for scraping: ${hostname}`);
}
