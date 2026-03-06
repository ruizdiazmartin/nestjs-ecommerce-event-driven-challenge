export type ApiEnvelope<T> = {
  isSuccess: boolean;
  message: string;
  data: T;
  errorCode: string | null;
  errors: string[];
};

export type ApiError = {
  message: string;
  errorCode: string | null;
  errors: string[];
};

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export type Role = {
  id: number;
  name: string;
};

export type UserProfile = {
  id: number;
  email: string;
  roles: Role[];
};

export type AuthResponse = {
  accessToken: string;
};

export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  code?: string | null;
  title?: string | null;
  variationType?: string | null;
  description?: string | null;
  about?: string[] | null;
  details?: Record<string, unknown> | null;
  isActive: boolean;
  activatedAt?: string | null;
  merchantId?: number | null;
  categoryId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductEvent = {
  id: number;
  productId: number;
  type: string;
  payload?: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type AssignRolePayload = {
  userId: number;
  roleId: number;
};

export type CreateProductPayload = {
  categoryId: number;
  title: string;
  code: string;
  variationType: string;
  description: string;
  about: string[];
  details: Record<string, unknown>;
};

export type ProductDetailsPayload = {
  title: string;
  code: string;
  variationType: string;
  description: string;
  about: string[];
  details: Record<string, unknown>;
};
