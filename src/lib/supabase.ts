import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdtuhfivrqdwhisqvhzj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ku8shxk5oeWUu2voJJXn4w_sDHWxuNH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
