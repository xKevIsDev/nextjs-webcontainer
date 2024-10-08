"use client"

import React, { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, ChevronDown, Plus, Trash, Edit, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WebContainer } from '@webcontainer/api'

interface FileSystemEntry {
  name: string
  type: 'file' | 'directory'
  children?: FileSystemEntry[]
}

interface FileExplorerProps {
  webcontainerInstance: WebContainer
  onFileSelect: (path: string) => void
  isDarkMode: boolean
}

export function FileExplorer({ webcontainerInstance, onFileSelect, isDarkMode }: FileExplorerProps) {
  const [fileSystem, setFileSystem] = useState<FileSystemEntry[]>([])
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false)
  const [newItemType, setNewItemType] = useState<'file' | 'directory' | null>(null)

  useEffect(() => {
    loadFileSystem()
    const intervalId = setInterval(loadFileSystem, 5000) // Poll for changes every 5 seconds
    return () => clearInterval(intervalId)
  }, [])

  async function loadFileSystem(path = '/') {
    try {
      const entries = await webcontainerInstance.fs.readdir(path, { withFileTypes: true })
      const fileSystemEntries: FileSystemEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = `${path}${entry.name}`
          if (entry.isDirectory()) {
            const children = await loadFileSystem(entryPath + '/')
            return { name: entry.name, type: 'directory', children }
          }
          return { name: entry.name, type: 'file' }
        })
      )
      if (path === '/') {
        setFileSystem(fileSystemEntries)
      }
      return fileSystemEntries
    } catch (error) {
      console.error('Error loading file system:', error)
      return []
    }
  }

  async function handleCreateItem(path: string, isDirectory: boolean) {
    if (!newItemName) return
    const fullPath = `${path}${newItemName}`
    try {
      if (isDirectory) {
        await webcontainerInstance.fs.mkdir(fullPath)
      } else {
        await webcontainerInstance.fs.writeFile(fullPath, '')
      }
      setNewItemName('')
      setIsCreatingNewItem(false)
      setNewItemType(null)
      loadFileSystem()
    } catch (error) {
      console.error(`Error creating ${isDirectory ? 'directory' : 'file'}:`, error)
    }
  }

  async function handleDeleteEntry(path: string) {
    try {
      await webcontainerInstance.fs.rm(path, { recursive: true })
      loadFileSystem()
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  async function handleRenameEntry(oldPath: string, newName: string) {
    const newPath = oldPath.split('/').slice(0, -1).concat(newName).join('/')
    try {
      await webcontainerInstance.fs.rename(oldPath, newPath)
      setEditingPath(null)
      loadFileSystem()
    } catch (error) {
      console.error('Error renaming entry:', error)
    }
  }

  function renderFileSystem(entries: FileSystemEntry[], currentPath = '/') {
    return entries.map((entry) => (
      <FileExplorerItem
        key={`${currentPath}${entry.name}`}
        entry={entry}
        path={currentPath}
        onFileSelect={onFileSelect}
        onCreateItem={handleCreateItem}
        onDeleteEntry={handleDeleteEntry}
        onRenameEntry={handleRenameEntry}
        editingPath={editingPath}
        setEditingPath={setEditingPath}
        isDarkMode={isDarkMode}
      />
    ))
  }

  return (
    <div className={`rounded-lg rounded-br-none h-full flex flex-col ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-2 text-sm font-semibold uppercase tracking-wide flex justify-between items-center`}>
        <span>Explorer</span>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => {
              setIsCreatingNewItem(true)
              setNewItemType('file')
            }}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => {
              setIsCreatingNewItem(true)
              setNewItemType('directory')
            }}
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-2">
          {isCreatingNewItem && (
            <div className="flex items-center mb-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={newItemType === 'file' ? 'New file name' : 'New folder name'}
                className={`flex-grow mr-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateItem('/', newItemType === 'directory')
                  }
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => {
                  setIsCreatingNewItem(false)
                  setNewItemType(null)
                }}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          )}
          {renderFileSystem(fileSystem)}
        </div>
      </ScrollArea>
    </div>
  )
}

interface FileExplorerItemProps {
  entry: FileSystemEntry
  path: string
  onFileSelect: (path: string) => void
  onCreateItem: (path: string, isDirectory: boolean) => void
  onDeleteEntry: (path: string) => void
  onRenameEntry: (oldPath: string, newName: string) => void
  editingPath: string | null
  setEditingPath: (path: string | null) => void
  isDarkMode: boolean
}

function FileExplorerItem({
  entry,
  path,
  onFileSelect,
  onCreateItem,
  onDeleteEntry,
  onRenameEntry,
  editingPath,
  setEditingPath,
  isDarkMode
}: FileExplorerItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState(entry.name)

  const toggleOpen = () => {
    if (entry.type === 'directory') {
      setIsOpen(!isOpen)
    }
  }

  const handleFileSelect = () => {
    if (entry.type === 'file') {
      onFileSelect(`${path}${entry.name}`)
    }
  }

  const isEditing = editingPath === `${path}${entry.name}`

  return (
    <div className="text-sm">
      <div className={`flex items-center group py-1 px-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
        <div className="flex items-center flex-grow cursor-pointer" onClick={toggleOpen}>
          {entry.type === 'directory' && (
            <span className="mr-1">
              {isOpen ? (
                <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
            </span>
          )}
          {entry.type === 'directory' ? (
            <Folder className="w-4 h-4 mr-1 text-blue-500" />
          ) : (
            <File className={`w-4 h-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
          {isEditing ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => onRenameEntry(`${path}${entry.name}`, newName)}
              onKeyPress={(e) => e.key === 'Enter' && onRenameEntry(`${path}${entry.name}`, newName)}
              className={`w-32 h-6 px-1 py-0 text-sm ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'
              }`}
              autoFocus
            />
          ) : (
            <span onClick={handleFileSelect}>{entry.name}</span>
          )}
        </div>
        <div className="hidden group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setEditingPath(`${path}${entry.name}`)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => onDeleteEntry(`${path}${entry.name}`)}
          >
            <Trash className="w-3 h-3" />
          </Button>
          {entry.type === 'directory' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => onCreateItem(`${path}${entry.name}/`, false)}
              >
                <FileText className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-6 h-6 ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => onCreateItem(`${path}${entry.name}/`, true)}
              >
                <Folder className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      {isOpen && entry.children && (
        <div className="ml-4">
          {entry.children.map((child) => (
            <FileExplorerItem
              key={`${path}${entry.name}/${child.name}`}
              entry={child}
              path={`${path}${entry.name}/`}
              onFileSelect={onFileSelect}
              onCreateItem={onCreateItem}
              onDeleteEntry={onDeleteEntry}
              onRenameEntry={onRenameEntry}
              editingPath={editingPath}
              setEditingPath={setEditingPath}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}