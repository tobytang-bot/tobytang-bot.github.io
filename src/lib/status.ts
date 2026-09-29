import type { Article } from "./content";

export type Status = Article["data"]["status"];

export const STATUS_LABEL: Record<Status, string> = {
  investigating: "调查中",
  solved: "已解决",
  reference: "参考",
  deprecated: "已过时",
};

export const COLLECTION_LABEL: Record<Article["collection"], string> = {
  worklog: "Worklog",
  knowledge: "Knowledge",
};
