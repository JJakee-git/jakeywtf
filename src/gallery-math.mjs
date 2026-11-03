export function clampCamera(value, viewport, canvas) {
  return Math.min(0, Math.max(Math.min(0, viewport - canvas), value));
}
export function galleryScale(width, referenceWidth=1632) {
  return Math.max(0.1, Math.min(1, width / referenceWidth));
}
