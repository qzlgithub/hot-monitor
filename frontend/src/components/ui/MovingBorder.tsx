import React, { useRef } from 'react'
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from 'motion/react'
import { cn } from '../../utils/cn'

/**
 * Aceternity UI - MovingBorder
 * 沿 SVG 路径流动的光点边框，营造"活跃 / 实时"的科技感。
 * 基于 offset-path 动画机制，轻量、无额外依赖。
 */

interface MovingBorderProps {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
  className?: string
  [key: string]: any
}

export function MovingBorder({
  children,
  duration = 2000,
  rx,
  ry,
  className,
  ...otherProps
}: MovingBorderProps) {
  const pathRef = useRef<any>()
  const progress = useMotionValue<number>(0)

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength()
    if (length) {
      const pxPerMillisecond = length / duration
      progress.set((time * pxPerMillisecond) % length)
    }
  })

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0)
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0)

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div
        style={{ transform }}
        className={cn('absolute top-0 left-0 inline-flex h-3 w-3 items-center justify-center rounded-full', className)}
      >
        <motion.div className="h-2 w-2 rounded-full bg-orange-400" style={{ boxShadow: '0 0 12px 2px rgb(249 115 22 / 0.7)' }} />
      </motion.div>
    </>
  )
}

interface MovingBorderCardProps {
  children: React.ReactNode
  borderRadius?: string
  containerClassName?: string
  borderClassName?: string
  duration?: number
  className?: string
}

/**
 * 带动态光边的卡片容器（Aceternity MovingBorder 的应用封装）
 * 用于热点卡片、技能卡片等需要强调"活跃"的内容
 */
export function MovingBorderCard({
  children,
  borderRadius = '1rem',
  containerClassName,
  borderClassName,
  duration,
  className,
}: MovingBorderCardProps) {
  return (
    <div
      className={cn(
        'relative p-[1.5px] overflow-hidden rounded-[1rem]',
        containerClassName
      )}
      style={{ borderRadius }}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              'h-16 w-16 opacity-[0.85] bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-amber-400/80 via-orange-500/40 to-transparent',
              borderClassName
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          'relative h-full w-full bg-white/[0.92] backdrop-blur-sm overflow-hidden',
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </div>
  )
}
