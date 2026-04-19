export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*", "/collections/:path*", "/settings/:path*"],
};
