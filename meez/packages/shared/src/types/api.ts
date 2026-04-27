export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
