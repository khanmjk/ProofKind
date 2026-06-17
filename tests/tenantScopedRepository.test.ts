import { describe, expect, it } from "vitest";
import { TenantScopedRepository } from "@/lib/repositories/tenantScopedRepository";

describe("TenantScopedRepository", () => {
  it("builds paths only under the current tenant", () => {
    const repository = new TenantScopedRepository({
      tenantId: "tenant-a",
      uid: "owner-a",
      roles: ["owner"]
    });

    expect(repository.tenantPath("claims")).toBe("tenants/tenant-a/claims");
    expect(repository.tenantPath("claims", "claim-1")).toBe("tenants/tenant-a/claims/claim-1");
  });

  it("rejects documents from another tenant", () => {
    const repository = new TenantScopedRepository({
      tenantId: "tenant-a",
      uid: "owner-a",
      roles: ["owner"]
    });

    expect(() => repository.assertTenant({ tenantId: "tenant-b" })).toThrow(
      "Tenant boundary violation"
    );
  });
});

