declare module 'framer-motion' {
  export interface Transition {
    type?: string;
    stiffness?: number;
    damping?: number;
    mass?: number;
    duration?: number;
    delay?: number;
    ease?: string | number[];
    repeat?: number;
    repeatType?: string;
    [key: string]: any;
  }

  export interface Variants {
    [key: string]: any;
  }

  export const motion: any;
  export const AnimatePresence: any;
  export function useAnimation(): any;
  export function useMotionValue(initial: any): any;
  export function useTransform(...args: any[]): any;
  export function useSpring(value: any, config?: Transition): any;
}
