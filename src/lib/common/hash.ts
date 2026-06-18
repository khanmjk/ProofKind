import { createHash } from "node:crypto";

export function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function shortHash(value: string | Buffer, length = 16) {
  return sha256(value).slice(0, length);
}

export function stableDocId(prefix: string, value: string | Buffer) {
  return `${prefix}_${shortHash(value, 24)}`;
}
