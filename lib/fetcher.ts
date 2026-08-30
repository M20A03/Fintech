export interface FetcherOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  idempotent?: boolean;
  actionName?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Global Toast Dispatcher Event
export function dispatchGlobalToast(type: 'error' | 'warning' | 'info' | 'success', message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('akoin_toast', {
        detail: { type, message, timestamp: Date.now() },
      })
    );
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetcher<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    timeoutMs = 8000,
    retries = 3,
    backoffMs = 500,
    idempotent = false,
    actionName = 'req',
    headers: customHeaders = {},
    ...restOptions
  } = options;

  const headers = new Headers(customHeaders);
  headers.set('Accept', 'application/json');

  if (idempotent && !headers.has('Idempotency-Key')) {
    const key = `${actionName}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    headers.set('Idempotency-Key', key);
  }

  if (restOptions.body && typeof restOptions.body === 'object' && !(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    restOptions.body = JSON.stringify(restOptions.body);
  }

  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 401 Unauthorized: Redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          dispatchGlobalToast('error', 'Session expired. Please sign in again.');
          setTimeout(() => {
            window.location.href = `/login?return_to=${encodeURIComponent(window.location.pathname)}`;
          }, 1000);
        }
        throw new ApiError('Unauthorized session', 401, 'AUTH_EXPIRED');
      }

      // 403 Forbidden
      if (response.status === 403) {
        dispatchGlobalToast('error', 'Access forbidden: Insufficient permissions.');
        throw new ApiError('Forbidden resource', 403, 'FORBIDDEN');
      }

      // 5xx Server Errors (Eligible for retry)
      if (response.status >= 500) {
        throw new ApiError(`Server responded with status ${response.status}`, response.status);
      }

      // 4xx Client Errors (Non-retryable)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed with status ${response.status}`;
        dispatchGlobalToast('error', message);
        throw new ApiError(message, response.status, errorData.code, errorData);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      attempt++;

      const isAbort = (err as Error)?.name === 'AbortError';
      const isNetworkOr5xx = err instanceof ApiError ? err.status >= 500 : true;

      if (attempt > retries || (!isNetworkOr5xx && !isAbort)) {
        const finalMessage = isAbort
          ? 'Network request timed out. Please check your connection.'
          : (err as Error).message || 'An unexpected error occurred.';
        
        dispatchGlobalToast('error', finalMessage);
        throw err;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 200;
      const delay = backoffMs * Math.pow(2, attempt - 1) + jitter;
      await sleep(delay);
    }
  }

  throw new ApiError('Maximum retry attempts exceeded', 504, 'TIMEOUT');
}
