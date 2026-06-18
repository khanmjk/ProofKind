import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  bloggerFeedUrl,
  bloggerPostToParsedDocument,
  parseBloggerFeedPayload
} from "@/lib/connectors/blogger/bloggerFeedClient";
import { chooseDriveExportPlan, DRIVE_FOLDER_MIME_TYPE, DriveApiClient } from "@/lib/connectors/google/driveClient";
import { fetchAndParseDriveItem, inventoryDriveFolder } from "@/lib/connectors/google/driveConnector";
import {
  BLOGGER_READONLY_SCOPE,
  buildGoogleAuthUrl,
  DEFAULT_GOOGLE_REDIRECT_URI,
  GOOGLE_DRIVE_READONLY_SCOPE
} from "@/lib/connectors/google/oauth";

describe("Google OAuth helpers", () => {
  it("builds an offline consent URL for Drive and Blogger readonly scopes", () => {
    const url = new URL(
      buildGoogleAuthUrl(
        {
          clientId: "client-id",
          clientSecret: "client-secret",
          redirectUri: DEFAULT_GOOGLE_REDIRECT_URI,
          tokenPath: ".proofkind/test-token.json"
        },
        [GOOGLE_DRIVE_READONLY_SCOPE, BLOGGER_READONLY_SCOPE]
      )
    );

    expect(url.hostname).toBe("accounts.google.com");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("scope")).toContain(GOOGLE_DRIVE_READONLY_SCOPE);
    expect(url.searchParams.get("scope")).toContain(BLOGGER_READONLY_SCOPE);
  });
});

describe("Drive connector", () => {
  it("chooses export formats for Google Workspace files", () => {
    expect(
      chooseDriveExportPlan({
        id: "doc-1",
        name: "Profile",
        mimeType: "application/vnd.google-apps.document"
      })
    ).toMatchObject({ exportKind: "export", extension: ".txt", mimeType: "text/plain" });

    expect(
      chooseDriveExportPlan({
        id: "folder-1",
        name: "Folder",
        mimeType: DRIVE_FOLDER_MIME_TYPE
      })
    ).toBeNull();
  });

  it("inventories a selected Drive folder recursively", async () => {
    const client = {
      async listChildren(folderId: string) {
        if (folderId === "root") {
          return {
            files: [
              { id: "nested", name: "Nested", mimeType: DRIVE_FOLDER_MIME_TYPE },
              { id: "doc-1", name: "Profile", mimeType: "application/vnd.google-apps.document" }
            ]
          };
        }

        return {
          files: [{ id: "pdf-1", name: "Report.pdf", mimeType: "application/pdf" }]
        };
      }
    } as DriveApiClient;

    const inventory = await inventoryDriveFolder({
      client,
      rootFolderId: "root",
      rootPath: "approved",
      maxFiles: 10
    });

    expect(inventory.map((item) => item.path)).toEqual(["approved/Nested/Report.pdf", "approved/Profile"]);
  });

  it("exports and parses a Google Doc into canonical source records", async () => {
    const client = {
      async exportFile() {
        return Buffer.from("This exported Google Doc describes AI architecture and professional profile evidence.");
      }
    } as unknown as DriveApiClient;

    const records = await fetchAndParseDriveItem({
      client,
      item: {
        path: "approved/Profile",
        parentPath: "approved",
        file: {
          id: "doc-1",
          name: "Profile",
          mimeType: "application/vnd.google-apps.document",
          modifiedTime: "2026-06-18T00:00:00.000Z",
          webViewLink: "https://docs.google.com/document/d/doc-1"
        }
      },
      tenantId: "tenant-a",
      ownerUid: "owner",
      connectorInstallId: "install-1",
      now: "2026-06-18T01:00:00.000Z"
    });

    expect(records?.sourceItem.connectorId).toBe("google-drive");
    expect(records?.sourceItem.sourceType).toBe("google_drive_file");
    expect(records?.sourceVersion.parser).toBe("plain-text");
    expect(records?.chunks[0]?.text).toContain("AI architecture");
  });
});

describe("Blogger feed connector", () => {
  it("builds public Blogger JSON feed URLs", () => {
    expect(bloggerFeedUrl("https://example.blogspot.com/", 1, 100)).toBe(
      "https://example.blogspot.com/feeds/posts/default?alt=json&start-index=1&max-results=100"
    );
  });

  it("parses Blogger feed posts into text documents", async () => {
    const payload = JSON.parse(await readFile("tests/fixtures/blogger-feed.json", "utf8")) as unknown;
    const parsed = parseBloggerFeedPayload(payload);

    expect(parsed.posts).toHaveLength(1);
    expect(parsed.posts[0]?.title).toBe("AI Product Thinking");
    expect(parsed.posts[0]?.labels).toEqual(["AI", "Product"]);

    const document = bloggerPostToParsedDocument(parsed.posts[0]!);
    expect(document.parser).toBe("blogger-feed-json");
    expect(document.text).toContain("AI product teams");
    expect(document.text).not.toContain("<p>");
  });
});
