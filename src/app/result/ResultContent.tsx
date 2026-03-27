"use client";
import { useSearchParams } from "next/navigation";
import { ResultPageShell } from "@/components/result/ResultPageShell";

export function ResultContent() {
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
