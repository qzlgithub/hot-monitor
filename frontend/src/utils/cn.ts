import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind 类名（Aceternity UI 工具函数）
 * - clsx: 条件类名拼接
 * - twMerge: 解决冲突类名（后者覆盖前者）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
