
/**
 * Common types for Portal da Transparência API clients
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}
