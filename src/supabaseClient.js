import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = "https://gqpbcujbwtgqgiepdihc.supabase.co/rest/v1/"
const supabaseAnonKey = "sb_publishable__dvY-8NXMMayXkKBGhzSRA_LnAOvsjn"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)