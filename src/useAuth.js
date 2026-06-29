// src/useAuth.js
import { useState, useEffect } from "react"
import { supabase } from "./supabase"

export function useAuth() {
  const [user,        setUser]        = useState(undefined) // undefined = yükleniyor
  const [authLoading, setAuthLoading] = useState(false)
  const [authError,   setAuthError]   = useState("")

  useEffect(() => {
    // Mevcut oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const clearError = () => setAuthError("")

  // ── Email / Password Kayıt ────────────────────────────────────────────────
  const register = async (name, email, password) => {
    setAuthLoading(true); setAuthError("")
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) setAuthError(friendlyError(error.message))
    setAuthLoading(false)
  }

  // ── Email / Password Giriş ────────────────────────────────────────────────
  const login = async (email, password) => {
    setAuthLoading(true); setAuthError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(friendlyError(error.message))
    setAuthLoading(false)
  }

  // ── Google ile Giriş ──────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setAuthLoading(true); setAuthError("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(friendlyError(error.message))
    setAuthLoading(false)
  }

  // ── Çıkış ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut()
  }

  return { user, authLoading, authError, clearError, register, login, signInWithGoogle, logout }
}

function friendlyError(msg) {
  if (msg.includes("Invalid login"))        return "E-posta veya şifre hatalı."
  if (msg.includes("already registered"))   return "Bu e-posta zaten kayıtlı."
  if (msg.includes("Password should be"))   return "Şifre en az 6 karakter olmalı."
  if (msg.includes("Unable to validate"))   return "Geçersiz e-posta adresi."
  if (msg.includes("Email not confirmed"))  return "E-postanı doğrulamanı bekliyor. Gelen kutunu kontrol et."
  return msg || "Bir hata oluştu."
}
