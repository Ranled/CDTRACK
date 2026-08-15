import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Calendar, StickyNote, Megaphone,
  Info, User, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Dashboard' },
  { to: '/calendar',  icon: <Calendar className="w-[18px] h-[18px]" />, label: 'Calendar' },
  { to: '/notes',     icon: <StickyNote className="w-[18px] h-[18px]" />, label: 'Notes' },
  { to: '/announcements', icon: <Megaphone className="w-[18px] h-[18px]" />, label: 'Announcements' },
  { to: '/about',     icon: <Info className="w-[18px] h-[18px]" />, label: 'About' },
  { to: '/profile',   icon: <User className="w-[18px] h-[18px]" />, label: 'Profile' },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { signOut, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-background border-r border-border transition-all duration-300',
      collapsed ? 'w-[68px]' : 'w-[220px]'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-border min-h-[64px]',
        collapsed && 'justify-center p-3'
      )}>
        <img
          src="/logo.png"
          alt="CD TRACK"
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-foreground tracking-tight leading-tight">CD TRACK</div>
            <div className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">Academic Tracking System</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) => cn(
              'nav-item group',
              isActive && 'active',
              collapsed && 'justify-center px-0 py-2.5'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + bottom actions */}
      <div className="p-2 space-y-0.5 border-t border-border">
        {!collapsed && profile && (
          <div className="px-3 py-2 mb-1">
            <div className="text-xs font-medium text-foreground truncate">{profile.display_name}</div>
            <div className={cn(
              'text-[10px] font-medium mt-0.5',
              isAdmin ? 'text-primary' : 'text-muted-foreground'
            )}>
              {isAdmin ? 'Administrator' : 'Member'}
            </div>
          </div>
        )}

        <NavLink
          to="/settings"
          onClick={onMobileClose}
          className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0 py-2.5')}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={handleSignOut}
          className={cn('nav-item w-full text-left hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400', collapsed && 'justify-center px-0 py-2.5')}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-t border-border"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4" />
          : <ChevronLeft className="w-4 h-4" />
        }
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed left-0 top-0 bottom-0 z-50 lg:hidden transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="relative h-full w-[220px]">
          {sidebarContent}
          <button
            onClick={onMobileClose}
            className="absolute top-4 right-3 p-1 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}
