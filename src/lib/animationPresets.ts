import { Variants } from "framer-motion";

export const springGentle = {
  type: "spring" as const,
  damping: 24,
  stiffness: 120,
  mass: 1,
};

export const springSnappy = {
  type: "spring" as const,
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

export const springPress = {
  type: "spring" as const,
  damping: 15,
  stiffness: 400,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springGentle, duration: 0.9 },
  },
};

export const blurToFocus: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", scale: 0.97 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { ...springGentle, duration: 0.9 },
  },
};

export const breathe: Variants = {
  idle: { opacity: 0.7, scale: 1 },
  pulse: {
    opacity: [0.7, 1, 0.7],
    scale: [1, 1.015, 1],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
};
