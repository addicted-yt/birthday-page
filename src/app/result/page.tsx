import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultContent } from "./ResultContent";

interface Props {
  searchParams: Promise<{ d?: string; sid?: string; name?: string; creator?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const siteUrl = "https://thesedays.cn";
  const name = params.name
    ? (() => { try { return decodeURIComponent(params.name!); } catch { return params.name!; } })()
    : "你";
  const title = `送给 ${name} 的生日祝福`;
  const description = "一份专属的沉浸式生日祝福";
  const ogImageUrl = new URL(`/result/opengraph-image?name=${encodeURIComponent(name)}`, siteUrl).toString();
  const resultQuery = new URLSearchParams({
    ...(params.d ? { d: params.d } : {}),
    ...(params.sid ? { sid: params.sid } : {}),
    ...(params.name ? { name: params.name } : {}),
    ...(params.creator ? { creator: params.creator } : {}),
  }).toString();
  const resultUrl = new URL(resultQuery ? `/result?${resultQuery}` : "/result", siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: resultUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: resultUrl,
      siteName: "thesedays",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh flex items-center justify-center" style={{ background: "#050810" }}>
          <p className="text-white/20 text-sm tracking-widest">loading</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
