import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultContent } from "./ResultContent";
import { decodeBirthdayTextData } from "@/lib/urlEncoding";

interface Props {
  searchParams: Promise<{ d?: string; sid?: string; lsid?: string; name?: string; creator?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const siteUrl = "https://thesedays.cn";
  const decoded = decodeBirthdayTextData(params.d ?? null);
  const name =
    typeof decoded?.name === "string" && decoded.name.trim()
      ? decoded.name
      : params.name
        ? (() => {
            try {
              return decodeURIComponent(params.name);
            } catch {
              return params.name;
            }
          })()
        : "朋友";
  const title = `送给 ${name} 的生日祝福`;
  const description = "一份专属的沉浸式生日祝福";
  const ogImageUrl = new URL(`/result/opengraph-image?name=${encodeURIComponent(name)}`, siteUrl).toString();
  // 新链接格式：sid + name，旧链接：d + name，均需支持
  const resultParts: string[] = [];
  if (params.sid) resultParts.push(`sid=${params.sid}`);
  if (params.d) resultParts.push(`d=${params.d}`);
  if (params.name) resultParts.push(`name=${params.name}`);
  if (params.creator) resultParts.push(`creator=${params.creator}`);
  const resultUrl = new URL(
    resultParts.length ? `/result?${resultParts.join("&")}` : "/result",
    siteUrl
  ).toString();

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
