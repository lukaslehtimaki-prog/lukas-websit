"use client";

import React, { useEffect, useRef } from "react";

/**
 * AetherShader — a living WebGL2 background (log-polar flow). Used as the hero
 * backdrop. Content is rendered on top by the parent. Respects reduced motion.
 * Ported from the "Aether Hero" component; slowed for a calmer feel.
 */

const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define MN min(R.x,R.y)
float pattern(vec2 uv){
  float d=.0;
  for(float i=.0;i<3.;i++){
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv){
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for(float i=.0;i<3.;i++){
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main(){
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col*1.35,1.);
}`;

const VERT = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

export function AetherShader({ className, dprMax = 1.6 }: { className?: string; dprMax?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { canvas.style.display = "none"; return; }

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) { canvas.style.display = "none"; return; }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.style.display = "none"; return; }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = "none"; return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "time");
    const uRes = gl.getUniformLocation(prog, "resolution");
    gl.clearColor(0, 0, 0, 0);

    const fit = () => {
      // Render at a bold, capped internal resolution (smaller = bigger, brighter
      // pattern + far cheaper); the canvas is CSS-stretched to fill the hero.
      const cw = Math.max(1, canvas.clientWidth), ch = Math.max(1, canvas.clientHeight);
      const targetMin = 560;
      const scale = Math.min(1, targetMin / Math.min(cw, ch));
      const w = Math.max(1, Math.round(cw * scale));
      const h = Math.max(1, Math.round(ch * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, 1.6 + (performance.now() - start) * 0.0009); // start mid-pattern, calm drift
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [dprMax]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}

export default AetherShader;
