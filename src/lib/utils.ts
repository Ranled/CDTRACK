import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  event:        { bg: 'bg-blue-100 dark:bg-blue-950',   text: 'text-blue-700 dark:text-blue-400',   dot: 'bg-blue-500' },
  assignment:   { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  deadline:     { bg: 'bg-red-100 dark:bg-red-950',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-500' },
  project:      { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  thesis:       { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  capstone:     { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  meeting:      { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  quiz:         { bg: 'bg-cyan-100 dark:bg-cyan-950',   text: 'text-cyan-700 dark:text-cyan-400',   dot: 'bg-cyan-500' },
  exam:         { bg: 'bg-pink-100 dark:bg-pink-950',   text: 'text-pink-700 dark:text-pink-400',   dot: 'bg-pink-500' },
  activity:     { bg: 'bg-teal-100 dark:bg-teal-950',   text: 'text-teal-700 dark:text-teal-400',   dot: 'bg-teal-500' },
  seminar:      { bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  workshop:     { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  defense:      { bg: 'bg-red-100 dark:bg-red-950',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-600' },
  research:     { bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  holiday:      { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  organization: { bg: 'bg-blue-100 dark:bg-blue-950',   text: 'text-blue-700 dark:text-blue-400',   dot: 'bg-blue-600' },
  task:         { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' },
  custom:       { bg: 'bg-gray-100 dark:bg-gray-800',   text: 'text-gray-700 dark:text-gray-400',   dot: 'bg-gray-500' },
}

export const CATEGORY_DOT_COLORS: Record<string, string> = {
  event: '#3B82F6',
  assignment: '#EAB308',
  deadline: '#EF4444',
  project: '#22C55E',
  thesis: '#A855F7',
  capstone: '#A855F7',
  meeting: '#F97316',
  quiz: '#06B6D4',
  exam: '#EC4899',
  activity: '#14B8A6',
  seminar: '#8B5CF6',
  workshop: '#F59E0B',
  defense: '#DC2626',
  research: '#6366F1',
  holiday: '#10B981',
  organization: '#2563EB',
  task: '#64748B',
  custom: '#6B7280',
}

export const ALL_CATEGORIES = [
  'event', 'task', 'assignment', 'project', 'deadline',
  'quiz', 'exam', 'activity', 'meeting', 'seminar',
  'workshop', 'defense', 'research', 'thesis', 'capstone',
  'organization', 'holiday', 'custom'
]

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isToday(dateStr: string): boolean {
  const today = new Date()
  const date = new Date(dateStr + 'T00:00:00')
  return date.toDateString() === today.toDateString()
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
    case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400'
    case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
    default: return 'text-gray-600 bg-gray-50'
  }
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '...' : str
}

export const NOTE_COLORS = [
  { name: 'White',  value: '#FFFFFF', textClass: 'text-gray-800' },
  { name: 'Blue',   value: '#EFF6FF', textClass: 'text-blue-800' },
  { name: 'Yellow', value: '#FEFCE8', textClass: 'text-yellow-800' },
  { name: 'Green',  value: '#F0FDF4', textClass: 'text-green-800' },
  { name: 'Pink',   value: '#FDF2F8', textClass: 'text-pink-800' },
  { name: 'Purple', value: '#FAF5FF', textClass: 'text-purple-800' },
  { name: 'Orange', value: '#FFF7ED', textClass: 'text-orange-800' },
]
