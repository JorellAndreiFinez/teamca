const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

export const config = {
  frontendUrl: trimTrailingSlashes(
    import.meta.env.PUBLIC_FRONTEND_URL ||
      "https://teamca-frontend.vercel.app",
  ),
};
