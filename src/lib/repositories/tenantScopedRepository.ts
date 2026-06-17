import type { TenantContext } from "@/lib/types";

type TenantDocument = {
  tenantId: string;
};

export class TenantScopedRepository {
  constructor(private readonly tenantContext: TenantContext) {}

  tenantPath(collectionId: string, documentId?: string) {
    const base = `tenants/${this.tenantContext.tenantId}/${collectionId}`;
    return documentId ? `${base}/${documentId}` : base;
  }

  assertTenant<T extends TenantDocument>(document: T) {
    if (document.tenantId !== this.tenantContext.tenantId) {
      throw new Error("Tenant boundary violation");
    }

    return document;
  }
}

