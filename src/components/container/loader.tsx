"use client"

import React from "react"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"

type LoadingState = 'booting' | 'installing' | 'starting' | 'compiling' | 'ready' | 'error'

const loadingStates = [
  { text: "Booting WebContainer..." },
  { text: "Installing dependencies..." },
  { text: "Starting Next.js dev server..." },
  { text: "Compiling Next.js application..." },
  { text: "Ready!" },
]

interface WebContainerLoaderProps {
  state: LoadingState
}

export function WebContainerLoader({ state }: WebContainerLoaderProps) {
  const stateToStepMap: Record<LoadingState, number> = {
    booting: 0,
    installing: 1,
    starting: 2,
    compiling: 3,
    ready: 4,
    error: 4, // We'll use the last step for error state as well
  }

  const currentStep = stateToStepMap[state]
  const loading = state !== 'ready' && state !== 'error'

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="rounded-lg shadow-xl w-full h-full">
        <MultiStepLoader
          loadingStates={loadingStates}
          loading={loading}
          currentStep={currentStep}
        />
        {state === 'error' && (
          <p className="mt-4 text-center text-red-500 font-semibold">An error occurred</p>
        )}
      </div>
    </div>
  )
}