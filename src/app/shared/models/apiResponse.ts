export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T | null;
}