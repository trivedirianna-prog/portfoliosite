import type { SectionId } from "../windows/types";

export type MaterialFamily = "glossy" | "paper";

export interface SectionObjectConfig {
  id: SectionId;
  label: string;
  material: MaterialFamily;
}
