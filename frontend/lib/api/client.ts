const productionApiBaseUrl = "https://tesla-bullet-app.onrender.com/api/v1";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? productionApiBaseUrl
).replace(/\/+$/, "");
