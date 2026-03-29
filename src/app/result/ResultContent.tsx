"use client";
import { useSearchParams } from "next/navigation";
import { ResultPageShell } from "@/components/result/ResultPageShell";

export function ResultContent() {
  const searchParams = useSearchParams();
  const d = searchParams.get("d");
  const sid = searchParams.get("sid");   // 新链接：R2 session ID（短 sid）
  const lsid = searchParams.get("lsid"); // 预览页返回修改用的 sessionStorage key
  const name = searchParams.get("name");
  const creator = searchParams.get("creator") === "1";

  return (
    <ResultPageShell
      encodedData={d}
      sessionId={lsid}
      remoteSessionId={sid}
      encodedName={name}
      isCreator={creator}
    />
  );
}
