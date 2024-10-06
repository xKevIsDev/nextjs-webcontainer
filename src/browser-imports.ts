export const loadBrowserModules = async () => {
    if (typeof window === 'undefined') return null;
  
    const { Terminal } = await import('@xterm/xterm')
    const { FitAddon } = await import('@xterm/addon-fit')
    await import('@xterm/xterm/css/xterm.css')
    const { WebContainer } = await import('@webcontainer/api')
  
    return { Terminal, FitAddon, WebContainer }
  }