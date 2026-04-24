import { Tag } from "lucide-react";
import { EXPENSE_CATS, INCOME_CATS, INVESTMENT_CATS } from "../constants";
import type { CategoryDef } from "../types";

export function getCatInfo(catId: string): CategoryDef {
  const all = [...EXPENSE_CATS, ...INCOME_CATS, ...INVESTMENT_CATS];
  return all.find((c) => c.id === catId) ?? { Icon: Tag, label: catId, id: catId };
}
