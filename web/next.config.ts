import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // El CSV del catálogo se lee con ruta relativa a process.cwd();
  // hay que incluirlo explícitamente en el bundle serverless.
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
