// The ONLY file the UI imports data-access from:   import { api } from "@/services";
// Every call goes to the real database through our own Next.js server routes (src/app/api/shop/*, src/app/api/dokani/*).
// There is no mock backend and no demo data: if the database has nothing, the screen shows nothing.
import { authApi } from "./authApi";
import { realApi } from "./realApi";

export const api = { ...authApi, ...realApi };
export { ApiError } from "./http";
