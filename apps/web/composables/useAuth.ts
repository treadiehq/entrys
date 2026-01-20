interface User {
  id: string
  email: string
}

interface Team {
  id: string
  name: string
}

export function useAuth() {
  const user = useState<User | null>('authUser', () => null)
  const team = useState<Team | null>('authTeam', () => null)
  const sessionToken = useState<string | null>('sessionToken', () => null)
  const isLoaded = useState<boolean>('authLoaded', () => false)

  // Load auth state from localStorage (client-side only)
  function loadFromStorage() {
    if (import.meta.server) return
    
    const storedToken = localStorage.getItem('sessionToken')
    const storedUser = localStorage.getItem('user')
    const storedTeam = localStorage.getItem('team')
    
    if (storedToken) {
      sessionToken.value = storedToken
    }
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {}
    }
    if (storedTeam) {
      try {
        team.value = JSON.parse(storedTeam)
      } catch {}
    }
    isLoaded.value = true
  }

  // Save auth state to localStorage
  function saveToStorage(token: string, userData: User, teamData: Team) {
    if (import.meta.server) return
    
    localStorage.setItem('sessionToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('team', JSON.stringify(teamData))
    
    sessionToken.value = token
    user.value = userData
    team.value = teamData
  }

  // Clear auth state
  async function logout() {
    const { fetchApi } = useApi()
    
    if (sessionToken.value) {
      try {
        await fetchApi('/auth/logout', {
          method: 'POST',
          body: { sessionToken: sessionToken.value },
        })
      } catch {}
    }
    
    if (!import.meta.server) {
      localStorage.removeItem('sessionToken')
      localStorage.removeItem('user')
      localStorage.removeItem('team')
    }
    
    sessionToken.value = null
    user.value = null
    team.value = null
    
    await navigateTo('/login')
  }

  // Get user initials for avatar
  const userInitials = computed(() => {
    if (!user.value?.email) return '?'
    return user.value.email.charAt(0).toUpperCase()
  })

  // Check if authenticated
  const isAuthenticated = computed(() => !!sessionToken.value && !!user.value)

  return {
    user,
    team,
    sessionToken,
    isLoaded,
    isAuthenticated,
    userInitials,
    loadFromStorage,
    saveToStorage,
    logout,
  }
}
