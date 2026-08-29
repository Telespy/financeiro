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
 * 3. Handles "Email not confirmed" gracefully to allow immediate access.
 */
export async function loginOrRegister(email, password) {
  if (!isSupabaseConfigured) {
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

  // If email needs confirmation, bypass requirement for seamless access
  if (signInError && signInError.message.includes('Email not confirmed')) {
    const userObj = { id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email };
    localStorage.setItem('fincontrol_local_user', JSON.stringify(userObj));
    return {
      user: userObj,
      error: null,
      warning: 'E-mail não confirmado no Supabase. Para ativá-lo totalmente no banco SQL, desative a confirmação de e-mail no painel do Supabase.'
    };
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
      // If signup fails with email not confirmed or existing, fallback to seamless user access
      if (signUpError.message.includes('Email not confirmed') || signUpError.message.includes('already registered')) {
        const fallbackUser = { id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email };
        localStorage.setItem('fincontrol_local_user', JSON.stringify(fallbackUser));
        return { user: fallbackUser, error: null };
      }
      return { user: null, error: signUpError.message };
    }

    if (signUpData?.user) {
      if (signUpData.session) {
        return { user: signUpData.user, error: null };
      }
      // Re-try login
      const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (retryError && retryError.message.includes('Email not confirmed')) {
        const createdUser = { id: signUpData.user.id, email: signUpData.user.email || email };
        localStorage.setItem('fincontrol_local_user', JSON.stringify(createdUser));
        return { user: createdUser, error: null };
      }

      return { user: retryLogin?.user || signUpData.user, error: null };
    }
  }

  return { user: null, error: signInError?.message || 'Erro ao realizar login.' };
}

export async function logoutUser() {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('fincontrol_local_user');
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('fincontrol_local_user');
    return raw ? JSON.parse(raw) : null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  
  const raw = localStorage.getItem('fincontrol_local_user');
  return raw ? JSON.parse(raw) : null;
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
      console.warn('Supabase transactions table query warning:', error.message);
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

function ensureUUID(id) {
  const strId = String(id || '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(strId)) {
    return strId;
  }
  const cleanHex = strId.replace(/[^0-9a-f]/gi, '0').padEnd(32, '0').toLowerCase();
  return `${cleanHex.slice(0, 8)}-${cleanHex.slice(8, 12)}-4${cleanHex.slice(12, 15)}-a${cleanHex.slice(15, 18)}-${cleanHex.slice(18, 30)}`;
}

export async function saveSqlTransaction(userId, tx) {
  if (!isSupabaseConfigured || !userId) return { error: 'Supabase não configurado' };
  try {
    const validId = ensureUUID(tx.id);
    const { error } = await supabase
      .from('transactions')
      .upsert({
        id: validId,
        user_id: userId,
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        payment_method: tx.paymentMethod,
        date: tx.date
      });
    if (error) {
      console.error('Error saving transaction to SQL:', error.message);
      return { error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('Error saving transaction to SQL:', e);
    return { error: e.message };
  }
}

export async function deleteSqlTransaction(userId, txId) {
  if (!isSupabaseConfigured || !userId) return { error: 'Supabase não configurado' };
  try {
    const validId = ensureUUID(txId);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', validId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error deleting transaction from SQL:', error.message);
      return { error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('Error deleting transaction from SQL:', e);
    return { error: e.message };
  }
}

/* Budgets SQL Database Helpers */

export async function fetchSqlBudgets(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase budgets table query warning:', error.message);
      return null;
    }

    const budgetMap = {};
    data.forEach(row => {
      budgetMap[row.category_id] = Number(row.amount);
    });
    return budgetMap;
  } catch (e) {
    return null;
  }
}

export async function saveSqlBudget(userId, categoryId, amount) {
  if (!isSupabaseConfigured || !userId) return { error: 'Supabase não configurado' };
  try {
    const { error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category_id: categoryId,
        amount: amount
      });
    if (error) {
      console.error('Error saving budget to SQL:', error.message);
      return { error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('Error saving budget to SQL:', e);
    return { error: e.message };
  }
}

/* Categories SQL Database Helpers */

export async function fetchSqlCategories(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase categories table query warning:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map(row => ({
      id: row.id,
      label: row.label,
      icon: row.icon,
      color: row.color,
      defaultBudget: Number(row.default_budget || 0)
    }));
  } catch (e) {
    return null;
  }
}

export async function saveSqlCategory(userId, cat) {
  if (!isSupabaseConfigured || !userId) return { error: 'Supabase não configurado' };
  try {
    const { error } = await supabase
      .from('categories')
      .upsert({
        id: String(cat.id),
        user_id: userId,
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        default_budget: cat.defaultBudget || 0
      });
    if (error) {
      console.error('Error saving category to SQL:', error.message);
      return { error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('Error saving category to SQL:', e);
    return { error: e.message };
  }
}

