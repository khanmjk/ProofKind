import { readFile } from "node:fs/promises";
import { stableDocId } from "@/lib/common/hash";
import {
  bloggerPostToParsedDocument,
  fetchBloggerFeedPosts,
  parseBloggerFeedPayload,
  type BloggerPost
} from "@/lib/connectors/blogger/bloggerFeedClient";
import { buildParsedSourceRecords } from "@/lib/ingestion/sourceRecordBuilder";
import { CorpusRepository } from "@/lib/repositories/corpusRepository";
import type { SourceRoot } from "@/lib/types";

type Args = {
  blogUrl: string;
  feedFile?: string;
  tenant: string;
  ownerUid: string;
  displayName: string;
  maxPosts: number;
};

function argValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function parseArgs(): Args {
  const blogUrl = argValue("--blog-url");
  const feedFile = argValue("--feed-file");

  if (!blogUrl && !feedFile) {
    throw new Error("Missing --blog-url or --feed-file. Blogger ingestion requires an explicit blog source.");
  }

  return {
    blogUrl: blogUrl ?? "fixture://blogger-feed",
    feedFile,
    tenant: argValue("--tenant", "founder-mjk") ?? "founder-mjk",
    ownerUid: argValue("--owner-uid", "owner-mjk") ?? "owner-mjk",
    displayName: argValue("--display-name", "Blogger feed") ?? "Blogger feed",
    maxPosts: Number(argValue("--max-posts", "200"))
  };
}

async function loadPosts(args: Args): Promise<BloggerPost[]> {
  if (args.feedFile) {
    const payload = JSON.parse(await readFile(args.feedFile, "utf8")) as unknown;
    return parseBloggerFeedPayload(payload).posts.slice(0, args.maxPosts);
  }

  return fetchBloggerFeedPosts({
    blogUrl: args.blogUrl,
    maxPosts: args.maxPosts
  });
}

async function main() {
  const args = parseArgs();
  const now = new Date().toISOString();
  const repository = new CorpusRepository();
  const connectorInstallId = stableDocId("source_root", `${args.tenant}:blogger:${args.blogUrl}`);
  const sourceRoot: SourceRoot = {
    id: connectorInstallId,
    schemaVersion: 1,
    tenantId: args.tenant,
    connectorId: "blogger-feed",
    displayName: args.displayName,
    rootUri: args.blogUrl,
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: args.ownerUid,
    updatedBy: args.ownerUid
  };

  await repository.upsertSourceRoot(sourceRoot);

  const posts = await loadPosts(args);
  let parsed = 0;
  let failed = 0;
  let chunks = 0;

  for (const post of posts) {
    try {
      const records = buildParsedSourceRecords({
        tenantId: args.tenant,
        ownerUid: args.ownerUid,
        connectorInstallId,
        connectorId: "blogger-feed",
        sourceType: "blogger_post",
        sourceIdentity: post.id,
        title: post.title,
        resolvedPath: post.url || `blogger://${post.id}`,
        parents: [args.blogUrl],
        externalUrl: post.url,
        ownerAtSource: post.author || args.ownerUid,
        createdAtSource: post.publishedAt,
        modifiedAtSource: post.updatedAt,
        originalStoragePath: post.url || `blogger://${post.id}`,
        parsed: bloggerPostToParsedDocument(post),
        now,
        classification: {
          documentFamily: "public_footprint",
          sensitivity: "public",
          visibility: "public_candidate",
          rightsStatus: "owner_provided"
        }
      });

      await repository.upsertParsedSource(records);
      parsed += 1;
      chunks += records.chunks.length;
      console.log(`parsed ${post.title} -> ${records.chunks.length} chunks`);
    } catch (caught) {
      failed += 1;
      const message = caught instanceof Error ? caught.message : "Unknown Blogger ingestion error";
      console.warn(`failed ${post.title}: ${message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        connector: "blogger-feed",
        tenant: args.tenant,
        blogUrl: args.blogUrl,
        discovered: posts.length,
        parsed,
        failed,
        chunks
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
