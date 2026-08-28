import { createClient } from '@supabase/supabase-js';

// Public Supabase configuration for zero-config Vercel deployment
const DEFAULT_SUPABASE_URL = 'https://mhlbbwnnrbakohjmjfme.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_7jk2Ym3U8BHVUEutoXMCMg_U94w3oke';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Auto-login or Register:
 * 1. Tries to sign in with email and password.
 * 2. If user is not found, automatically signs up and logs in!
 */
export async function loginOrRegister(email, password) {
  if (!isSupabaseConfigured) {
    // Local demo authentication fallback
    const mockUser = { id: 'local-demo-user', email };
    localStorage.setItem('fincontrol_local_user', JSON.stringify(mockUser));
    return { user: mockUser, error: null };
  }

  // 1. Try Login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInError && signInData?.user) {
    return { user: signInData.user, error: null };
  }

  // 2. If login failed due to invalid credentials or user not found, attempt auto registration
  if (signInError && (
    signInError.message.includes('Invalid login credentials') ||
    signInError.message.includes('User not found')
  )) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      return { user: null, error: signUpError.message };
    }

    if (signUpData?.user) {
      if (signUpData.session) {
        return { user: signUpData.user, error: null };
      }
      const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { user: retryLogin?.user || signUpData.user, error: retryError?.message || null };
    }
  }

  return { user: null, error: signInError?.message || 'Erro ao realizar login.' };
}

export async function logoutUser() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('fincontrol_local_user');
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('fincontrol_local_user');
    return raw ? JSON.parse(raw) : null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

/* SQL Database CRUD helper functions */

export async function fetchSqlTransactions(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase table missing or query error:', error.message);
      return null;
    }
    return data.map(row => ({
      id: row.id,
      type: row.type,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      paymentMethod: row.payment_method,
      date: row.date
    }));
  } catch (e) {
    return null;
  }
}

export async function saveSqlTransaction(userId, tx) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase
      .from('transactions')
      .upsert({
        id: tx.id.includes('-') && tx.id.length > 20 ? tx.id : undefined,
        user_id: userId,
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        payment_method: tx.paymentMethod,
        date: tx.date
      });
  } catch (e) {
    console.error('Error saving transaction to SQL', e);
  }
}

export async function deleteSqlTransaction(userId, txId) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase
      .from('transactions')
      .delete()
      .eq('id', txId)
      .eq('user_id', userId);
  } catch (e) {
    console.error('Error deleting transaction from SQL', e);
  }
}
