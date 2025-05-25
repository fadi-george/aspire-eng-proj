import { toast } from "sonner";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async fetch(
    endpoint: URL | RequestInfo,
    { headers, ...options }: RequestInit = {},
  ) {
    const url =
      typeof endpoint === "string"
        ? `${this.baseUrl}${endpoint}`
        : endpoint.toString();

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...options,
    });

    if (response.status === 401) {
      toast.error("Not authorized");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async get(endpoint: string) {
    return this.fetch(endpoint);
  }

  async post(endpoint: string, data?: unknown) {
    return this.fetch(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
);
