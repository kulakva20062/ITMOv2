import { fileURLToPath } from 'node:url';

const configDirectory = fileURLToPath(new URL('.', import.meta.url));

export default {
  plugins: {
    tailwindcss: {
      config: `${configDirectory}tailwind.config.js`,
    },
  },
};
