import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
  productName: string;
  productImage: string;
  promoCode: string;
  onReveal?: () => void;
}

export function ScratchCard({ productName, productImage, promoCode, onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(() => {
    try {
      return localStorage.getItem('velvet_scratch_card_revealed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);
  const isDrawing = useRef(false);
  const checkAmountRef = useRef(0);

  useEffect(() => {
    if (isRevealed) return; // No need to setup canvas if already revealed

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fixed internal resolution for the scratch canvas
    canvas.width = 320;
    canvas.height = 320;

    // Paint glamorous gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#d8b4fe'); // purple-300
    gradient.addColorStop(0.5, '#a855f7'); // purple-500
    gradient.addColorStop(1, '#9333ea'); // purple-600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative "Scratch Me" overlay text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 19px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH MYSTERY BOX', canvas.width / 2, canvas.height / 2 - 15);
    
    // Subtext
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Scratch here to reveal', canvas.width / 2, canvas.height / 2 + 15);

  }, [isRevealed]);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2); // 22 is radius of scratch brush
    ctx.fill();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    isDrawing.current = true;
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Map screen coordinates to internal canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    scratch(x, y);
    checkReveal();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    isDrawing.current = false;
  };

  const checkReveal = () => {
    checkAmountRef.current += 1;
    // Optimize: only check pixel data every 5th movement update
    if (checkAmountRef.current % 5 !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentPixels = 0;
    
    // Iterate through pixels to check transparency level (alpha channel is at index i+3)
    // Sample every 4th pixel for performance
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 10) transparentPixels++;
    }

    const totalSampledPixels = data.length / 16;
    const transparentPercentage = transparentPixels / totalSampledPixels;

    // If 40% cleared, auto-reveal the whole card
    if (transparentPercentage > 0.40 && !isRevealed) {
      setIsRevealed(true);
      try {
        localStorage.setItem('velvet_scratch_card_revealed', 'true');
      } catch (err) {
        console.warn('LocalStorage is not available:', err);
      }
      if (onReveal) {
        onReveal();
      }
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#d8b4fe', '#fdf3c7', '#fbbf24'],
        zIndex: 100
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="relative w-full max-w-[320px] aspect-square mx-auto rounded-xl shadow-xl overflow-hidden bg-white flex items-center justify-center border-4 border-[#e9d5ff]">
      {/* Background (Revealed Information) */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.6, duration: 0.7 }}
        className="text-center p-3 w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-purple-50/50 to-white"
      >
        {/* Product Image (Enlarged) */}
        <div className="w-52 h-52 rounded-2xl overflow-hidden border-2 border-purple-200 shadow-md bg-white flex items-center justify-center p-1.5 hover:scale-105 transition-transform duration-300 my-auto">
          <img 
            src={productImage} 
            alt={productName} 
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=300&h=300";
            }}
          />
        </div>

        {/* Promo Code under the image */}
        <div className="w-full flex flex-col items-center gap-1 mb-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            Your promo code
          </span>
          <div className="flex items-center gap-1.5 justify-center">
            <div className="bg-purple-100 text-purple-900 border border-dashed border-purple-400 py-1 px-4 rounded-md text-sm font-mono font-black tracking-wider select-all shadow-sm">
              {promoCode}
            </div>
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-md border transition-all duration-200 active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-green-100 border-green-400 text-green-700 shadow-sm'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 shadow-sm'
              }`}
              title="Copy Promo Code"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Foreground (Canvas Layer) */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e)}
            onPointerLeave={(e) => handlePointerUp(e)}
            className="absolute inset-0 w-full h-full cursor-pointer z-10"
            style={{ touchAction: 'none' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
