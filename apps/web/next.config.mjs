/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compile the workspace package that ships TypeScript/CJS source.
  transpilePackages: ['@unidriver/shared'],
  // Lint is enforced via the monorepo ESLint config, not during Next builds.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
