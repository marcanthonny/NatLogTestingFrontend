import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

export const login = async (email, password) => {
  const { user, session, error } = await supabase.auth.signIn({
    email,
    password,
  })
  if (error) throw error;
  return { user, session };
}

// ...other API methods...
