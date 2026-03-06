import type {
  ApiEnvelope,
  AssignRolePayload,
  AuthResponse,
  Category,
  CreateProductPayload,
  HealthResponse,
  Product,
  ProductDetailsPayload,
  ProductEvent,
  Role,
  UserProfile,
} from './types';

type RequestOptions = Omit<RequestInit, 'body'> & {
  token?: string | null;
  body?: unknown;
};

export class ApiClientError extends Error {
  status?: number;
  errorCode?: string | null;
  errors?: string[];
}

function resolveBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }
  return '/api';
}

function asApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }
  const unknownError = new ApiClientError('Unexpected API error');
  return unknownError;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = options;
  const responseHeaders = new Headers(headers ?? {});
  const hasJsonBody = body !== undefined && !(body instanceof FormData);

  responseHeaders.set('Accept', 'application/json');
  if (hasJsonBody && !responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    responseHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...rest,
    headers: responseHeaders,
    body: hasJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
  });

  const rawBody = await response.text();
  const parsedBody = rawBody ? (JSON.parse(rawBody) as unknown) : null;

  if (parsedBody && typeof parsedBody === 'object' && 'isSuccess' in parsedBody) {
    const payload = parsedBody as ApiEnvelope<T>;

    if (!response.ok || !payload.isSuccess) {
      const err = new ApiClientError(
        payload.errors?.[0] ?? payload.message ?? `Request failed (${response.status})`,
      );
      err.status = response.status;
      err.errorCode = payload.errorCode;
      err.errors = payload.errors ?? [];
      throw err;
    }

    return payload.data;
  }

  if (!response.ok) {
    const err = new ApiClientError(`Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }

  return parsedBody as T;
}

export function getHealthTargetLabel(): string {
  return `${resolveBaseUrl()}/health`;
}

export async function checkHealth() {
  return request<HealthResponse>('/health', { method: 'GET' });
}

export async function register(email: string, password: string) {
  return request<{ message: string }>('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export async function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function getProfile(token: string) {
  return request<UserProfile>('/user/profile', {
    method: 'GET',
    token,
  });
}

export async function listUsers(token: string) {
  return request<UserProfile[]>('/user', {
    method: 'GET',
    token,
  });
}

export async function listRoles(token: string) {
  return request<Role[]>('/role', {
    method: 'GET',
    token,
  });
}

export async function assignRole(payload: AssignRolePayload, token: string) {
  return request<UserProfile>('/role/assign', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function changeRole(payload: AssignRolePayload, token: string) {
  return request<UserProfile>('/role/change', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function listCategories() {
  return request<Category[]>('/category', {
    method: 'GET',
  });
}

type ProductFilters = {
  active?: boolean;
  merchantId?: number;
};

export async function listProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.active !== undefined) {
    params.set('active', String(filters.active));
  }
  if (filters.merchantId !== undefined) {
    params.set('merchantId', String(filters.merchantId));
  }
  const qs = params.toString();
  return request<Product[]>(`/product${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getProduct(productId: number) {
  return request<Product>(`/product/${productId}`, {
    method: 'GET',
  });
}

export async function createProduct(payload: CreateProductPayload, token: string) {
  return request<Product>('/product/create', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function addProductDetails(
  productId: number,
  payload: ProductDetailsPayload,
  token: string,
) {
  return request<Product>(`/product/${productId}/details`, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function activateProduct(productId: number, token: string) {
  return request<Product>(`/product/${productId}/activate`, {
    method: 'POST',
    token,
  });
}

export async function deactivateProduct(productId: number, token: string) {
  return request<Product>(`/product/${productId}/deactivate`, {
    method: 'POST',
    token,
  });
}

export async function getProductEvents(productId: number) {
  return request<ProductEvent[]>(`/product/${productId}/events`, {
    method: 'GET',
  });
}

export function normalizeApiError(error: unknown): ApiClientError {
  return asApiError(error);
}
