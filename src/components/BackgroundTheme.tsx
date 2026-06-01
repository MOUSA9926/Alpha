import React, { useState, useEffect, useRef, useMemo } from "react";

export const SnowParticles = React.memo(() => {
  const particles = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 5 + 5}s`,
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5 + 0.1,
      size: `${Math.random() * 3 + 2}px`
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-blue-100 rounded-full"
          style={{
            left: p.left,
            top: '-10%',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-down ${p.animationDuration} linear ${p.animationDelay} infinite`
          }}
        />
      ))}
    </div>
  );
});

export const EmberParticles = React.memo(() => {
  const particles = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 4 + 4}s`,
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.6 + 0.2,
      size: `${Math.random() * 3 + 2}px`
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]"
          style={{
            left: p.left,
            bottom: '-10%',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-up ${p.animationDuration} linear ${p.animationDelay} infinite`
          }}
        />
      ))}
    </div>
  );
});

export const WolfEye = React.memo(({ theme, position }: { theme: 'ice' | 'fire', position: 'left' | 'right' }) => {
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const eyeRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const rect = eyeRef.current!.getBoundingClientRect();
        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
        const distance = Math.min(10, Math.hypot(e.clientX - eyeX, e.clientY - eyeY) / 15);
        
        setPupilPos({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const autoBlink = () => {
      const delay = Math.random() * 5000 + 3000;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          autoBlink();
        }, 150);
      }, delay);
    };
    
    timeoutId = setTimeout(autoBlink, Math.random() * 2000 + 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const isLeft = position === 'left';
  const isFire = theme === 'fire';

  const outerShadow = isFire 
    ? 'shadow-[0_0_30px_rgba(249,115,22,0.6),inset_0_0_20px_rgba(0,0,0,1)]' 
    : 'shadow-[0_0_30px_rgba(0,200,255,0.4),inset_0_0_20px_rgba(0,0,0,1)]';
  
  const pupilBg = isFire 
    ? 'bg-[radial-gradient(circle,#f97316_0%,#ea580c_40%,#9a3412_70%,#431407_100%)] shadow-[0_0_30px_#f97316]' 
    : 'bg-[radial-gradient(circle,#a5f3fc_0%,#06b6d4_40%,#083344_70%,#020617_100%)] shadow-[0_0_30px_#22d3ee]';

  return (
    <div className="relative flex items-center justify-center pointer-events-auto overflow-visible z-20">
      <div 
        ref={eyeRef}
        className={`relative w-[90px] h-[45px] sm:w-[130px] sm:h-[65px] md:w-[160px] md:h-[80px] bg-black overflow-hidden flex justify-center items-center ${outerShadow} transition-all duration-300`}
        style={{
          borderRadius: isLeft ? '100% 0%' : '0 100%',
          transform: isLeft ? 'rotate(35deg)' : 'rotate(-35deg)',
          border: `3px solid ${isFire ? '#5a1100' : '#002233'}`,
          willChange: 'transform' // GPU acceleration
        }}
      >
        <div 
          className="absolute w-[150%] h-[150%] bg-[#030303] transition-transform duration-100 ease-in-out"
          style={{
            zIndex: 30,
            transform: isBlinking ? 'translateY(0)' : 'translateY(-100%)',
            left: '-25%', top: 0,
            willChange: 'transform'
          }}
        />
        
        <div 
          className={`absolute rounded-full flex justify-center items-center transition-transform duration-75 ease-linear ${pupilBg}`}
          style={{
            width: 'clamp(35px, 50%, 55px)',
            aspectRatio: '1/1',
            transform: `translate(${pupilPos.x}px, ${pupilPos.y}px) ${isLeft ? 'rotate(-35deg)' : 'rotate(35deg)'}`,
            zIndex: 10,
            willChange: 'transform'
          }}
        >
          <div className="absolute top-[20%] left-[25%] w-[25%] h-[25%] bg-white/80 rounded-full blur-[1px] z-20" />
          <div className="w-[30%] h-[75%] bg-black rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] z-10" />
        </div>
      </div>
    </div>
  );
});

// Memoize the static background to prevent re-renders mapping all elements when children update
const StaticBackground = React.memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    {/* Right Side Pattern (FIRE) */}
    <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#0a0202] overflow-hidden will-change-transform">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[100px]"></div>
      <EmberParticles />
    </div>

    {/* Left Side Pattern (ICE) */}
    <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#02060f] overflow-hidden border-r border-white/5 will-change-transform">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      <SnowParticles />
    </div>

    {/* Center Divider Line */}
    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
  </div>
));

export const BackgroundTheme = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="font-sans min-h-screen relative text-white selection:bg-white/20" dir="rtl">
      <StaticBackground />

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};
