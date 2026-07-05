import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Los stores leen data/*.json con rutas relativas a process.cwd();
  // hay que incluirlos explícitamente en el bundle serverless.
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
