import { FileSystemTree } from '@webcontainer/api';

export const files: FileSystemTree = {
  'pages': {
    directory: {
      'index.tsx': {
        file: {
          contents: `
import { NextPage } from 'next'
import { motion } from 'framer-motion'
import { Github, Twitter } from 'lucide-react'

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center justify-center">
          <motion.h1 
            className="text-4xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to WebContainers
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            A Next.js app with TypeScript, made by KevIsDev! 🥳
          </motion.p>
          <motion.div 
            className="bg-gray-100 p-4 rounded-md mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <code className="text-sm text-purple-600">
              Edit pages/index.tsx to get started.
            </code>
          </motion.div>
          <motion.div 
            className="flex space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button variant="outline" className="flex flex-col items-center">
              <Github className="mr-2 h-4 w-4" /> GitHub
              <p className="font-thin text-xs">@KevIsDev</p>
            </button>
            <button variant="outline" className="flex flex-col items-center">
              <Twitter className="mr-2 h-4 w-4" /> Twitter
              <p className="font-thin text-xs">@KevIsDev</p>
            </button>
          </motion.div>
        </div>
        <motion.div 
          className="bg-gray-50 px-8 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-gray-500 text-center">
            Powered by WebContainers from @StackBlitz!
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Home

`
       }
      },
      '_app.tsx': {
        file: {
          contents: `
import '../styles/globals.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
`
        }
      }
    }
  },
  'components': {
    directory: {}
  },
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: "nextjs-webcontainer-app",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        },
        dependencies: {
          "next": "latest",
          "react": "latest",
          "react-dom": "latest",
          "framer-motion": "latest",
          "lucide-react": "latest"
        },
        devDependencies: {
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest",
          "typescript": "latest",
          "autoprefixer": "latest",
          "postcss": "latest",
          "tailwindcss": "latest"
        }
      }, null, 2)
    }
  },
  'tsconfig.json': {
    file: {
      contents: JSON.stringify({
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [
            {
              name: "next"
            }
          ],
          paths: {
            "@/*": ["./*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"]
      }, null, 2)
    }
  },
  'next.config.js': {
    file: {
      contents: `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`
    }
  },
  'next-env.d.ts': {
    file: {
      contents: `
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`
    }
  },
  'tailwind.config.js': {
    file: {
      contents: `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    }
  },
  'postcss.config.js': {
    file: {
      contents: `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    }
  },
  'styles': {
    directory: {
      'globals.css': {
        file: {
          contents: `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom styles here */
`
        }
      }
    }
  }
};