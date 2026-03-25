"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StepFlow } from "@/components/create/StepFlow";

function CreateContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get("sid");
  return <StepFlow restoreSid={sid} />;
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreateContent />
    </Suspense>
  );
}
