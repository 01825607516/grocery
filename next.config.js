const adminOrigin = (process.env.DOKANI_ADMIN_ORIGIN || "http://localhost:8000").replace(/\/$/, "");

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/admin/login", destination: `${adminOrigin}/admin/login` },
        { source: "/admin/logout", destination: `${adminOrigin}/admin/logout` },
        { source: "/admin/api/:path*", destination: `${adminOrigin}/admin/api/:path*` },
      ],
    };
  },
};
