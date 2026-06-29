// src/AuthScreen.jsx
import { useState } from "react"

const C = { primary:"#000666", grad:"linear-gradient(135deg,#000666,#1a237e)", border:"#e5e7eb", text:"#111827", muted:"#6b7280", subtle:"#9ca3af" }

export default function AuthScreen({ onGoogle, onLogin, onRegister, loading, error, onClearError }) {
  const [mode,setMode]=useState("login")
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [showPass,setShowPass]=useState(false)

  const submit=e=>{e.preventDefault();mode==="login"?onLogin(email,password):onRegister(name,email,password)}
  const sw=m=>{setMode(m);onClearError();setName("");setEmail("");setPassword("")}
  const inp=err=>({width:"100%",background:err?"#fef2f2":"#f9fafb",border:`1.5px solid ${err?"#dc2626":"transparent"}`,borderRadius:9,padding:"11px 14px",fontSize:14,fontFamily:"inherit",outline:"none",color:C.text,boxSizing:"border-box"})

  return(
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",padding:20,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:54,height:54,borderRadius:16,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px"}}>💰</div>
          <div style={{fontWeight:900,fontSize:22,color:C.primary,letterSpacing:"-.02em"}}>Atelier Finance</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>Kişisel Borç Takip</div>
        </div>
        <div style={{background:"#fff",borderRadius:20,padding:"26px 26px 22px",boxShadow:"0 4px 24px rgba(0,6,102,.08)",border:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",background:"#f3f4f6",borderRadius:12,padding:4,marginBottom:22,gap:4}}>
            {[["login","Giriş Yap"],["register","Kayıt Ol"]].map(([m,l])=>(
              <button key={m} onClick={()=>sw(m)} style={{flex:1,padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",background:mode===m?"#fff":"transparent",color:mode===m?C.primary:C.muted,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{l}</button>
            ))}
          </div>
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
            {mode==="register"&&(
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:C.subtle,marginBottom:5}}>Ad Soyad</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Adınız Soyadınız" required style={inp(false)} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="transparent"}/>
              </div>
            )}
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:C.subtle,marginBottom:5}}>E-posta</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);onClearError()}} placeholder="ornek@email.com" required style={inp(!!error)} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=error?"#dc2626":"transparent"}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:C.subtle,marginBottom:5}}>Şifre</label>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);onClearError()}} placeholder={mode==="register"?"En az 6 karakter":"Şifreniz"} required style={{...inp(!!error),paddingRight:42}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=error?"#dc2626":"transparent"}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>{showPass?"🙈":"👁"}</button>
              </div>
            </div>
            {error&&<div style={{display:"flex",alignItems:"center",gap:8,background:"#fef2f2",color:"#dc2626",fontSize:13,fontWeight:600,padding:"10px 12px",borderRadius:9}}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:12,background:loading?"#e5e7eb":C.grad,color:loading?"#9ca3af":"#fff",fontFamily:"inherit",fontWeight:700,fontSize:14,border:"none",cursor:loading?"not-allowed":"pointer",marginTop:2,boxShadow:loading?"none":"0 4px 14px rgba(0,6,102,.2)"}}>
              {loading?"⏳ İşleniyor...":mode==="login"?"🔑 Giriş Yap":"✓ Kayıt Ol"}
            </button>
          </form>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
            <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.subtle}}>veya</span><div style={{flex:1,height:1,background:C.border}}/>
          </div>
          <button onClick={onGoogle} disabled={loading} style={{width:"100%",padding:"11px 0",borderRadius:12,background:"#fff",color:C.text,fontFamily:"inherit",fontWeight:600,fontSize:14,border:"1.5px solid #e5e7eb",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
            onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google ile Giriş Yap
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:C.subtle,marginTop:18,lineHeight:1.6}}>Verileriniz Supabase'de güvenle saklanır.</p>
      </div>
    </div>
  )
}
