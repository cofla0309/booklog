// Proxies Aladin Open API search/lookup calls: keeps the TTBKey server-side
// (Aladin doesn't allow browser-side CORS, and the key must not ship in the client bundle).

const ALADIN_BASE = "https://www.aladin.co.kr/ttb/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AladinItem {
  title?: string;
  author?: string;
  publisher?: string;
  cover?: string;
  isbn13?: string;
  pubDate?: string;
  categoryName?: string;
  subInfo?: { itemPage?: number };
  itemPage?: number;
}

interface NormalizedItem {
  title: string;
  author: string;
  publisher: string;
  coverUrl: string;
  isbn13: string;
  totalPages: number | null;
  pubDate: string;
  category: string;
}

function stripTags(value: string | undefined): string {
  return (value ?? "").replace(/<\/?b>/g, "").trim();
}

function normalize(item: AladinItem): NormalizedItem {
  return {
    title: stripTags(item.title),
    author: stripTags(item.author),
    publisher: stripTags(item.publisher),
    coverUrl: item.cover ?? "",
    isbn13: item.isbn13 ?? "",
    totalPages: item.subInfo?.itemPage ?? item.itemPage ?? null,
    pubDate: item.pubDate ?? "",
    category: stripTags(item.categoryName),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ttbKey = Deno.env.get("ALADIN_TTB_KEY");
    if (!ttbKey) {
      return new Response(
        JSON.stringify({ error: "ALADIN_TTB_KEY secret is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const params = new URLSearchParams({
      ttbkey: ttbKey,
      output: "js",
      Version: "20131101",
      Cover: "Big",
      SearchTarget: "Book",
    });

    let url: string;
    if (body.action === "search") {
      if (!body.query || typeof body.query !== "string") {
        throw new Error("query is required for action=search");
      }
      params.set("Query", body.query);
      params.set("QueryType", body.queryType ?? "Title");
      params.set("Start", String(body.start ?? 1));
      params.set("MaxResults", "20");
      url = `${ALADIN_BASE}/ItemSearch.aspx?${params.toString()}`;
    } else if (body.action === "lookup") {
      if (!body.isbn13 || typeof body.isbn13 !== "string") {
        throw new Error("isbn13 is required for action=lookup");
      }
      params.set("ItemId", body.isbn13);
      params.set("ItemIdType", "ISBN13");
      params.set("OptResult", "subInfo");
      url = `${ALADIN_BASE}/ItemLookUp.aspx?${params.toString()}`;
    } else {
      throw new Error("action must be 'search' or 'lookup'");
    }

    const aladinRes = await fetch(url);
    const text = await aladinRes.text();
    const data = JSON.parse(text);

    if (data.errorCode) {
      return new Response(
        JSON.stringify({ error: data.errorMessage ?? "Aladin API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const items: AladinItem[] = data.item ?? [];

    const payload = body.action === "search"
      ? { items: items.map(normalize), totalResults: data.totalResults ?? items.length }
      : { item: items.length > 0 ? normalize(items[0]) : null };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
