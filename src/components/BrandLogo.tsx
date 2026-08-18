import React from 'react';

/**
 * -----------------------------------------------------------------
 * BRAND LOGO CONFIGURATION:
 * 
 * To update your brand logo image, simply replace the URL string 
 * below with your ImageKit, CDN, or static asset address.
 * -----------------------------------------------------------------
 */
export const BRAND_LOGO_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png";

export function BrandLogo() {
  return (
    <div className="w-full max-w-sm px-6 text-center flex flex-col items-center justify-center select-none" id="brand-header-logo">
      {/* 1. Circle Shaped Brand Logo Image */}
      <div className="w-16 h-16 rounded-full overflow-hidden border border-purple-200/60 shadow-md bg-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-purple-300">
        <img 
          src={BRAND_LOGO_URL} 
          alt="Velvet Box Brand Mark" 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn("Logo failed to load. Please check the BRAND_LOGO_URL address in BrandLogo.tsx code.");
          }}
        />
      </div>

      {/* 2. Brand Typography matching the reference look exactly */}
      <div className="flex flex-col items-center mt-2" id="brand-text-container">
        <div className="flex items-baseline justify-center tracking-tight font-sans">
          
          {/* "VELVET" styled with bold lettering in premium solid dark slate matching the reference look */}
          <span
            className="text-[26px] font-black tracking-[-0.03em] select-none font-sans leading-none text-zinc-950"
            id="brand-name-velvet"
          >
            VELVET
          </span>

          {/* "BOX" with clean, elegant modern light style matching the original branded lockup */}
          <span 
            className="text-[28px] font-extralight text-[#3f3f46] tracking-[0.01em] ml-1.5 select-none font-sans leading-none"
            id="brand-name-box"
          >
            BOX
          </span>
        </div>

        {/* Dynamic, widely character-spaced elegant luxury tagline */}
        <span 
          className="text-[6.5px] font-bold tracking-[0.4em] text-[#71717a] uppercase mt-1.5 text-center whitespace-nowrap pl-1 select-none font-sans"
          id="brand-tagline"
        >
          Heritage in silver, glamour in rose gold
        </span>
      </div>
    </div>
  );
}
