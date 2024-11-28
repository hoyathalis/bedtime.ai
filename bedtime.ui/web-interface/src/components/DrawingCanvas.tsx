import '../styles/DrawingCanvas.css';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export type DrawingCanvasHandle = {
  clearCanvas: () => void;
  downloadCanvas: () => void;
  hasDrawing: () => boolean;
  getCanvasData: () => string | null; // Add this line
  getBase64FromCanvas: () => string | null;
};

const DrawingCanvas = forwardRef<DrawingCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        setContext(ctx);
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    clearCanvas() {
      if (context && canvasRef.current) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    downloadCanvas() {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');

      if (tempContext) {
        tempContext.fillStyle = '#ffffff';
        tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempContext.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.href = tempCanvas.toDataURL('image/png');
        link.download = 'drawing.png';
        link.click();
      }
    },
    hasDrawing() {
      if (!canvasRef.current) return false;
      const pixelBuffer = new Uint32Array(
        context!.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer
      );
      return !pixelBuffer.every((pixel) => pixel === 0); // Check if any pixel is not empty
    },
    getCanvasData() {
      return canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
    },
    getBase64FromCanvas() {
      if (!canvasRef.current) {
        console.error("Canvas reference is not available.");
        return null;
      }

      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');

      if (!tempContext) {
        console.error("Temporary canvas context is not available.");
        return null;
      }

      // Fill temp canvas with a white background
      tempContext.fillStyle = '#ffffff';
      tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the actual content on top
      tempContext.drawImage(canvas, 0, 0);

      // Convert temp canvas to base64
      try {
        const dataURL = tempCanvas.toDataURL('image/png');
        return dataURL.replace(/^data:image\/png;base64,/, '');
      } catch (error) {
        console.error("Error encoding canvas to base64:", error);
        return null;
      }
    }
  }));

  // Utility function to get the touch or mouse position relative to the canvas
  const getEventPosition = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (event as React.MouseEvent).nativeEvent.offsetX,
        y: (event as React.MouseEvent).nativeEvent.offsetY
      };
    }
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (context) {
      const { x, y } = getEventPosition(event);
      context.beginPath();
      context.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || !context) return;
    const { x, y } = getEventPosition(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (isDrawing) {
      context?.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="custom-canvas"
        // Prevent scrolling when touching the canvas
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default DrawingCanvas;
