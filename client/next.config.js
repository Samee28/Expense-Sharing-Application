/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/:path*'
        }
      ]
    };
  },
  turbopack: {
    root: '.'
  }
};

module.exports = nextConfig;
