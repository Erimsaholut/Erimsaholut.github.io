/** Small DOM confetti burst from a point — used when every secret is found. */
export function confetti(x: number, y: number, count = 70) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#FFB547", "#93D3A2", "#8FB0EC", "#ECE8DF", "#FF6FD8"];
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden";
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 5 + Math.random() * 6;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 0.45}px;border-radius:2px;background:${
      colors[i % colors.length]
    }`;
    layer.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const speed = 180 + Math.random() * 320;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - 220;
    p.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 420}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ],
      { duration: 1400 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" }
    );
  }
  setTimeout(() => layer.remove(), 2600);
}
