/** Shared shape for every paginated list endpoint (see PageResponse in the backend). */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
