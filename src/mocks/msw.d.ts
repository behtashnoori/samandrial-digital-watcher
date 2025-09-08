declare module "msw" {
  export const http: unknown;
  export const HttpResponse: unknown;
}

declare module "msw/browser" {
  export const setupWorker: (...handlers: unknown[]) => unknown;
}
