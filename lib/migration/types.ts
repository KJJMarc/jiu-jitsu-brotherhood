export type MigrationAction = "PRESERVE" | "301" | "410";

export type InventoryRow = {
  oldShopifyUrl: string;
  contentType: string;
  currentHandleSlug: string;
  proposedNextjsUrl: string;
  action: MigrationAction;
  notes: string;
};

export type QueryMigration = {
  param: string;
  value: string;
  action: "301" | "410";
  destination: string | null;
};

export type LedgerOverride = {
  path: string;
  csvAction: MigrationAction;
  csvDestination: string;
  implementedAction: "301" | "410";
  implementedDestination: string | null;
  reason: string;
};

export type ExtraRule = {
  path: string;
  action: "301" | "410";
  destination: string | null;
  reason: string;
};

export type MigrationDecision =
  | { kind: "pass" }
  | { kind: "redirect"; location: string; status: 301 }
  | { kind: "gone" };
