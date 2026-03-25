"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ResultPageShell } from "@/components/result/ResultPageShell";

function ResultContent() {
  const searchParams = useSearchParams();
  const d = searchParams.get("d");
  const sid = searchParams.get("sid");
  const name = searchParams.get("name");
  const creator = searchParams.get("creator") === "1";

  return (
    <ResultPageShell
      encodedData={d}
      sessionId={sid}
      encodedName={name}
      isCreator={creator}
    />
  );
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
