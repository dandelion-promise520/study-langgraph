import type { App } from "@lg-lab/backend";

import { treaty } from "@elysiajs/eden";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const client = treaty<App>(API_BASE_URL);
