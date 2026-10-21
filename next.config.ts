import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,

  webpack(webpackConfig) {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,

      // Всегда использовать браузерную сборку jsmediatags
      'jsmediatags$': path.resolve(
        process.cwd(),
        'node_modules/jsmediatags/dist/jsmediatags.min.js'
      ),

      // Нативный модуль React Native не нужен в браузере
      'react-native-fs': false,
    };

    return webpackConfig;
  },
};

export default config;
