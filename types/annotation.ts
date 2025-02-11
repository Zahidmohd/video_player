export interface Rectangle {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface Annotation {
  id: string
  startTime: string
  endTime: string
  shape: Rectangle
  comment: string
}

