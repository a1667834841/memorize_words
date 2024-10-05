/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
          config.externals.push('@prisma/client')
        }
        return config
      }
};

export default nextConfig;
