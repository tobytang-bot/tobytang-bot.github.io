export function createRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  let width = 0;
  let height = 0;
  let accent = "";
  let border = "";
  const palette = () => {
    const style = getComputedStyle(canvas);
    accent = style.getPropertyValue("--accent").trim();
    border = style.getPropertyValue("--border").trim();
  };
  palette();
  return {
    palette,
    resize(w: number, h: number) {
      width = w;
      height = h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    draw(points: Float32Array, active: number, progress: number, offset: number) {
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1 - progress * 0.8;
      const x = points[0] + offset;
      const y = points[1];
      for (let i = 2; i < points.length; i += 2) {
        context.strokeStyle = active === i / 2 - 1 ? accent : border;
        context.lineWidth = active === i / 2 - 1 ? 1.8 : 1;
        context.beginPath();
        context.moveTo(x, y);
        context.bezierCurveTo(x, y + 25, points[i], points[i + 1] - 25, points[i], points[i + 1]);
        context.stroke();
        context.fillStyle = accent;
        context.beginPath();
        context.arc(points[i], points[i + 1], active === i / 2 - 1 ? 4 : 2.5, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = accent;
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
    },
  };
}
