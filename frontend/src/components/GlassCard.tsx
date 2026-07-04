"use client";

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
  id?: string;
}

export default function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  delay = 0,
  id,
}: GlassCardProps) {
  const cardClasses = `rounded-3xl border border-white/20 dark:border-white/5 p-6 glass-card ${
    hoverEffect ? 'glass-card-hover' : ''
  } ${className}`;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className={cardClasses}
    >
      {children}
    </motion.div>
  );
}
