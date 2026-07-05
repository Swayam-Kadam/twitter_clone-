import { supabase } from './supabaseClient'

function sanitizeUsername(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24)
}

function buildBaseUsername(user) {
  const meta = user.user_metadata || {}
  const emailLocal = user.email?.split('@')[0] || ''
  const fromEmail = sanitizeUsername(emailLocal)
  if (fromEmail.length >= 3) return fromEmail

  const fullName = meta.full_name || meta.name || ''
  const fromName = sanitizeUsername(fullName)
  if (fromName.length >= 3) return fromName

  return `user_${user.id.replace(/-/g, '').slice(0, 8)}`
}

async function ensureUniqueUsername(baseUsername, userId) {
  let username = baseUsername || `user_${userId.slice(0, 8)}`
  let suffix = 0

  while (suffix < 20) {
    const candidate = suffix === 0 ? username : `${username}${suffix}`
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()

    if (!data || data.id === userId) return candidate
    suffix++
  }

  return `${username}_${userId.slice(0, 5)}`
}

function extractProfileFromUser(user) {
  const meta = user.user_metadata || {}
  return {
    full_name: meta.full_name || meta.name || '',
    avatar_url: meta.avatar_url || meta.picture || '',
  }
}

/**
 * Ensures a profiles row exists for the auth user.
 * Uses Google/OAuth metadata for default full_name, username, and avatar_url.
 */
export async function ensureUserProfile(user) {
  if (!user?.id) return null

  const { full_name, avatar_url } = extractProfileFromUser(user)

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing) {
    const updates = {}
    if (!existing.full_name && full_name) updates.full_name = full_name
    if (!existing.avatar_url && avatar_url) updates.avatar_url = avatar_url

    const needsUsername =
      !existing.username ||
      existing.username.startsWith('unknown')

    if (needsUsername) {
      const base = buildBaseUsername(user)
      updates.username = await ensureUniqueUsername(base, user.id)
    }

    if (Object.keys(updates).length === 0) return existing

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const baseUsername = buildBaseUsername(user)
  const username = await ensureUniqueUsername(baseUsername, user.id)

  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      id: user.id,
      username,
      full_name: full_name || null,
      avatar_url: avatar_url || null,
    }])
    .select()
    .single()

  if (error) {
    // Profile may have been created by a concurrent call
    if (error.code === '23505') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      return existingProfile
    }
    throw error
  }
  return data
}
