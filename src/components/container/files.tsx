import { FileSystemTree } from '@webcontainer/api';

export const files: FileSystemTree = {
  src: {
    directory: {
      components: {
        directory: {
          ui:{
            directory: {
              'background-beams-with-collision.tsx': {
                file: {
                  contents: `"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

export const BackgroundBeamsWithCollision = ({
children,
className,
}: {
children: React.ReactNode;
className?: string;
}) => {
const containerRef = useRef<HTMLDivElement>(null);
const parentRef = useRef<HTMLDivElement>(null);

const beams = [
{
  initialX: 10,
  translateX: 10,
  duration: 7,
  repeatDelay: 3,
  delay: 2,
},
{
  initialX: 600,
  translateX: 600,
  duration: 3,
  repeatDelay: 3,
  delay: 4,
},
{
  initialX: 100,
  translateX: 100,
  duration: 7,
  repeatDelay: 7,
  className: "h-6",
},
{
  initialX: 400,
  translateX: 400,
  duration: 5,
  repeatDelay: 14,
  delay: 4,
},
{
  initialX: 800,
  translateX: 800,
  duration: 11,
  repeatDelay: 2,
  className: "h-20",
},
{
  initialX: 1000,
  translateX: 1000,
  duration: 4,
  repeatDelay: 2,
  className: "h-12",
},
{
  initialX: 1200,
  translateX: 1200,
  duration: 6,
  repeatDelay: 4,
  delay: 2,
  className: "h-6",
},
];

return (
<div
  ref={parentRef}
  className={cn(
    "h-96 md:h-[40rem] bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-neutral-800 relative flex items-center w-full justify-center overflow-hidden",
    // h-screen if you want bigger
    className
  )}
>
  {beams.map((beam) => (
    <CollisionMechanism
      key={beam.initialX + "beam-idx"}
      beamOptions={beam}
      containerRef={containerRef}
      parentRef={parentRef}
    />
  ))}

  {children}
  <div
    ref={containerRef}
    className="absolute bottom-0 bg-neutral-100 w-full inset-x-0 pointer-events-none"
    style={{
      boxShadow:
        "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
    }}
  ></div>
</div>
);
};

const CollisionMechanism = React.forwardRef<
HTMLDivElement,
{
containerRef: React.RefObject<HTMLDivElement>;
parentRef: React.RefObject<HTMLDivElement>;
beamOptions?: {
  initialX?: number;
  translateX?: number;
  initialY?: number;
  translateY?: number;
  rotate?: number;
  className?: string;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
};
}
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
const beamRef = useRef<HTMLDivElement>(null);
const [collision, setCollision] = useState<{
detected: boolean;
coordinates: { x: number; y: number } | null;
}>({
detected: false,
coordinates: null,
});
const [beamKey, setBeamKey] = useState(0);
const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

useEffect(() => {
const checkCollision = () => {
  if (
    beamRef.current &&
    containerRef.current &&
    parentRef.current &&
    !cycleCollisionDetected
  ) {
    const beamRect = beamRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const parentRect = parentRef.current.getBoundingClientRect();

    if (beamRect.bottom >= containerRect.top) {
      const relativeX =
        beamRect.left - parentRect.left + beamRect.width / 2;
      const relativeY = beamRect.bottom - parentRect.top;

      setCollision({
        detected: true,
        coordinates: {
          x: relativeX,
          y: relativeY,
        },
      });
      setCycleCollisionDetected(true);
    }
  }
};

const animationInterval = setInterval(checkCollision, 50);

return () => clearInterval(animationInterval);
}, [cycleCollisionDetected, containerRef]);

useEffect(() => {
if (collision.detected && collision.coordinates) {
  setTimeout(() => {
    setCollision({ detected: false, coordinates: null });
    setCycleCollisionDetected(false);
  }, 2000);

  setTimeout(() => {
    setBeamKey((prevKey) => prevKey + 1);
  }, 2000);
}
}, [collision]);

return (
<>
  <motion.div
    key={beamKey}
    ref={beamRef}
    animate="animate"
    initial={{
      translateY: beamOptions.initialY || "-200px",
      translateX: beamOptions.initialX || "0px",
      rotate: beamOptions.rotate || 0,
    }}
    variants={{
      animate: {
        translateY: beamOptions.translateY || "1800px",
        translateX: beamOptions.translateX || "0px",
        rotate: beamOptions.rotate || 0,
      },
    }}
    transition={{
      duration: beamOptions.duration || 8,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      delay: beamOptions.delay || 0,
      repeatDelay: beamOptions.repeatDelay || 0,
    }}
    className={cn(
      "absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent",
      beamOptions.className
    )}
  />
  <AnimatePresence>
    {collision.detected && collision.coordinates && (
      <Explosion
        key={\`\${collision.coordinates.x}-\${collision.coordinates.y}\`}
        className=""
        style={{
          left: \`\${collision.coordinates.x}px\`,
          top: \`\${collision.coordinates.y}px\`,
          transform: "translate(-50%, -50%)",
        }}
      />
    )}
  </AnimatePresence>
</>
);
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
const spans = Array.from({ length: 20 }, (_, index) => ({
id: index,
initialX: 0,
initialY: 0,
directionX: Math.floor(Math.random() * 80 - 40),
directionY: Math.floor(Math.random() * -50 - 10),
}));

return (
<div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1.5, ease: "easeOut" }}
    className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
  ></motion.div>
  {spans.map((span) => (
    <motion.span
      key={span.id}
      initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
      animate={{
        x: span.directionX,
        y: span.directionY,
        opacity: 0,
      }}
      transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
      className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
    />
  ))}
</div>
);
};
`
                }
              }
            }
          }
        }
      },
      lib: {
        directory: {
          "utils.ts": {
            file: {
              contents: `import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}`
            }
          }
        }
      },
      app: {
        directory: {
          'layout.tsx': {
            file: {
              contents: `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Next.js WebContainer Example',
  description: 'A Next.js app running in a WebContainer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
            }
          },
          'page.tsx': {
            file: {
              contents: `"use client"
import { NextPage } from 'next'
import React from 'react'
import { motion } from 'framer-motion'
import { Github, Twitter } from 'lucide-react'
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

const Home: NextPage = () => {
  return (
  <BackgroundBeamsWithCollision className="h-screen">
      <h2 className="flex flex-col items-center jusify-center text-5xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
        NextJS Web Container!{" "}
        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-blue-500 to-green-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
            <span className="">By KevIsDev.</span>
          </div>
          <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 py-4">
            <span className="">By KevIsDev.</span>
          </div>
        </div>
      </h2>
    </BackgroundBeamsWithCollision>
  )
}

export default Home


`
            }
          },

          'globals.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`
            }
          }
        }
      }
    }
  },
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: "nextjs-webcontainer-example",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          "next": "14.2.14",
          "react": "^18",
          "react-dom": "^18",
          "lucide-react": "latest",
          "framer-motion": "latest",
          "clsx": "latest",
          "tailwind-merge": "latest",
          "@tabler/icons": "latest"
        },
        devDependencies: {
          "typescript": "latest",
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest",
          "autoprefixer": "^10.4.20",
          "postcss": "^8.4.49",
          "tailwindcss": "^3.4.1"
        }
      }, null, 2)
    }
  },
  'tsconfig.json': {
    file: {
      contents: JSON.stringify({
        compilerOptions: {
          "lib": ["dom", "dom.iterable", "esnext"],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "incremental": true,
          "plugins": [
            {
              "name": "next"
            }
          ],
          "paths": {
            "@/*": ["./src/*"]
          }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "src/custom.d.ts"],
        "exclude": ["node_modules"]
      }, null, 2)
    }
  },
  'next.config.js': {
    file: {
      contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`
    }
  },
  'postcss.config.js': {
    file: {
      contents: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    }
  },
  'tailwind.config.ts': {
    file: {
      contents: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config`
    }
  },
  'next-env.d.ts': {
    file: {
      contents: `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.`
    }
  }
};