import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // O objeto 'experimental' foi removido porque a chave não é mais válida
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**', // Permite qualquer caminho de imagem dentro desse domínio
      },
    ],
  },
};

export default nextConfig;