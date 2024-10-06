"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { useState, useEffect } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  currentStep = 0,
}: {
  loadingStates: LoadingState[];
  currentStep: number;
}) => {
  return (
    <div className="flex relative justify-start w-full mx-auto flex-col">
      {loadingStates.map((loadingState, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <motion.div
            key={index}
            className={cn("text-left flex gap-2 mb-4")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div>
              {isCompleted ? (
                <CheckFilled className="fill-gray-400 bor h-6 w-6" />
              ) : isCurrent ? (
                <CheckFilled className="fill-green-400 text-white-400 h-6 w-6" />
              ) : (
                <CheckIcon className="text-gray-300 h-6 w-6" />
              )}
            </div>
            <span
              className={cn(
                "text-gray-300 dark:text-gray-300",
                isCompleted && "text-gray-400",
                isCurrent && "text-green-400"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  currentStep = 0,
}: {
  loadingStates: LoadingState[];
  loading: boolean;
  currentStep: number;
}) => {
  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full flex items-center justify-center text-normal "
        >
          <div className="h-full flex items-center justify-center ">
            <LoaderCore loadingStates={loadingStates} currentStep={currentStep} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
