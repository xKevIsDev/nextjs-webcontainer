"use client"

import { useEffect, useRef, useState } from 'react'
import { WebContainer } from '@webcontainer/api'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { files } from '@/components/container/files'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Code, Play, TerminalIcon, Sun, Moon, } from 'lucide-react'
import { motion } from 'framer-motion'
import { WebContainerLoader } from '@/components/container/loader'

type LoadingState = 'booting' | 'installing' | 'starting' | 'compiling' | 'ready' | 'error';
let webcontainerInstance: WebContainer;

export default function Container() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>('booting');
  const hasBooted = useRef(false)


  useEffect(() => {
    const initializeEnvironment = async () => {
      if (hasBooted.current) return
      hasBooted.current = true

      if (!textareaRef.current || !iframeRef.current || !terminalRef.current) return

      const indexContent = (files['pages'] as { directory: { [key: string]: { file: { contents: string } } } })
        .directory['index.tsx'].file.contents
      textareaRef.current.value = indexContent

      textareaRef.current.addEventListener("input", handleTextareaInput);

      fitAddonRef.current = new FitAddon()
      terminalInstanceRef.current = new Terminal({ 
        convertEol: true,
        theme: {
          background: isDarkMode ? '#1a202c' : '#ffffff',
          foreground: isDarkMode ? '#e2e8f0' : '#1a202c'
        }
      })
      terminalInstanceRef.current.loadAddon(fitAddonRef.current)
      terminalInstanceRef.current.open(terminalRef.current)
      fitAddonRef.current.fit()

      try {
        setLoadingState('booting');
        webcontainerInstance = await WebContainer.boot()
        await webcontainerInstance.mount(files)

        setLoadingState('installing');
        terminalInstanceRef.current?.writeln('Installing dependencies...')
        await installDependencies(terminalInstanceRef.current, webcontainerInstance)
        
        setLoadingState('starting');
        terminalInstanceRef.current?.writeln('Starting Next.js dev server...')
        const serverProcess = await startDevServer(terminalInstanceRef.current, webcontainerInstance);

        // Add this line to start the shell
        await startShell(terminalInstanceRef.current, webcontainerInstance);

        let isStarting = false;
        let isCompiling = false;
        let isFirstRequest = false;

        serverProcess.output.pipeTo(new WritableStream({
          write(data) {
            terminalInstanceRef.current?.write(data);
            
            if (data.includes('Starting...') && !isStarting) {
              isStarting = true;
              setLoadingState('starting');
            }
            
            if (data.includes('Compiling') && !isCompiling) {
              isCompiling = true;
              setLoadingState('compiling');
            }
            
            if (data.includes('Compiled') && isCompiling) {
              isCompiling = false;
            }
            
            if (data.includes('GET / ') && !isFirstRequest) {
              isFirstRequest = true;
              setLoadingState('ready');
            }
          }
        }));

        webcontainerInstance.on("server-ready", (port, url) => {
          terminalInstanceRef.current?.writeln(`Server is ready at ${url}`)
          if (iframeRef.current) iframeRef.current.src = url
        })
        
        const resizeObserver = new ResizeObserver(() => {
          if (fitAddonRef.current && terminalInstanceRef.current) {
            fitAddonRef.current.fit()
            if (webcontainerInstance) {
              webcontainerInstance.spawn("jsh", {
                terminal: {
                  cols: terminalInstanceRef.current.cols,
                  rows: terminalInstanceRef.current.rows,
                },
              })
            }
          }
        })

        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current)
        }

        return () => {
          resizeObserver.disconnect()
          terminalInstanceRef.current?.dispose()
          webcontainerInstance?.teardown()
          hasBooted.current = false
        }
      } catch (error) {
        console.error('Failed to boot WebContainer:', error)
        setLoadingState('error');
        terminalInstanceRef.current?.writeln(`Error: ${error}`)
      }
    }

    initializeEnvironment()
  }, [isDarkMode])

  const handleTextareaInput = (e: Event) => {
    if (e.currentTarget instanceof HTMLTextAreaElement) {
      writeIndexTSX(e.currentTarget.value);
    }
  };

  async function installDependencies(terminal: Terminal, instance: WebContainer) {
    const installProcess = await instance.spawn('npm', ['install'])
    return new Promise<void>((resolve) => {
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data)
          },
        })
      )
      installProcess.exit.then((exitCode) => {
        if (exitCode !== 0) {
          terminal.writeln(`\r\nInstallation failed with exit code ${exitCode}`)
        } else {
          terminal.writeln('\r\nInstallation completed successfully')
        }
        resolve()
      })
    })
  }

  async function startDevServer(terminal: Terminal, instance: WebContainer) {
    const serverProcess = await instance.spawn('npm', ['run', 'dev']);
    return serverProcess;
  }

  async function startShell(terminal: Terminal, instance: WebContainer) {
    const shellProcess = await instance.spawn("jsh", {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    })
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        },
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data) => {
      input.write(data)
    })

    return shellProcess
  }

  async function writeIndexTSX(content: string) {
    await webcontainerInstance?.fs.writeFile("/pages/index.tsx", content);
  }

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} transition-colors duration-300`}>
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex w-full justify-between items-center transition-colors duration-300`}>
        <h1 className="text-2xl font-bold">Next.js WebContainer Example</h1>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-extralight`}>by KevIsDev</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-blue-500 hover:text-blue-600 transition-colors duration-300"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>
      <main className="flex-grow flex flex-col p-4 space-y-4">
        <ResizablePanelGroup direction="vertical" className="flex-grow rounded-lg overflow-hidden">
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50}>
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg rounded-br-none shadow-md overflow-hidden transition-colors duration-300`}
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
              <ResizablePanel defaultSize={50}>
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg rounded-bl-none shadow-md overflow-hidden transition-colors duration-300`}
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
    </div>
  )
}