import { stableDocId } from "@/lib/common/hash";
import { DriveApiClient } from "@/lib/connectors/google/driveClient";
import { fetchAndParseDriveItem, inventoryDriveFolder } from "@/lib/connectors/google/driveConnector";
import { getGoogleAccessToken, GOOGLE_DRIVE_READONLY_SCOPE } from "@/lib/connectors/google/oauth";
import { CorpusRepository } from "@/lib/repositories/corpusRepository";
import type { SourceRoot } from "@/lib/types";

type Args = {
  folderId: string;
  tenant: string;
  ownerUid: string;
  displayName: string;
  rootPath: string;
  maxFiles: number;
};

function argValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function parseArgs(): Args {
  const folderId = argValue("--folder-id");

  if (!folderId) {
    throw new Error("Missing required --folder-id. Drive ingestion requires an explicitly approved folder ID.");
  }

  return {
    folderId,
    tenant: argValue("--tenant", "founder-mjk") ?? "founder-mjk",
    ownerUid: argValue("--owner-uid", "owner-mjk") ?? "owner-mjk",
    displayName: argValue("--display-name", "Google Drive approved folder") ?? "Google Drive approved folder",
    rootPath: argValue("--root-path", "google-drive-root") ?? "google-drive-root",
    maxFiles: Number(argValue("--max-files", "200"))
  };
}

async function main() {
  const args = parseArgs();
  const now = new Date().toISOString();
  const repository = new CorpusRepository();
  const connectorInstallId = stableDocId("source_root", `${args.tenant}:google-drive:${args.folderId}`);
  const sourceRoot: SourceRoot = {
    id: connectorInstallId,
    schemaVersion: 1,
    tenantId: args.tenant,
    connectorId: "google-drive",
    displayName: args.displayName,
    rootUri: `google-drive://${args.folderId}`,
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: args.ownerUid,
    updatedBy: args.ownerUid
  };

  await repository.upsertSourceRoot(sourceRoot);

  const client = new DriveApiClient(() => getGoogleAccessToken([GOOGLE_DRIVE_READONLY_SCOPE]));
  const inventory = await inventoryDriveFolder({
    client,
    rootFolderId: args.folderId,
    rootPath: args.rootPath,
    maxFiles: args.maxFiles
  });

  let parsed = 0;
  let skipped = 0;
  let failed = 0;
  let chunks = 0;

  for (const item of inventory) {
    try {
      const records = await fetchAndParseDriveItem({
        client,
        item,
        tenantId: args.tenant,
        ownerUid: args.ownerUid,
        connectorInstallId,
        now
      });

      if (!records) {
        skipped += 1;
        console.log(`skipped ${item.path} (${item.file.mimeType})`);
        continue;
      }

      await repository.upsertParsedSource(records);
      parsed += 1;
      chunks += records.chunks.length;
      console.log(`parsed ${item.path} -> ${records.chunks.length} chunks`);
    } catch (caught) {
      failed += 1;
      const message = caught instanceof Error ? caught.message : "Unknown Drive ingestion error";
      console.warn(`failed ${item.path}: ${message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        connector: "google-drive",
        tenant: args.tenant,
        folderId: args.folderId,
        discovered: inventory.length,
        parsed,
        skipped,
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
