export function BrandFooter({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className="text-xs tracking-widest font-light"
        style={{ opacity, fontSize: "12px" }}
      >
        crafted by yt
      </p>
      <a
        href="mailto:z3125243839@163.com?subject=祝福网站反馈"
        className="text-xs tracking-widest font-light"
        style={{ opacity: opacity * 0.7, fontSize: "11px", textDecoration: "none", color: "inherit" }}
      >
        · 意见反馈 ·
      </a>
    </div>
  );
}
