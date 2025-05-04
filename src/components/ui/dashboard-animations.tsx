import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

// Animation variants for different components
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const pulse = {
  hidden: { scale: 0.95, opacity: 0.8 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      yoyo: Infinity, 
      duration: 2, 
      ease: "easeInOut" 
    } 
  },
};

// Hover animations for cards
export const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: { 
    scale: 1.02, 
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
    transition: { duration: 0.3, ease: "easeInOut" }
  },
};

// Animated components
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export function AnimatedCard({ children, className, onClick, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      className={cn("rounded-lg overflow-hidden", className)}
      initial="hidden"
      animate="visible"
      variants={slideUp}
      transition={{ delay }}
      whileHover="hover"
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedList({ children, className }: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ children, className }: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={slideIn}
    >
      {children}
    </motion.div>
  );
}

// Enhanced UI components with animations
export function EnhancedBadge({ children, className, variant = "default" }: { children: ReactNode, className?: string, variant?: string }) {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/80",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "success" && "bg-green-500 text-white hover:bg-green-600",
        variant === "warning" && "bg-yellow-500 text-white hover:bg-yellow-600",
        variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
        variant === "info" && "bg-blue-500 text-white hover:bg-blue-600",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
}

// Theme colors for consistent styling
export const dashboardColors = {
  primary: "bg-blue-600",
  secondary: "bg-purple-600",
  success: "bg-green-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  info: "bg-cyan-600",
  muted: "bg-gray-200 dark:bg-gray-800",
};

// Gradient backgrounds for cards
export const gradientBackgrounds = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-700",
  purple: "bg-gradient-to-br from-purple-500 to-purple-700",
  green: "bg-gradient-to-br from-green-500 to-green-700",
  amber: "bg-gradient-to-br from-amber-400 to-amber-600",
  red: "bg-gradient-to-br from-red-500 to-red-700",
  cyan: "bg-gradient-to-br from-cyan-500 to-cyan-700",
};

// Skeleton loading animations
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <div className="h-24 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

// Enhanced scrollbar styling
export const enhancedScrollbar = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
  "&::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(155, 155, 155, 0.5)",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(155, 155, 155, 0.7)",
  },
};