// The ONLY file the UI imports data-access from:   import { api } from "@/services";
import { USE_MOCK } from "./config";
import { mockApi } from "./mockApi";
import { httpApi } from "./httpApi";

export const api = USE_MOCK ? mockApi : httpApi;
export { USE_MOCK } from "./config";
export { ApiError } from "./http";
export { STATIC_CATALOG } from "./mockApi";
