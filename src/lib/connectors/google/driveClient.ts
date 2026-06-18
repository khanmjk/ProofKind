export const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const DRIVE_SHORTCUT_MIME_TYPE = "application/vnd.google-apps.shortcut";
export const GOOGLE_WORKSPACE_MIME_PREFIX = "application/vnd.google-apps.";

type FetchLike = typeof fetch;

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  size?: string;
  md5Checksum?: string;
  version?: string;
  modifiedTime?: string;
  createdTime?: string;
  trashed?: boolean;
  driveId?: string;
  exportLinks?: Record<string, string>;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
  };
};

type ListFilesResponse = {
  nextPageToken?: string;
  files?: DriveFile[];
};

export type DriveExportPlan = {
  mimeType: string;
  extension: string;
  exportKind: "export" | "download";
};

const DRIVE_FIELDS = [
  "nextPageToken",
  "files(id,name,mimeType,parents,webViewLink,size,md5Checksum,version,modifiedTime,createdTime,trashed,driveId,exportLinks,owners(displayName,emailAddress),shortcutDetails)"
].join(",");

export function chooseDriveExportPlan(file: DriveFile): DriveExportPlan | null {
  switch (file.mimeType) {
    case "application/vnd.google-apps.document":
      return { mimeType: "text/plain", extension: ".txt", exportKind: "export" };
    case "application/vnd.google-apps.spreadsheet":
      return {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: ".xlsx",
        exportKind: "export"
      };
    case "application/vnd.google-apps.presentation":
      return {
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extension: ".pptx",
        exportKind: "export"
      };
    case "application/vnd.google-apps.drawing":
      return { mimeType: "application/pdf", extension: ".pdf", exportKind: "export" };
    case DRIVE_FOLDER_MIME_TYPE:
    case DRIVE_SHORTCUT_MIME_TYPE:
      return null;
    default:
      return { mimeType: file.mimeType, extension: extensionForMime(file.mimeType, file.name), exportKind: "download" };
  }
}

function extensionForMime(mimeType: string, name: string) {
  const existing = /\.[a-z0-9]+$/i.exec(name)?.[0];
  if (existing) return existing;

  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "text/plain":
      return ".txt";
    case "text/html":
      return ".html";
    case "text/csv":
      return ".csv";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return ".pptx";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    default:
      return ".bin";
  }
}

export class DriveApiClient {
  constructor(
    private readonly getAccessToken: () => Promise<string>,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  private async request(url: URL) {
    const response = await this.fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Drive API request failed: ${response.status} ${await response.text()}`);
    }

    return response;
  }

  async listChildren(folderId: string, pageToken?: string) {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`);
    url.searchParams.set("fields", DRIVE_FIELDS);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    return (await (await this.request(url)).json()) as ListFilesResponse;
  }

  async getFile(fileId: string) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    url.searchParams.set(
      "fields",
      "id,name,mimeType,parents,webViewLink,size,md5Checksum,version,modifiedTime,createdTime,trashed,driveId,exportLinks,owners(displayName,emailAddress),shortcutDetails"
    );
    url.searchParams.set("supportsAllDrives", "true");

    return (await (await this.request(url)).json()) as DriveFile;
  }

  async downloadFile(fileId: string) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    url.searchParams.set("alt", "media");
    url.searchParams.set("supportsAllDrives", "true");

    return Buffer.from(await (await this.request(url)).arrayBuffer());
  }

  async exportFile(fileId: string, mimeType: string) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    url.searchParams.set("mimeType", mimeType);

    return Buffer.from(await (await this.request(url)).arrayBuffer());
  }
}
