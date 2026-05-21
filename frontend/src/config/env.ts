const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

export const config = {
  backendUrl: trimTrailingSlashes(
    import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3000",
  ),
};
