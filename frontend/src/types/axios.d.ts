declare module 'axios' {
  export interface AxiosRequestHeaders {
    [key: string]: string | undefined;
    Authorization?: string;
    'Content-Type'?: string;
  }

  export interface InternalAxiosRequestConfig {
    baseURL?: string;
    headers: AxiosRequestHeaders;
    [key: string]: unknown;
  }

  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, unknown>;
    config: InternalAxiosRequestConfig;
  }

  export interface AxiosError<T = unknown> extends Error {
    code?: string;
    response?: AxiosResponse<T>;
    config?: InternalAxiosRequestConfig;
    isAxiosError?: boolean;
  }

  export interface InterceptorManager<V> {
    use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: AxiosError) => unknown): number;
  }

  export interface AxiosInstance {
    interceptors: {
      request: InterceptorManager<InternalAxiosRequestConfig>;
      response: InterceptorManager<AxiosResponse>;
    };
    get<T = unknown>(url: string, config?: InternalAxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = unknown>(url: string, config?: InternalAxiosRequestConfig): Promise<AxiosResponse<T>>;
  }

  export interface AxiosStatic {
    create(config?: InternalAxiosRequestConfig): AxiosInstance;
  }

  const axios: AxiosStatic;
  export default axios;
}