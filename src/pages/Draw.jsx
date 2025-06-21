import React, { useRef, useState, useEffect, useCallback } from "react";

const Draw = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const saveBtnRef = useRef(null);
  const canvasImageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#7e22ce");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTool, setActiveTool] = useState("brush");
  const [customColor, setCustomColor] = useState("#e600e6");
  const [colorPalette, setColorPalette] = useState([
    "#7e22ce", "#3b82f6", "#10b981", "#ef4444", 
    "#f59e0b", "#000000", "#ffffff", "#64748b"
  ]);
  const [userId, setUserId] = useState(1);
  const [serverDrawings, setServerDrawings] = useState([]);

  // Background animation with enhanced particles
  const initBackground = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    
    // Set canvas to full viewport size
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = document.body.scrollHeight; // Use full document height
    
    const ctx = bgCanvas.getContext("2d");

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Enhanced particle system
    const particles = [];
    const particleCount = isMobile ? 40 : 80;

    // Create gradient colors for particles
    const gradients = [
      {start: "#7e22ce", end: "#3b82f6"},
      {start: "#10b981", end: "#3b82f6"},
      {start: "#f59e0b", end: "#ef4444"},
      {start: "#7e22ce", end: "#ec4899"}
    ];

    for (let i = 0; i < particleCount; i++) {
      const gradient = gradients[Math.floor(Math.random() * gradients.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.1;
      
      particles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        size: Math.random() * 4 + 1,
        startColor: gradient.start,
        endColor: gradient.end,
        colorProgress: Math.random(),
        colorSpeed: Math.random() * 0.005 + 0.002,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: Math.random() * 0.02 - 0.01,
        shape: Math.random() > 0.5 ? "circle" : "rect",
        trail: []
      });
    }

    // Mouse/touch interaction
    let mouseX = null;
    let mouseY = null;
    
    const handleMouseMove = (e) => {
      const rect = bgCanvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };
    
    bgCanvas.addEventListener('mousemove', handleMouseMove);
    bgCanvas.addEventListener('mouseleave', handleMouseLeave);
    
    if (isMobile) {
      bgCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = bgCanvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
      }, {passive: false});
      
      bgCanvas.addEventListener('touchend', handleMouseLeave);
    }

    // Helper function to mix colors with optional alpha
    function mixColors(color1, color2, ratio, alpha = 1) {
      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);
      
      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);
      
      const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
      const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
      const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
      
      return alpha < 1 
        ? `rgba(${r}, ${g}, ${b}, ${alpha})`
        : `rgb(${r}, ${g}, ${b})`;
    }

    const animate = () => {
      // Clear with a subtle fade effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      
      // Draw connecting lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const opacity = 1 - distance/150;
            ctx.beginPath();
            
            // Create gradient for the line
            const lineGradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            lineGradient.addColorStop(0, particles[i].startColor);
            lineGradient.addColorStop(1, particles[j].endColor);
            
            ctx.strokeStyle = lineGradient;
            ctx.globalAlpha = opacity * 0.3;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      
      // Update and draw particles
      particles.forEach(p => {
        // Update color progression
        p.colorProgress += p.colorSpeed;
        if (p.colorProgress > 1) {
          p.colorProgress = 0;
          // Occasionally change gradient
          if (Math.random() > 0.9) {
            const gradient = gradients[Math.floor(Math.random() * gradients.length)];
            p.startColor = gradient.start;
            p.endColor = gradient.end;
          }
        }
        
        // Calculate current color
        const currentColor = mixColors(p.startColor, p.endColor, p.colorProgress);
        
        // Mouse interaction - repel particles
        if (mouseX !== null && mouseY !== null) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100 * 2;
            p.speedX += (dx / distance) * force * 0.1;
            p.speedY += (dy / distance) * force * 0.1;
          }
        }
        
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.angleSpeed;
        
        // Store position for trail
        p.trail.push({x: p.x, y: p.y});
        if (p.trail.length > 10) {
          p.trail.shift();
        }
        
        // Bounce off edges with some randomness
        if (p.x < 0 || p.x > bgCanvas.width) {
          p.speedX *= -1 * (0.9 + Math.random() * 0.1);
          p.angleSpeed = Math.random() * 0.02 - 0.01;
        }
        if (p.y < 0 || p.y > bgCanvas.height) {
          p.speedY *= -1 * (0.9 + Math.random() * 0.1);
          p.angleSpeed = Math.random() * 0.02 - 0.01;
        }
        
        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          
          const trailGradient = ctx.createLinearGradient(
            p.trail[0].x, p.trail[0].y,
            p.trail[p.trail.length-1].x, p.trail[p.trail.length-1].y
          );
          trailGradient.addColorStop(0, mixColors(p.startColor, p.startColor, 0, 0));
          trailGradient.addColorStop(1, mixColors(p.startColor, p.endColor, p.colorProgress, 0.5));
          
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = p.size / 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        
        // Draw particle
        ctx.fillStyle = currentColor;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw a star shape for variety
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = i * (Math.PI * 2 / 5) - Math.PI / 2;
            const innerAngle = angle + Math.PI / 5;
            ctx.lineTo(
              Math.cos(angle) * p.size/2,
              Math.sin(angle) * p.size/2
            );
            ctx.lineTo(
              Math.cos(innerAngle) * p.size/4,
              Math.sin(innerAngle) * p.size/4
            );
          }
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
      });
    
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      bgCanvas.removeEventListener('mousemove', handleMouseMove);
      bgCanvas.removeEventListener('mouseleave', handleMouseLeave);
      if (isMobile) {
        bgCanvas.removeEventListener('touchmove', handleMouseMove);
        bgCanvas.removeEventListener('touchend', handleMouseLeave);
      }
    };
  }, [isMobile]);

  const saveCanvasState = () => {
    if (canvasRef.current) {
      canvasImageRef.current = canvasRef.current.toDataURL('image/png');
    }
  };

  const restoreCanvasState = () => {
    if (canvasImageRef.current && canvasRef.current && ctxRef.current) {
      const img = new Image();
      img.onload = () => {
        ctxRef.current.globalCompositeOperation = 'source-over';
        ctxRef.current.drawImage(img, 0, 0);
      };
      img.src = canvasImageRef.current;
    }
  };

  const loadDrawingsFromServer = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/dessins/utilisateur/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Dessins chargés du serveur:", data);
        const loadedDrawings = data
          .filter(item => item.image)
          .map(item => item.image);
        
        setServerDrawings(loadedDrawings);
        setSavedDrawings(loadedDrawings);
      } else {
        console.error("Erreur lors du chargement des dessins:", response.statusText);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des dessins:", error);
    }
  }, [userId]);

  useEffect(() => {
    loadDrawingsFromServer();
  }, [loadDrawingsFromServer]);

  // Initialize canvas and check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth > 768 ? 800 : window.innerWidth - 40;
    canvas.height = isMobile ? 500 : 600;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;
    
    // Set canvas background to white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Initialize background
    initBackground();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMobile, initBackground, color, brushSize]);

  const selectColor = (newColor) => {
    saveCanvasState();
    setColor(newColor);
    setIsEraser(false);
    setActiveTool("brush");
    
    if (ctxRef.current) {
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.strokeStyle = newColor;
    }
    
    restoreCanvasState();
  };
  
  const selectEraser = () => {
    saveCanvasState();
    setIsEraser(true);
    setActiveTool("eraser");
    
    if (ctxRef.current) {
      ctxRef.current.globalCompositeOperation = 'destination-out';
    }
  };

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = isEraser ? "#ffffff" : color;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, isEraser]);

  const startDrawing = (e) => {
    if (activeTool === "brush" || activeTool === "eraser") {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      let x, y;
      
      if (e.nativeEvent.type.includes('touch')) {
        const touch = e.nativeEvent.touches[0];
        if (!touch) { 
          return; 
        }
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        x = e.nativeEvent.offsetX;
        y = e.nativeEvent.offsetY;
      }
      
      if (ctxRef.current) {
        if (activeTool === 'eraser') {
          ctxRef.current.globalCompositeOperation = 'destination-out';
        } else {
          ctxRef.current.globalCompositeOperation = 'source-over';
        }
        ctxRef.current.strokeStyle = activeTool === 'eraser' ? "#ffffff" : color;
        ctxRef.current.lineWidth = brushSize;
      }

      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const finishDrawing = () => {
    if (isDrawing) {
      ctxRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    
    if (e.nativeEvent.type.includes('touch')) {
      const touch = e.nativeEvent.touches[0];
      if (!touch) return;
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.fillStyle = "#ffffff";
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    setSavedDrawings([...savedDrawings, dataUrl]);
    
    if (saveBtnRef.current) {
      saveBtnRef.current.classList.add("animate-saved");
      setTimeout(() => {
        saveBtnRef.current.classList.remove("animate-saved");
      }, 1000);
    }

    canvas.toBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append('file', blob, 'dessin.png');
        formData.append('user_id', userId);
        formData.append('description', 'Dessin créé dans l\'application');
        
        const response = await fetch('http://localhost:8000/dessins/upload/', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        console.log('Dessin enregistré sur le serveur:', result);
        
        if (result.status === 'success') {
          loadDrawingsFromServer();
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload du dessin:', error);
      }
    }, 'image/png');
  };

  const loadDrawing = (imgUrl) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const img = new Image();
    img.onload = () => {
      clearCanvas();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imgUrl;
    setShowGallery(false);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `drawing-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const addCustomColor = () => {
    if (customColor && !colorPalette.includes(customColor)) {
      setColorPalette(prevPalette => [...prevPalette, customColor]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200 flex flex-col p-2 sm:p-4 md:p-6 items-center justify-center overflow-hidden relative">
      {/* Background canvas for animation - fixed position to cover whole screen */}
      <canvas 
        ref={bgCanvasRef} 
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ height: '100vh' }}
      ></canvas>
      
      {/* Main content container */}
      <div className="relative z-10 w-full max-w-screen-2xl flex flex-col flex-grow">
        {/* Header */}
        <div className="text-center mb-2 sm:mb-3 md:mb-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-700">Your Magic Art</h1>
          <p className="text-xs sm:text-sm md:text-base text-purple-500">Draw your imagination to life!</p>
        </div>

        {/* Drawing Interface Layout */}
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 flex-grow min-h-0">
          
          {/* Tools Panel (Desktop/Tablet Left) */}
          {!isMobile && (
            <div 
              id="tools-panel"
              className="bg-white rounded-2xl shadow-xl md:p-3 lg:p-4 flex flex-col gap-3 md:gap-4 
                         md:w-48 lg:w-60 xl:w-72 text-sm"
            >
              {/* Tools: Brush, Eraser, Clear */}
              <div className="p-2 rounded-lg bg-purple-50">
                <h3 className="text-xs font-semibold text-purple-700 mb-1 text-center">Tools</h3>
                <div className="flex justify-around items-center gap-1">
                  <button 
                    onClick={() => selectColor(color)}
                    className={`p-1 rounded-lg transition-colors text-xs ${activeTool === "brush" && !isEraser ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                    aria-label="Brush Tool"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg> Brush
                  </button>
                  <button 
                    onClick={selectEraser} 
                    className={`p-1 rounded-lg transition-colors text-xs ${isEraser ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    aria-label="Eraser Tool"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg> Eraser
                  </button>
                  <button 
                    onClick={clearCanvas} 
                    className="p-1 rounded-lg bg-gray-100 hover:bg-red-200 text-gray-700 hover:text-red-600 transition-colors text-xs"
                    aria-label="Clear Canvas"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg> Clear
                  </button>
                </div>
              </div>

              {/* Brush Size Slider */}
              <div className="p-1 rounded-lg bg-purple-50">
                <label htmlFor="brushSize" className="block text-xs font-medium text-purple-700 text-center mb-1">Size: {brushSize}px</label>
                <input 
                  type="range" 
                  id="brushSize" 
                  min="1" 
                  max="50" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Action Buttons: Save, Download, Gallery */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-purple-100">
                <button 
                  ref={saveBtnRef}
                  onClick={saveDrawing} 
                  className="p-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Save Drawing"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg> Save
                </button>
                <button 
                  onClick={downloadDrawing} 
                  className="p-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Download Drawing"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg> Download
                </button>
                <button 
                  onClick={() => setShowGallery(true)} 
                  className="p-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Show Gallery"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg> Gallery
                </button>
              </div>
            </div>
          )}

          {/* Center: Drawing Area + Color Palette (Desktop/Tablet Right) */}
          <div className="flex-grow flex flex-col md:flex-row gap-3 md:gap-4 min-h-0">
            {/* Drawing Canvas Container */}
            <div 
              id="drawing-canvas-container"
              className="flex-grow bg-white rounded-2xl shadow-xl relative overflow-hidden 
                         min-h-[300px] sm:min-h-[400px] md:min-h-0 border-2 border-purple-300"
            >
              <canvas 
                ref={canvasRef}
                className={`bg-white rounded-2xl shadow-xl w-full h-full border-2 border-purple-300 transition-all ${ 
                  isDrawing ? 'cursor-crosshair' : 'cursor-pointer'
                }`}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={finishDrawing}
              />
              
              {/* Drawing indicator */}
              {isDrawing && (
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full shadow-md text-xs font-medium text-purple-700 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-1"></div>
                  Drawing...
                </div>
              )}
            </div>

            {/* Color Palette (Desktop/Tablet Right | Mobile Below Canvas) */}
            <div 
              id="color-palette-panel"
              className={`bg-white rounded-2xl shadow-xl 
                         ${isMobile ? 'w-full mt-3 p-2 sm:p-3' 
                                    : 'md:w-24 lg:w-28 xl:w-32 md:p-3 lg:p-4 flex flex-col'}`}
            >
              <h3 className={`text-sm font-semibold text-purple-700 mb-2 sm:mb-3 text-center ${!isMobile && 'md:text-left'}`}>Colors</h3>
              <div className={`flex ${isMobile ? 'flex-row justify-start overflow-x-auto py-1 gap-2' : 'flex-col gap-3 items-center'} flex-wrap`}>
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectColor(c)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 shrink-0 ${color === c && !isEraser ? 'ring-2 ring-offset-2 ring-purple-500 scale-110 shadow-md' : 'hover:scale-110 hover:shadow-md'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>

              {/* Add Custom Color */}
              <div className={`mt-3 pt-3 border-t border-purple-100 flex ${isMobile ? 'flex-row items-center gap-2' : 'flex-col items-center gap-2'}`}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 p-0 border-none cursor-pointer rounded-md overflow-hidden shrink-0"
                  title="Choose a color"
                />
                <button
                  onClick={addCustomColor}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-md flex items-center justify-center text-purple-700 hover:bg-purple-200 transition-colors shrink-0"
                  aria-label="Add custom color"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tools Panel (Mobile Bottom) */}
          {isMobile && (
            <div 
              id="tools-panel-mobile"
              className="w-full mt-3 bg-white rounded-2xl shadow-xl p-2 sm:p-3 flex flex-col gap-2 text-sm"
            >
              {/* Tools: Brush, Eraser, Clear */}
              <div className="p-1 rounded-lg bg-purple-50">
                <h3 className="text-xs font-semibold text-purple-700 mb-1 text-center">Tools</h3>
                <div className="flex justify-around items-center gap-1">
                  <button 
                    onClick={() => selectColor(color)}
                    className={`p-1 rounded-lg transition-colors text-xs ${activeTool === "brush" && !isEraser ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                    aria-label="Brush Tool"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg> Brush
                  </button>
                  <button 
                    onClick={selectEraser} 
                    className={`p-1 rounded-lg transition-colors text-xs ${isEraser ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    aria-label="Eraser Tool"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg> Eraser
                  </button>
                  <button 
                    onClick={clearCanvas} 
                    className="p-1 rounded-lg bg-gray-100 hover:bg-red-200 text-gray-700 hover:text-red-600 transition-colors text-xs"
                    aria-label="Clear Canvas"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg> Clear
                  </button>
                </div>
              </div>

              {/* Brush Size Slider */}
              <div className="p-1 rounded-lg bg-purple-50">
                <label htmlFor="brushSizeMobile" className="block text-xs font-medium text-purple-700 text-center mb-1">Size: {brushSize}px</label>
                <input 
                  type="range" 
                  id="brushSizeMobile" 
                  min="1" 
                  max="50" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Action Buttons: Save, Download, Gallery */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-purple-100">
                <button 
                  ref={saveBtnRef}
                  onClick={saveDrawing} 
                  className="p-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Save Drawing"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg> Save
                </button>
                <button 
                  onClick={downloadDrawing} 
                  className="p-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Download Drawing"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg> Download
                </button>
                <button 
                  onClick={() => setShowGallery(true)} 
                  className="p-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors text-xs flex flex-col items-center"
                  aria-label="Show Gallery"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg> Gallery
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-screen-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-purple-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Gallery ({savedDrawings.length})
              </h3>
              <button 
                onClick={() => setShowGallery(false)}
                className="text-purple-600 hover:text-purple-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {savedDrawings.map((drawing, index) => (
                <div 
                  key={index} 
                  className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                  onClick={() => loadDrawing(drawing)}
                >
                  <img 
                    src={drawing} 
                    alt={`Drawing ${index + 1}`} 
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium text-sm bg-purple-600/90 px-2 py-1 rounded">
                      Load
                    </span>
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Draw;