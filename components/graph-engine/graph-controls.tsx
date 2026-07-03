"use client";

import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Shuffle, SkipBack, SkipForward, Trash2, Zap } from "lucide-react";

type SpeedLevel = "slow" | "medium" | "fast";

type GraphControlsProps = {
  startDisabled?: boolean;
  pauseDisabled?: boolean;
  resumeDisabled?: boolean;
  resetDisabled?: boolean;
  stepBackDisabled?: boolean;
  stepForwardDisabled?: boolean;
  speedDisabled?: boolean;
  generateDisabled?: boolean;
  clearDisabled?: boolean;
  speed: SpeedLevel;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSpeedChange: (speed: SpeedLevel) => void;
  onGenerateRandomGraph: () => void;
  onClearGraph: () => void;
  startTooltip?: string;
  pauseTooltip?: string;
  resumeTooltip?: string;
  resetTooltip?: string;
  stepBackTooltip?: string;
  stepForwardTooltip?: string;
  speedTooltip?: string;
  generateTooltip?: string;
  clearTooltip?: string;
};

const buttonBase = "rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton = `${buttonBase} bg-[#7D8F3B] text-white hover:bg-[#556B2F]`;
const secondaryButton = `${buttonBase} border border-[#D8CCA3] bg-white text-[#556B2F] hover:bg-[#F1E8C7]`;

function TooltipButton({
  title,
  disabled,
  className,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={title}
      aria-label={title}
    >
      {children}
    </motion.button>
  );
}

export function GraphControls({
  startDisabled,
  pauseDisabled,
  resumeDisabled,
  resetDisabled,
  stepBackDisabled,
  stepForwardDisabled,
  speedDisabled,
  generateDisabled,
  clearDisabled,
  speed,
  onStart,
  onPause,
  onResume,
  onReset,
  onStepBack,
  onStepForward,
  onSpeedChange,
  onGenerateRandomGraph,
  onClearGraph,
  startTooltip = "Start the algorithm",
  pauseTooltip = "Pause the algorithm",
  resumeTooltip = "Resume the algorithm",
  resetTooltip = "Reset the algorithm state",
  stepBackTooltip = "Step backward",
  stepForwardTooltip = "Step forward",
  speedTooltip = "Adjust animation speed",
  generateTooltip = "Generate a random graph",
  clearTooltip = "Clear the current graph",
}: GraphControlsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <TooltipButton title={startTooltip} disabled={startDisabled} className={primaryButton} onClick={onStart}>
          <Play className="mr-1 inline h-4 w-4" /> Start
        </TooltipButton>
        <TooltipButton title={pauseTooltip} disabled={pauseDisabled} className={secondaryButton} onClick={onPause}>
          <Pause className="mr-1 inline h-4 w-4" /> Pause
        </TooltipButton>
        <TooltipButton title={resumeTooltip} disabled={resumeDisabled} className={secondaryButton} onClick={onResume}>
          <Play className="mr-1 inline h-4 w-4" /> Resume
        </TooltipButton>
        <TooltipButton title={resetTooltip} disabled={resetDisabled} className={secondaryButton} onClick={onReset}>
          <RotateCcw className="mr-1 inline h-4 w-4" /> Reset
        </TooltipButton>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TooltipButton title={stepBackTooltip} disabled={stepBackDisabled} className={secondaryButton} onClick={onStepBack}>
          <SkipBack className="mr-1 inline h-4 w-4" /> Step Back
        </TooltipButton>
        <TooltipButton title={stepForwardTooltip} disabled={stepForwardDisabled} className={secondaryButton} onClick={onStepForward}>
          <SkipForward className="mr-1 inline h-4 w-4" /> Step Forward
        </TooltipButton>
      </div>

      <div className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2" title={speedTooltip}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#556B2F]">Slow</span>
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={speed === "slow" ? 0 : speed === "medium" ? 1 : 2}
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              onSpeedChange(value === 0 ? "slow" : value === 1 ? "medium" : "fast");
            }}
            disabled={speedDisabled}
            className="min-w-0 flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-60"
          />
          <span className="text-xs font-medium text-[#556B2F]">Fast</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TooltipButton title={generateTooltip} disabled={generateDisabled} className={primaryButton} onClick={onGenerateRandomGraph}>
          <Shuffle className="mr-1 inline h-4 w-4" /> Generate Random Graph
        </TooltipButton>
        <TooltipButton title={clearTooltip} disabled={clearDisabled} className={secondaryButton} onClick={onClearGraph}>
          <Trash2 className="mr-1 inline h-4 w-4" /> Clear Graph
        </TooltipButton>
      </div>
    </div>
  );
}
