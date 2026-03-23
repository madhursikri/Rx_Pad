export type ApiErrorResponse = {
  message?: string;
  fieldErrors?: Record<string, string>;
  warnings?: string[];
};

export type ApiResponse<T> = T & ApiErrorResponse;
