"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Annotation, Rectangle } from "./types/annotation"
import type React from "react"

export default function VideoAnnotator() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentRectangle, setCurrentRectangle] = useState<Rectangle | null>(null)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // New state for play/pause
  const [annotations, setAnnotations] = useState<Annotation[]>([]) // Added annotations state

  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const formatTimeStamp = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setCurrentRectangle({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    })
    setStartTime(formatTimeStamp(currentTime))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !overlayRef.current || !currentRectangle) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentRectangle({
      ...currentRectangle,
      endX: x,
      endY: y,
    })
  }

  const handleMouseUp = () => {
    if (isDrawing && currentRectangle) {
      setIsDrawing(false)
      setShowCommentInput(true)
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }

  const handleSave = () => {
    if (!currentRectangle || !startTime || !comment) return

    const annotation: Annotation = {
      id: Date.now().toString(),
      startTime,
      endTime: endTime || formatTimeStamp(currentTime),
      shape: currentRectangle,
      comment,
    }

    setAnnotations([...annotations, annotation]) // Update annotations state
    console.log(JSON.stringify(annotation, null, 2))

    // Reset state
    setCurrentRectangle(null)
    setStartTime(null)
    setEndTime(null)
    setComment("")
    setShowCommentInput(false)
  }

  // New function to handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying) // Toggle playing state
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>

        <div
          ref={overlayRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {annotations.map((annotation) => {
            const start =
              Number.parseFloat(annotation.startTime.split(":")[0]) * 60 +
              Number.parseFloat(annotation.startTime.split(":")[1])
            const end =
              Number.parseFloat(annotation.endTime.split(":")[0]) * 60 +
              Number.parseFloat(annotation.endTime.split(":")[1])

            if (currentTime >= start && currentTime <= end) {
              return (
                <div
                  key={annotation.id}
                  className="absolute border-2 border-orange-500"
                  style={{
                    left: Math.min(annotation.shape.startX, annotation.shape.endX),
                    top: Math.min(annotation.shape.startY, annotation.shape.endY),
                    width: Math.abs(annotation.shape.endX - annotation.shape.startX),
                    height: Math.abs(annotation.shape.endY - annotation.shape.startY),
                  }}
                />
              )
            }
            return null
          })}
          {currentRectangle && (
            <div
              className="absolute border-2 border-orange-500"
              style={{
                left: Math.min(currentRectangle.startX, currentRectangle.endX),
                top: Math.min(currentRectangle.startY, currentRectangle.endY),
                width: Math.abs(currentRectangle.endX - currentRectangle.startX),
                height: Math.abs(currentRectangle.endY - currentRectangle.startY),
              }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-600">
          {/* Video progress */}
          <div
            className="h-full bg-orange-500"
            style={{
              width: `${(currentTime / duration) * 100}%`,
            }}
          />

          {/* Annotation time range */}
          {startTime && (
            <div
              className="absolute bottom-0 h-full bg-orange-300/50"
              style={{
                left: `${((Number.parseFloat(startTime.split(":")[0]) * 60 + Number.parseFloat(startTime.split(":")[1])) / duration) * 100}%`,
                width: endTime
                  ? `${
                      ((Number.parseFloat(endTime.split(":")[0]) * 60 +
                        Number.parseFloat(endTime.split(":")[1]) -
                        (Number.parseFloat(startTime.split(":")[0]) * 60 +
                          Number.parseFloat(startTime.split(":")[1]))) /
                        duration) *
                      100
                    }%`
                  : `${((currentTime - (Number.parseFloat(startTime.split(":")[0]) * 60 + Number.parseFloat(startTime.split(":")[1]))) / duration) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Play/Pause button */}
      <div className="mt-4">
        <Button onClick={togglePlayPause} className="bg-orange-500 hover:bg-orange-600">
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>

      {showCommentInput && (
        <div className="mt-4 p-4 bg-neutral-900 rounded-lg text-white">
          <div className="mb-4">
            <div className="text-sm text-neutral-400">Time Range</div>
            <div className="flex items-center gap-2">
              <span>{startTime}</span>
              <span>-</span>
              <div className="relative flex-1 h-6">
                <div className="absolute inset-0 bg-neutral-800 rounded-full">
                  <div
                    className="absolute h-full bg-orange-500/30 rounded-full"
                    style={{
                      left: `${((Number.parseFloat(startTime?.split(":")[0] || "0") * 60 + Number.parseFloat(startTime?.split(":")[1] || "0")) / duration) * 100}%`,
                      width: `${
                        ((Number.parseFloat(endTime?.split(":")[0] || currentTime.toString()) * 60 +
                          Number.parseFloat(endTime?.split(":")[1] || "0") -
                          (Number.parseFloat(startTime?.split(":")[0] || "0") * 60 +
                            Number.parseFloat(startTime?.split(":")[1] || "0"))) /
                          duration) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <Input
                  type="range"
                  min={
                    startTime
                      ? Number.parseFloat(startTime.split(":")[0]) * 60 + Number.parseFloat(startTime.split(":")[1])
                      : 0
                  }
                  max={duration}
                  step="0.01"
                  value={
                    endTime
                      ? Number.parseFloat(endTime.split(":")[0]) * 60 + Number.parseFloat(endTime.split(":")[1])
                      : currentTime
                  }
                  onChange={(e) => setEndTime(formatTimeStamp(Number.parseFloat(e.target.value)))}
                  className="relative z-10 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span>{endTime || formatTimeStamp(currentTime)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment..."
              className="flex-1 bg-neutral-800 border-neutral-700"
            />
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

