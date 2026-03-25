"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/landing/HeroSection";
import { BrandFooter } from "@/components/landing/BrandFooter";

const LandingBackground = dynamic(
  () => import("@/components/ui/LandingBackground").then((m) => m.LandingBackground),
  { ssr: false }
);

export default function LandingPage() {
  return (
    <motion.main
      className="relative h-dvh w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #111d50 0%, #080d1a 65%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <LandingBackground />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
        <HeroSection />
      </div>

      <div className="relative z-10 pb-8">
        <BrandFooter opacity={0.35} />
      </div>
    </motion.main>
  );
}
