"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Dumbbell,
  PlusCircle,
  LogOut,
  BookOpen,
  Calendar,
  BarChart3,
  User,
  Settings,
  SquareStack,
} from "lucide-react"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Entrenamientos",
    url: "/trainings",
    icon: Dumbbell,
  },
  {
    title: "Programas",
    url: "/programs",
    icon: SquareStack,
  },
  {
    title: "Rutinas",
    url: "/routines",
    icon: Calendar,
  },
  {
    title: "Ejercicios",
    url: "/exercises",
    icon: BookOpen,
  },
  {
    title: "Estadísticas",
    url: "/stats",
    icon: BarChart3,
  },
]

const actionItems = [
  {
    title: "Nuevo Entrenamiento",
    url: "/trainings/new",
    icon: PlusCircle,
  },
]

const settingsItems = [
  {
    title: "Perfil",
    url: "/profile",
    icon: User,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile({
            full_name: profile.full_name,
            email: profile.email || user.email || '',
            avatar_url: profile.avatar_url,
          })
        } else {
          // Fallback si no hay perfil
          setUserProfile({
            full_name: null,
            email: user.email || '',
            avatar_url: null,
          })
        }
      }
    }

    loadUserProfile()

    // Escuchar eventos de actualización del perfil
    const handleProfileUpdate = () => {
      loadUserProfile()
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [pathname]) // Recargar cuando cambia la ruta también

  const handleLogout = async () => {
    await logout()
    // El hook useAuth ya maneja la redirección
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Dumbbell className="h-6 w-6 text-primary shrink-0" />
          <span className="font-semibold text-lg truncate group-data-[collapsible=icon]:hidden">
            Gym Tracker
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Información del Usuario */}
          {userProfile && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                {userProfile.avatar_url ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                    <Image
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate">
                    {userProfile.full_name || 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {userProfile.email}
                  </span>
                </div>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

