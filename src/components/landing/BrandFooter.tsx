export function BrandFooter({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <p
      className="text-xs tracking-widest font-light"
      style={{ opacity, fontSize: "12px" }}
    >
      crafted by yt
    </p>
  );
}
