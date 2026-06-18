import { htmlToText, type ParsedDocument } from "@/lib/ingestion/documentParser";

type FetchLike = typeof fetch;

type BloggerFeedLink = {
  rel?: string;
  href?: string;
  type?: string;
};

type BloggerFeedEntry = {
  id?: { $t?: string };
  title?: { $t?: string };
  content?: { $t?: string };
  summary?: { $t?: string };
  published?: { $t?: string };
  updated?: { $t?: string };
  link?: BloggerFeedLink[];
  category?: Array<{ term?: string }>;
  author?: Array<{ name?: { $t?: string } }>;
};

type BloggerFeedPayload = {
  feed?: {
    entry?: BloggerFeedEntry[];
    openSearch$totalResults?: { $t?: string };
  };
};

export type BloggerPost = {
  id: string;
  title: string;
  html: string;
  text: string;
  url: string;
  labels: string[];
  author: string;
  publishedAt: string | null;
  updatedAt: string | null;
};

function normalizeBlogUrl(blogUrl: string) {
  const url = new URL(blogUrl);
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

export function bloggerFeedUrl(blogUrl: string, startIndex: number, maxResults: number) {
  const url = normalizeBlogUrl(blogUrl);
  url.pathname = `${url.pathname}/feeds/posts/default`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.searchParams.set("alt", "json");
  url.searchParams.set("start-index", String(startIndex));
  url.searchParams.set("max-results", String(maxResults));
  return url.toString();
}

function alternateUrl(entry: BloggerFeedEntry) {
  return entry.link?.find((link) => link.rel === "alternate")?.href ?? "";
}

export function parseBloggerFeedPayload(payload: unknown): { posts: BloggerPost[]; totalResults: number } {
  const feed = payload as BloggerFeedPayload;
  const entries = feed.feed?.entry ?? [];

  return {
    totalResults: Number(feed.feed?.openSearch$totalResults?.$t ?? entries.length),
    posts: entries.map((entry, index) => {
      const html = entry.content?.$t ?? entry.summary?.$t ?? "";
      const title = entry.title?.$t?.trim() || `Untitled Blogger post ${index + 1}`;

      return {
        id: entry.id?.$t ?? alternateUrl(entry) ?? title,
        title,
        html,
        text: htmlToText(html),
        url: alternateUrl(entry),
        labels: entry.category?.map((category) => category.term).filter(Boolean) as string[],
        author: entry.author?.[0]?.name?.$t ?? "",
        publishedAt: entry.published?.$t ?? null,
        updatedAt: entry.updated?.$t ?? null
      };
    })
  };
}

export async function fetchBloggerFeedPosts(input: {
  blogUrl: string;
  maxPosts: number;
  pageSize?: number;
  fetchImpl?: FetchLike;
}) {
  const pageSize = input.pageSize ?? 100;
  const fetchImpl = input.fetchImpl ?? fetch;
  const posts: BloggerPost[] = [];
  let startIndex = 1;
  let totalResults = Number.POSITIVE_INFINITY;

  while (posts.length < input.maxPosts && startIndex <= totalResults) {
    const response = await fetchImpl(bloggerFeedUrl(input.blogUrl, startIndex, pageSize));

    if (!response.ok) {
      throw new Error(`Blogger feed request failed: ${response.status} ${await response.text()}`);
    }

    const page = parseBloggerFeedPayload(await response.json());
    totalResults = page.totalResults;
    posts.push(...page.posts);

    if (!page.posts.length) break;
    startIndex += page.posts.length;
  }

  return posts.slice(0, input.maxPosts);
}

export function bloggerPostToParsedDocument(post: BloggerPost): ParsedDocument {
  return {
    text: [
      `Title: ${post.title}`,
      post.publishedAt ? `Published: ${post.publishedAt}` : "",
      post.labels.length ? `Labels: ${post.labels.join(", ")}` : "",
      "",
      post.text
    ]
      .filter((line) => line !== "")
      .join("\n"),
    mimeType: "text/html",
    parser: "blogger-feed-json",
    parserVersion: "1"
  };
}
