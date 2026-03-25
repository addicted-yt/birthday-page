"use client";
import { ResultPageShell } from "@/components/result/ResultPageShell";
import { BrandFooter } from "@/components/landing/BrandFooter";
import { SpringButton } from "@/components/ui/SpringButton";
import { PageTransitionOverlay } from "@/components/ui/PageTransitionOverlay";
import { useNavTransition } from "@/hooks/useNavTransition";
import { defaultDemoData } from "@/lib/defaultDemoData";

export default function DemoPage() {
  const { leaving, navigate } = useNavTransition();

  const cta = (onNavigateAway: () => void) => (
    <>
      <SpringButton
        variant="primary"
        onClick={() => { onNavigateAway(); navigate("/create"); }}
      >
        我也要做一个
      </SpringButton>
      <BrandFooter opacity={0.35} />
    </>
  );

  return (
    <>
      <PageTransitionOverlay leaving={leaving} />
      <ResultPageShell
        encodedData={null}
        sessionId={null}
        data={defaultDemoData}
        showHomeButton={true}
        endingCTA={cta}
      />
    </>
  );
}
