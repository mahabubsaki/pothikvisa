import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['node:sqlite', 'ddddocr-node', 'sharp', '@browserbasehq/stagehand', 'tesseract.js', 'mrz'],
};

export default withNextIntl(nextConfig);
