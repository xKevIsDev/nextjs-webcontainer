"use client"

import { useEffect, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { files } from '@/components/container/files'
import '@xterm/xterm/css/xterm.css'
import { terminalMonitor } from '@/lib/terminal-monitor'

type LoadingState = 'booting' | 'installing' | 'starting' | 'compiling' | 'ready' | 'error';

interface DynamicWebContainerProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  iframeRef: React.RefObject<HTMLIFrameElement>
  terminalRef: React.RefObject<HTMLDivElement>
  isDarkMode: boolean
  setLoadingState: React.Dispatch<React.SetStateAction<LoadingState>>
  selectedFile: string
  webcontainerInstance: WebContainer | null
  setWebcontainerInstance: (instance: WebContainer | null) => void;
}

let webcontainerInstance: WebContainer;

export default function DynamicWebContainer({
  textareaRef,
  iframeRef,
  terminalRef,
  isDarkMode,
  setLoadingState,
  selectedFile,
  webcontainerInstance,
  setWebcontainerInstance
}: DynamicWebContainerProps) {
  const fitAddonRef = useRef<FitAddon | null>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const hasBooted = useRef(false)

  useEffect(() => {
    const initializeWebContainer = async () => {
      if (hasBooted.current) return
      hasBooted.current = true

      if (!textareaRef.current || !iframeRef.current || !terminalRef.current) return

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
        // Expose terminal monitor globally
        if (typeof window !== 'undefined') {
          (window as any).terminalMonitor = terminalMonitor;
        }

        setLoadingState('booting');
        webcontainerInstance = await WebContainer.boot()
        await webcontainerInstance.mount(files)
        setWebcontainerInstance(webcontainerInstance)

        setLoadingState('installing');
        terminalInstanceRef.current?.writeln('Installing dependencies...')
        await installDependencies(terminalInstanceRef.current, webcontainerInstance)
        
        setLoadingState('starting');
        terminalInstanceRef.current?.writeln('Starting Next.js dev server...')
        const serverProcess = await startDevServer(terminalInstanceRef.current, webcontainerInstance);

        await startShell(terminalInstanceRef.current, webcontainerInstance);

        let isStarting = false;
        let isCompiling = false;
        let isFirstRequest = false;
        let isFirstRecompile = true;
        let isServerReady = false;
        let compilationStartTime: number | null = null;

        serverProcess.output.pipeTo(new WritableStream({
          write(data) {
            terminalInstanceRef.current?.write(data);

            if (data.includes('Starting...') && !isStarting && !isServerReady) {
              isStarting = true;
              setLoadingState('starting');
            }
            
            if (data.includes('Compiling')) {
              if (!isCompiling) {
                isCompiling = true;
                compilationStartTime = Date.now();
                setLoadingState('compiling');
                terminalInstanceRef.current?.writeln('\r\nCompiling...');
                
                if (isFirstRecompile) {
                  terminalInstanceRef.current?.writeln('First recompilation might take longer...');
                  isFirstRecompile = false;
                }
              }
            }
            
            if (data.includes('Compiled')) {
              if (isCompiling && compilationStartTime) {
                const compilationTime = Date.now() - compilationStartTime;
                isCompiling = false;
                setLoadingState('ready');
                terminalInstanceRef.current?.writeln(`\r\nCompiled successfully in ${compilationTime}ms.`);
                compilationStartTime = null;
              }
            }
            
            if (data.includes('GET / ') && !isFirstRequest) {
              isFirstRequest = true;
              setLoadingState('ready');
            }
          }
        }));

        webcontainerInstance.on("server-ready", (port, url) => {
          isServerReady = true;
          terminalInstanceRef.current?.writeln(`Server is ready at ${url}`)
          if (iframeRef.current) iframeRef.current.src = url
          setLoadingState('ready')
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

    initializeWebContainer()
  }, [isDarkMode, setLoadingState, iframeRef, terminalRef, textareaRef])

  useEffect(() => {
    const handleTextareaInput = (e: Event) => {
      if (e.currentTarget instanceof HTMLTextAreaElement) {
        writeIndexTSX(selectedFile, e.currentTarget.value);
      }
    };

    textareaRef.current?.addEventListener("input", handleTextareaInput);

    return () => {
      textareaRef.current?.removeEventListener("input", handleTextareaInput);
    };
  }, [textareaRef, selectedFile]);

  async function installDependencies(terminal: Terminal, instance: WebContainer) {
    const installProcess = await instance.spawn('npm', ['install'])
    return new Promise<void>((resolve) => {
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data)
            // Also capture to terminal monitor
            if (typeof window !== 'undefined' && (window as any).terminalMonitor) {
              (window as any).terminalMonitor.write(data);
            }
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
          // Also capture to terminal monitor
          if (typeof window !== 'undefined' && (window as any).terminalMonitor) {
            (window as any).terminalMonitor.write(data);
          }
        },
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data) => {
      input.write(data)
    })

    return shellProcess
  }

  async function writeIndexTSX(selectedFile: string, content: string) {
    await webcontainerInstance?.fs.writeFile(selectedFile, content);
  }

  return null;
}