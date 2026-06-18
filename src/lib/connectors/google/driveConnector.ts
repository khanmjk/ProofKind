import {
  chooseDriveExportPlan,
  DRIVE_FOLDER_MIME_TYPE,
  DRIVE_SHORTCUT_MIME_TYPE,
  DriveApiClient,
  type DriveFile
} from "@/lib/connectors/google/driveClient";
import { parseDocumentBuffer } from "@/lib/ingestion/documentParser";
import { buildParsedSourceRecords, type SourceRecordOutput } from "@/lib/ingestion/sourceRecordBuilder";

export type DriveInventoryItem = {
  file: DriveFile;
  path: string;
  parentPath: string;
};

export async function inventoryDriveFolder(input: {
  client: DriveApiClient;
  rootFolderId: string;
  rootPath?: string;
  maxFiles: number;
}): Promise<DriveInventoryItem[]> {
  const items: DriveInventoryItem[] = [];
  const rootPath = input.rootPath ?? "drive-root";

  async function visitFolder(folderId: string, folderPath: string) {
    let pageToken: string | undefined;

    do {
      const page = await input.client.listChildren(folderId, pageToken);

      for (const file of page.files ?? []) {
        if (items.length >= input.maxFiles) return;

        if (file.mimeType === DRIVE_FOLDER_MIME_TYPE) {
          await visitFolder(file.id, `${folderPath}/${file.name}`);
          continue;
        }

        if (
          file.mimeType === DRIVE_SHORTCUT_MIME_TYPE &&
          file.shortcutDetails?.targetMimeType === DRIVE_FOLDER_MIME_TYPE &&
          file.shortcutDetails.targetId
        ) {
          await visitFolder(file.shortcutDetails.targetId, `${folderPath}/${file.name}`);
          continue;
        }

        items.push({
          file,
          path: `${folderPath}/${file.name}`,
          parentPath: folderPath
        });
      }

      pageToken = page.nextPageToken;
    } while (pageToken && items.length < input.maxFiles);
  }

  await visitFolder(input.rootFolderId, rootPath);
  return items;
}

export async function fetchAndParseDriveItem(input: {
  client: DriveApiClient;
  item: DriveInventoryItem;
  tenantId: string;
  ownerUid: string;
  connectorInstallId: string;
  now: string;
}): Promise<SourceRecordOutput | null> {
  const plan = chooseDriveExportPlan(input.item.file);
  if (!plan) return null;

  const data =
    plan.exportKind === "export"
      ? await input.client.exportFile(input.item.file.id, plan.mimeType)
      : await input.client.downloadFile(input.item.file.id);
  const parsed = await parseDocumentBuffer({
    fileName: `${input.item.file.name}${plan.extension}`,
    data,
    mimeType: plan.mimeType
  });
  const ownerAtSource =
    input.item.file.owners?.[0]?.emailAddress ?? input.item.file.owners?.[0]?.displayName ?? input.ownerUid;

  return buildParsedSourceRecords({
    tenantId: input.tenantId,
    ownerUid: input.ownerUid,
    connectorInstallId: input.connectorInstallId,
    connectorId: "google-drive",
    sourceType: "google_drive_file",
    sourceIdentity: input.item.file.id,
    title: input.item.file.name,
    resolvedPath: input.item.path,
    parents: input.item.file.parents ?? [],
    externalUrl: input.item.file.webViewLink ?? "",
    ownerAtSource,
    createdAtSource: input.item.file.createdTime ?? null,
    modifiedAtSource: input.item.file.modifiedTime ?? null,
    originalStoragePath: `google-drive://${input.item.file.id}`,
    parsed,
    now: input.now
  });
}
