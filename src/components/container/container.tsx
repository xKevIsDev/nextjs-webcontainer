"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { files } from '@/components/container/files'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Code, Play, TerminalIcon, Sun, Moon, Github, Twitter } from 'lucide-react'
import { motion } from 'framer-motion'
import { WebContainerLoader } from '@/components/container/loader'
import dynamic from 'next/dynamic'
import { WebContainer } from '@webcontainer/api'
import { FileExplorer } from './file-explorer'
import { AIChat } from '@/components/chat/ai-chat'

const DynamicWebContainer = dynamic(() => import('./dynamic-web-container'), { ssr: false })

type LoadingState = 'booting' | 'installing' | 'starting' | 'compiling' | 'ready' | 'error';

export default function Container() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>('booting');
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('src/app/page.tsx');
  const hasBooted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeEnvironment = async () => {
      if (hasBooted.current) return
      hasBooted.current = true

      if (!textareaRef.current || !iframeRef.current || !terminalRef.current) return

      const indexContent = (files.src as { directory: { app: { directory: { [key: string]: { file: { contents: string } } } } } })
        .directory.app.directory['page.tsx'].file.contents
        textareaRef.current.value = indexContent
      }

    initializeEnvironment()
  }, [])


  const handleFileSelect = useCallback(async (path: string) => {
    if (webcontainerInstance && textareaRef.current) {
      const contents = await webcontainerInstance.fs.readFile(path, 'utf-8');
      textareaRef.current.value = contents;
      setSelectedFile(path);
      console.log(path);
    }
  }, [webcontainerInstance]);

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} transition-colors duration-300`}>
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex w-full justify-between items-center transition-colors duration-300`}>
        <h1 className="text-2xl font-bold">
          NextJS WebContainer Example
        </h1>
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open('https://x.com/KevIsDev', '_blank')}
              className={` hover:text-blue-600 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              <Twitter size={18} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={` hover:text-blue-600 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              <Github size={18} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="text-blue-500 hover:text-blue-600 transition-colors duration-300"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col p-4 space-y-4">
        <ResizablePanelGroup direction="vertical" className="flex-grow rounded-lg overflow-hidden">
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="horizontal">
              {/* AI Chat Panel */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <AIChat webcontainerInstance={webcontainerInstance} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* File Explorer Panel */}
              <ResizablePanel defaultSize={15} minSize={10}>
                {webcontainerInstance && (
                  <FileExplorer
                    isDarkMode={isDarkMode}
                    webcontainerInstance={webcontainerInstance}
                    onFileSelect={handleFileSelect}
                  />
                )}
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* Editor Panel */}
              <ResizablePanel defaultSize={35} minSize={20}>
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-none shadow-md overflow-hidden transition-colors duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} p-2 flex justify-between items-center transition-colors duration-300`}>
                    <span className="flex items-center"><Code size={18} className="mr-2" /> Editor</span>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    className={`w-full h-[calc(100%-40px)] rounded-t-none rounded-br-none p-4 border-none font-mono text-sm resize-none focus:outline-none ${
                      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                    } transition-colors duration-300`}
                  />
                </motion.div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* Preview Panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg rounded-bl-none rounded-tl-none shadow-md overflow-hidden transition-colors duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} p-2 flex items-center transition-colors duration-300`}>
                    <Play size={18} className="mr-2" /> Preview
                  </div>
                  {loadingState !== 'ready' && (
                      <WebContainerLoader state={loadingState} />
                  )}
                  <iframe ref={iframeRef} className="w-full h-[calc(100%-40px)]" />
                </motion.div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25}>
            <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-300`}>
              <div
                className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} p-2 flex justify-between items-center transition-colors duration-300`}
              >
                <span className="flex items-center"><TerminalIcon size={18} className="mr-2" /> Terminal</span>
              </div>
              <div className="flex-grow overflow-hidden">
                <div ref={terminalRef} className="h-full w-full"></div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <DynamicWebContainer
        textareaRef={textareaRef}
        iframeRef={iframeRef}
        terminalRef={terminalRef}
        isDarkMode={isDarkMode}
        setLoadingState={setLoadingState}
        selectedFile={selectedFile}
        webcontainerInstance={webcontainerInstance}
        setWebcontainerInstance={setWebcontainerInstance}
      />
    </div>
  )
}