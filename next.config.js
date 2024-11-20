/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

/** @type {import("next").NextConfig} */
const config = {
  i18n: {
    locales: ['en', 'pl'], // Add as many languages as needed
    defaultLocale: 'en', // Set your default language
  },
};


export default config;
