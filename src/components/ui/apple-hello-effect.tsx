"use client";

import { motion } from "framer-motion";

import { cn } from "../../lib/utils";

const initialProps = {
  pathLength: 0,
  opacity: 0,
} as const;

const animateProps = {
  pathLength: 1,
  opacity: 1,
} as const;

type Props = React.ComponentPropsWithoutRef<typeof motion.svg> & {
  speed?: number;
  onAnimationComplete?: () => void;
};

function AppleHelloVietnameseEffect({
  className,
  speed = 1,
  onAnimationComplete,
  ...props
}: Props) {
  const calc = (x: number) => x * speed;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-full h-auto", className)}
      {...props}
    >
      {/* xin chào */}
      <motion.path
        d="M10 20 L20 20 L20 30 L10 30 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0) }}
        onAnimationComplete={onAnimationComplete}
      />

      {/* x1 */}
      <motion.path
        d="M10 40 L20 40 L20 50 L10 50 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.1) }}
      />

      {/* x2 */}
      <motion.path
        d="M10 60 L20 60 L20 70 L10 70 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.2) }}
      />

      {/* i */}
      <motion.path
        d="M30 20 L30 70"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.3) }}
      />

      {/* n1 */}
      <motion.path
        d="M40 20 L40 70 L50 70 L50 20 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.4) }}
      />

      {/* n2 */}
      <motion.path
        d="M60 20 L60 70 L70 70 L70 20 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.5) }}
      />

      {/* c, h1 */}
      <motion.path
        d="M80 20 A10 10 0 0 0 70 30 L70 40"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.6) }}
      />

      {/* h2 */}
      <motion.path
        d="M80 50 L80 70"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.7) }}
      />

      {/* a1 */}
      <motion.path
        d="M90 20 L90 70 L80 70 L80 20 Z"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.8) }}
      />

      {/* a2, o */}
      <motion.path
        d="M90 40 A10 10 0 0 0 80 50 L80 60"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.9) }}
      />

      {/* sign */}
      <motion.path
        d="M95 20 L95 30"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(1) }}
      />
    </motion.svg>
  );
}

function AppleHelloEnglishEffect({
  className,
  speed = 1,
  onAnimationComplete,
  ...props
}: Props) {
  const calc = (x: number) => x * speed;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-full h-auto", className)}
      {...props}
    >
      {/* h1 */}
      <motion.path
        d="M10 20 L10 70 M10 45 L30 45 M30 20 L30 70"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0) }}
        onAnimationComplete={onAnimationComplete}
      />

      {/* h2, ello */}
      <motion.path
        d="M40 20 L40 70 M40 45 L60 45 M60 20 L60 70 M70 20 L70 70 M70 45 L90 45 M90 20 L90 70"
        initial={initialProps}
        animate={animateProps}
        transition={{ duration: calc(0.5), delay: calc(0.1) }}
      />
    </motion.svg>
  );
}

export { AppleHelloEnglishEffect, AppleHelloVietnameseEffect };
