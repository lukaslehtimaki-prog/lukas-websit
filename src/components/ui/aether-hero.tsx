import React from "react";

/**
 * AuroraBackdrop — a bold, immersive animated hero background in pure CSS:
 * a slowly rotating colour wheel plus large screen-blended drifting blobs.
 * No WebGL, so it composites reliably on every device. Reduced-motion safe.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div className={["absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")} aria-hidden="true">
      <div className="aur-flow" />
      <div className="ab a1" />
      <div className="ab a2" />
      <div className="ab a3" />
      <div className="ab a4" />
      <style>{`
        .aur-flow{
          position:absolute; left:70%; top:-30%;
          width:120vmax; aspect-ratio:1; transform:translate(-50%,-50%);
          background:conic-gradient(from 0deg,
            #4f46e5, #7c3aed, #d946ef, #22d3ee, #6366f1, #4f46e5);
          filter:blur(90px); opacity:.5;
          animation:aur-rot 46s linear infinite;
        }
        @keyframes aur-rot{ to{ transform:translate(-50%,-50%) rotate(360deg) } }
        .ab{ position:absolute; border-radius:9999px; filter:blur(85px); will-change:transform; }
        .a1{ width:min(920px,90vw); aspect-ratio:1; left:-6%;  top:2%;  background:radial-gradient(circle,#5b6bff 0%,transparent 62%); opacity:.95; animation:ad1 22s ease-in-out infinite; }
        .a2{ width:min(820px,82vw); aspect-ratio:1; right:-6%; top:6%;  background:radial-gradient(circle,#22d3ee 0%,transparent 62%); opacity:.8;  animation:ad2 27s ease-in-out infinite; }
        .a3{ width:min(900px,88vw); aspect-ratio:1; left:22%;  top:20%; background:radial-gradient(circle,#c026d3 0%,transparent 64%); opacity:.88; animation:ad3 25s ease-in-out infinite; }
        .a4{ width:min(760px,76vw); aspect-ratio:1; left:46%;  top:36%; background:radial-gradient(circle,#7c3aed 0%,transparent 62%); opacity:.66; animation:ad4 31s ease-in-out infinite; }
        @keyframes ad1{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(90px,60px)} }
        @keyframes ad2{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-100px,70px)} }
        @keyframes ad3{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(50px,-60px)} }
        @keyframes ad4{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,-44px)} }
        @media (prefers-reduced-motion: reduce){ .ab,.aur-flow{ animation:none } }
      `}</style>
    </div>
  );
}

export default AuroraBackdrop;
