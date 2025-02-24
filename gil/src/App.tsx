//main app logic


import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './services/supabase'
import { useStore } from './store'

const Stack = createNativeStackNavigator()

export default function App() {
  const { user, setUser } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        })
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        })
      } else {
        setUser(null)
      }
    })
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator>
        ///* We'll add screens here in the next step */
      </Stack.Navigator>
    </NavigationContainer>
  )
} 