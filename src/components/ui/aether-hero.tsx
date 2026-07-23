import React from "react";

/**
 * AuroraBackdrop — a premium, reliable animated hero backdrop built with pure
 * CSS: screen-blended, slowly drifting colour blobs (a "mesh gradient"). No
 * WebGL, so it composites correctly on every device. Respects reduced motion.
 * Sits behind hero content as an absolute layer.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div className={["absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")} aria-hidden="true">
      <div className="ab a1" />
      <div className="ab a2" />
      <div className="ab a3" />
      <div className="ab a4" />
      <style>{`
        .ab{ position:absolute; border-radius:9999px; filter:blur(72px); mix-blend-mode:screen; will-change:transform; }
        .a1{ width:min(640px,80vw); aspect-ratio:1; left:2%;  top:-16%; background:radial-gradient(circle, #5b6bff 0%, transparent 60%); opacity:.85; animation:ad1 22s ease-in-out infinite; }
        .a2{ width:min(560px,70vw); aspect-ratio:1; right:1%; top:-20%; background:radial-gradient(circle, #22d3ee 0%, transparent 60%); opacity:.6;  animation:ad2 27s ease-in-out infinite; }
        .a3{ width:min(700px,86vw); aspect-ratio:1; left:32%; top:-8%;  background:radial-gradient(circle, #a855f7 0%, transparent 62%); opacity:.75; animation:ad3 25s ease-in-out infinite; }
        .a4{ width:min(520px,64vw); aspect-ratio:1; left:52%; top:12%;  background:radial-gradient(circle, #7c3aed 0%, transparent 60%); opacity:.55; animation:ad4 30s ease-in-out infinite; }
        @keyframes ad1{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(70px,44px)} }
        @keyframes ad2{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-80px,54px)} }
        @keyframes ad3{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(34px,-46px)} }
        @keyframes ad4{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-44px,-34px)} }
        @media (prefers-reduced-motion: reduce){ .ab{ animation:none } }
      `}</style>
    </div>
  );
}

export default AuroraBackdrop;
