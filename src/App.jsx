// src/App.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';
import AuthScreen from './AuthScreen';

function useWidth() {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

const CAT = {
  credit_card: {
    label: 'Kredi Kartı',
    icon: '💳',
    color: '#000666',
    bg: '#e0e0ff',
    tc: '#000666',
  },
  loan: {
    label: 'Kredi',
    icon: '🏦',
    color: '#1a237e',
    bg: '#d2d4ff',
    tc: '#1a237e',
  },
  personal_debt: {
    label: 'Elden Borç',
    icon: '🤝',
    color: '#c2410c',
    bg: '#ffdbd0',
    tc: '#7b2e12',
  },
};
const C = {
  primary: '#000666',
  primary2: '#1a237e',
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#f1f5f9',
  text: '#111827',
  muted: '#6b7280',
  subtle: '#9ca3af',
  grad: 'linear-gradient(135deg,#000666,#1a237e)',
};

const fmt = (n, s = '₺') =>
  s +
  (n || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtD = (s) => {
  try {
    return new Date(s).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
};
const fmtDT = (s) => {
  try {
    const d = new Date(s);
    return (
      d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) +
      ' ' +
      d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return s;
  }
};
const dayD = (s) => (s ? Math.ceil((new Date(s) - new Date()) / 864e5) : null);
const dSt = (d) => {
  if (d.status === 'paid') return 'paid';
  const x = dayD(d.dueDate);
  return x === null
    ? 'normal'
    : x < 0
      ? 'overdue'
      : x <= 3
        ? 'urgent'
        : x <= 7
          ? 'soon'
          : 'normal';
};
const dLbl = (d) => {
  if (d.status === 'paid') return 'Ödendi';
  const x = dayD(d.dueDate);
  if (x === null) return fmtD(d.dueDate);
  if (x < 0) return Math.abs(x) + 'g gecikmiş';
  if (x === 0) return 'Bugün!';
  if (x === 1) return 'Yarın';
  if (x <= 7) return x + 'g kaldı';
  return fmtD(d.dueDate);
};
const dCol = (s) =>
  ({
    overdue: '#dc2626',
    urgent: '#d97706',
    soon: '#2563eb',
    normal: C.muted,
    paid: '#16a34a',
  })[s] || C.muted;
const pct = (d) =>
  d.totalAmount
    ? Math.min(
        100,
        Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100),
      )
    : 100;

const Badge = ({ cat }) => {
  const c = CAT[cat] || CAT.credit_card;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: c.bg,
        color: c.tc,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.05em',
        padding: '2px 8px',
        borderRadius: 99,
        whiteSpace: 'nowrap',
      }}
    >
      {c.icon} {c.label}
    </span>
  );
};
const Bar = ({ val, h = 5 }) => (
  <div
    style={{
      height: h,
      background: '#e5e7eb',
      borderRadius: 99,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: '100%',
        width: `${val}%`,
        background: C.grad,
        borderRadius: 99,
        transition: 'width .5s',
      }}
    />
  </div>
);
const Btn = ({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  full = false,
}) => {
  const sz = {
    sm: { padding: '6px 13px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 13 },
    lg: { padding: '12px 22px', fontSize: 14 },
  };
  const va = {
    primary: {
      background: disabled ? '#e5e7eb' : C.grad,
      color: disabled ? '#9ca3af' : '#fff',
      border: 'none',
      boxShadow: disabled ? 'none' : '0 4px 14px rgba(0,6,102,.2)',
    },
    outline: {
      background: 'transparent',
      color: C.primary,
      border: '1.5px solid #ddd',
    },
    ghost: { background: '#f3f4f6', color: C.text, border: 'none' },
    danger: { background: '#fef2f2', color: '#dc2626', border: 'none' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 99,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : undefined,
        fontFamily: 'inherit',
        ...sz[size],
        ...va[variant],
      }}
    >
      {children}
    </button>
  );
};
const Label = ({ children }) => (
  <label
    style={{
      display: 'block',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: C.subtle,
      marginBottom: 5,
    }}
  >
    {children}
  </label>
);
const TInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  prefix,
}) => (
  <div>
    {label && <Label>{label}</Label>}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: error ? '#fef2f2' : '#f9fafb',
        border: `1.5px solid ${error ? '#dc2626' : 'transparent'}`,
        borderRadius: 9,
        padding: '9px 12px',
      }}
      onFocusCapture={(e) =>
        (e.currentTarget.style.borderColor = error ? '#dc2626' : C.primary)
      }
      onBlurCapture={(e) =>
        (e.currentTarget.style.borderColor = error ? '#dc2626' : 'transparent')
      }
    >
      {prefix && (
        <span style={{ fontWeight: 700, color: C.subtle, fontSize: 14 }}>
          {prefix}
        </span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          color: C.text,
          fontFamily: 'inherit',
          minWidth: 0,
        }}
      />
    </div>
    {error && (
      <p
        style={{
          fontSize: 11,
          color: '#dc2626',
          fontWeight: 600,
          marginTop: 3,
        }}
      >
        {error}
      </p>
    )}
  </div>
);

function LoadingScreen({ message = 'Yükleniyor...' }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.bg,
        gap: 16,
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: C.grad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        💰
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.primary }}>
        Atelier Finance
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.primary,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.muted }}>{message}</div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', emoji: '🏠' },
  { id: 'debts', label: 'Borçlar', emoji: '💰' },
  { id: 'history', label: 'Geçmiş', emoji: '📋' },
  { id: 'settings', label: 'Ayarlar', emoji: '⚙️' },
];

function Sidebar({ page, onNav, user }) {
  const name =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: C.white,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${C.border}`,
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '20px 16px 14px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 15,
            color: C.primary,
            letterSpacing: '-.02em',
          }}
        >
          Atelier Finance
        </div>
        <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
          Borç Takip
        </div>
      </div>
      <nav
        style={{
          flex: 1,
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {NAV.map((n, i) => {
          const active = page === n.id;
          return (
            <div key={n.id}>
              {i === 2 && (
                <div
                  style={{ height: 1, background: C.border, margin: '5px 4px' }}
                />
              )}
              <button
                onClick={() => onNav(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '9px 12px',
                  borderRadius: 10,
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? '#eff6ff' : 'transparent',
                  color: active ? C.primary : C.muted,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 16 }}>{n.emoji}</span>
                {n.label}
                {active && (
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: C.primary,
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${C.border}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: C.grad,
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: 11, color: C.subtle }}>Kişisel</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function BottomNav({ page, onNav }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,.96)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}
    >
      {NAV.map((n) => {
        const active = page === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '10px 4px 8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: active ? C.primary : C.subtle,
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 20 }}>{n.emoji}</span>
            <span>{n.label}</span>
            {active && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: C.primary,
                  marginTop: 1,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function MobileDrawer({ page, onNav, user, onClose, onLogout }) {
  const name =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.4)',
          zIndex: 90,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          background: C.white,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,.12)',
        }}
      >
        <div
          style={{
            padding: '18px 16px 14px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.primary }}>
              Atelier Finance
            </div>
            <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
              Borç Takip
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <nav
          style={{
            flex: 1,
            padding: '10px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV.map((n, i) => {
            const active = page === n.id;
            return (
              <div key={n.id}>
                {i === 2 && (
                  <div
                    style={{
                      height: 1,
                      background: C.border,
                      margin: '5px 4px',
                    }}
                  />
                )}
                <button
                  onClick={() => {
                    onNav(n.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 14px',
                    borderRadius: 10,
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#eff6ff' : 'transparent',
                    color: active ? C.primary : C.muted,
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{n.emoji}</span>
                  {n.label}
                </button>
              </div>
            );
          })}
        </nav>
        <div
          style={{
            padding: '10px 8px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#f9fafb',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: C.grad,
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 11, color: C.subtle }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fef2f2',
              color: '#dc2626',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            🚪 Çıkış Yap
          </button>
        </div>
      </div>
    </>
  );
}

const TITLES = {
  dashboard: 'Dashboard',
  debts: 'Borçlar',
  history: 'Ödeme Geçmişi',
  settings: 'Ayarlar',
};
function Topbar({ page, isMobile, menuOpen, onMenuToggle, onAdd }) {
  return (
    <div
      style={{
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        padding: `0 ${isMobile ? 14 : 20}px`,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: 10,
      }}
    >
      {isMobile && (
        <button
          onClick={onMenuToggle}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      )}
      <div
        style={{
          fontWeight: 800,
          fontSize: isMobile ? 14 : 15,
          color: C.primary,
          flex: 1,
        }}
      >
        {TITLES[page]}
      </div>
      <Btn onClick={onAdd} size="sm">
        ➕ {isMobile ? 'Ekle' : 'Yeni Borç'}
      </Btn>
    </div>
  );
}

function DebtCard({ debt, sym, onPay, onDetail }) {
  const st = dSt(debt),
    lbl = dLbl(debt),
    p = pct(debt);
  return (
    <div
      onClick={() => onDetail(debt.id)}
      style={{
        background: C.white,
        borderRadius: 14,
        padding: 16,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        opacity: debt.status === 'paid' ? 0.65 : 1,
        borderLeft: `3px solid ${st === 'overdue' ? '#dc2626' : st === 'urgent' ? '#d97706' : st === 'paid' ? '#16a34a' : 'transparent'}`,
        transition: 'box-shadow .15s',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)')
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Badge cat={debt.category} />
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.text,
              marginTop: 5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {debt.name}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: C.primary }}>
            {fmt(debt.remainingAmount, sym)}
          </div>
          {debt.status === 'paid' ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#16a34a',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: 99,
              }}
            >
              ✓ Ödendi
            </span>
          ) : (
            <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
              {debt.category === 'loan' && debt.totalMonths ? (
                <span style={{ fontWeight: 700, color: C.primary }}>
                  {debt.paidMonths || 0}/{debt.totalMonths} ay
                </span>
              ) : (
                fmt(debt.plannedPaymentAmount, sym) + '/ay'
              )}
              {debt.loanType === 'kmh' && debt.monthlyRate && (
                <span
                  style={{
                    fontSize: 9,
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '1px 6px',
                    borderRadius: 99,
                    marginLeft: 4,
                    fontWeight: 700,
                  }}
                >
                  KMH %{(debt.monthlyRate * 100).toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <Bar value={p} h={4} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: dCol(st) }}>
          {lbl}
        </span>
        {debt.status !== 'paid' && (
          <div onClick={(e) => e.stopPropagation()}>
            <Btn size="sm" onClick={() => onPay(debt.id)}>
              💸 Öde
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ debts, sum, sym, onPay, onDetail, onFilter, isMobile }) {
  const active = useMemo(
    () =>
      debts
        .filter((d) => d.status === 'active')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [debts],
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: C.grad,
          borderRadius: 16,
          padding: isMobile ? 16 : 22,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: 'rgba(255,255,255,.05)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,.6)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 5,
          }}
        >
          Toplam Kalan Borç
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: isMobile ? 22 : 28,
            letterSpacing: '-.03em',
            marginBottom: 4,
          }}
        >
          {fmt(sum.total, sym)}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,.55)',
            marginBottom: 14,
          }}
        >
          {sum.activeCount} aktif · {sum.paidCount} ödendi
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          {[
            ['Bu Ay', fmt(sum.monthly, sym)],
            ['Geciken', sum.urgent + ' borç'],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                background: 'rgba(255,255,255,.1)',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,.5)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                {l}
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
        }}
      >
        {[
          { cat: 'credit_card', amt: sum.cc },
          { cat: 'loan', amt: sum.loan },
          { cat: 'personal_debt', amt: sum.personal },
        ].map((x) => (
          <div
            key={x.cat}
            onClick={() => onFilter(x.cat)}
            style={{
              background: C.white,
              borderRadius: 12,
              padding: isMobile ? 12 : 14,
              border: `1px solid ${C.border}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            <div style={{ fontSize: isMobile ? 20 : 24, marginBottom: 4 }}>
              {CAT[x.cat].icon}
            </div>
            <div style={{ fontSize: 10, color: C.subtle, marginBottom: 3 }}>
              {CAT[x.cat].label}
            </div>
            <div
              style={{
                fontWeight: 900,
                fontSize: isMobile ? 13 : 15,
                color: CAT[x.cat].color,
              }}
            >
              {fmt(x.amt, sym)}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: C.text,
            marginBottom: 10,
          }}
        >
          Aktif Borçlar
        </div>
        {active.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              color: C.subtle,
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
            }}
          >
            Aktif borcunuz yok 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.slice(0, isMobile ? 4 : 6).map((d) => (
              <DebtCard
                key={d.id}
                debt={d}
                sym={sym}
                onPay={onPay}
                onDetail={onDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DebtsPage({ debts, sym, onPay, onDetail, initCat = 'all', isMobile }) {
  const [cat, setCat] = useState(initCat),
    [status, setStatus] = useState('active'),
    [sort, setSort] = useState('due');
  const list = useMemo(() => {
    let l = [...debts];
    if (cat !== 'all') l = l.filter((d) => d.category === cat);
    if (status !== 'all') l = l.filter((d) => d.status === status);
    if (sort === 'due')
      l.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    else if (sort === 'amount')
      l.sort((a, b) => b.remainingAmount - a.remainingAmount);
    else l.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return l;
  }, [debts, cat, status, sort]);
  const chip = (v, l, cur, set) => (
    <button
      key={v}
      onClick={() => set(v)}
      style={{
        padding: '5px 12px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        border: cur === v ? 'none' : '1px solid #e5e7eb',
        cursor: 'pointer',
        background: cur === v ? C.primary : '#fff',
        color: cur === v ? '#fff' : C.muted,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {l}
    </button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'none',
          }}
        >
          {[
            ['all', 'Tümü'],
            ['credit_card', 'Kredi Kartı'],
            ['loan', 'Kredi'],
            ['personal_debt', 'Elden Borç'],
          ].map(([v, l]) => chip(v, l, cat, setCat))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: 99,
              padding: 3,
              gap: 2,
            }}
          >
            {[
              ['active', 'Aktif'],
              ['paid', 'Ödendi'],
              ['all', 'Tümü'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setStatus(v)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: status === v ? '#fff' : 'transparent',
                  color: status === v ? C.primary : C.muted,
                  fontFamily: 'inherit',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              marginLeft: 'auto',
            }}
          >
            <option value="due">Son Ödeme</option>
            <option value="amount">Tutar</option>
            <option value="name">Ad</option>
          </select>
          <span style={{ fontSize: 11, color: C.subtle, whiteSpace: 'nowrap' }}>
            {list.length} kayıt
          </span>
        </div>
      </div>
      {list.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: C.subtle,
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
          }}
        >
          Sonuç bulunamadı.
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              sym={sym}
              onPay={onPay}
              onDetail={onDetail}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                {[
                  ['Borç', '27%'],
                  ['Kategori', '14%'],
                  ['Kalan', '17%'],
                  ['Aylık', '12%'],
                  ['Son Ödeme', '18%'],
                  ['', '12%'],
                ].map(([h, w]) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      color: C.subtle,
                      padding: '10px 12px',
                      width: w,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const st = dSt(d);
                return (
                  <tr
                    key={d.id}
                    onClick={() => onDetail(d.id)}
                    style={{
                      cursor: 'pointer',
                      opacity: d.status === 'paid' ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#f9fafb')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: C.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.name}
                      </div>
                      {d.note && (
                        <div
                          style={{
                            fontSize: 11,
                            color: C.subtle,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.note}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                      }}
                    >
                      <Badge cat={d.category} />
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: C.primary,
                        }}
                      >
                        {fmt(d.remainingAmount, sym)}
                      </div>
                      <Bar value={pct(d)} h={3} />
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {fmt(d.plannedPaymentAmount, sym)}
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                        fontSize: 12,
                        fontWeight: 600,
                        color: dCol(st),
                      }}
                    >
                      {dLbl(d)}
                    </td>
                    <td
                      style={{
                        padding: '11px 12px',
                        borderBottom: '1px solid #f9fafb',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {d.status === 'paid' ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#16a34a',
                            background: '#dcfce7',
                            padding: '3px 9px',
                            borderRadius: 99,
                          }}
                        >
                          ✓ Ödendi
                        </span>
                      ) : (
                        <Btn size="sm" onClick={() => onPay(d.id)}>
                          💸 Öde
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryPage({ payments, sym, isMobile }) {
  const [cat, setCat] = useState('all');
  const list = useMemo(
    () => [...payments].filter((p) => cat === 'all' || p.category === cat),
    [payments, cat],
  );
  const tAll = payments.reduce((s, p) => s + p.amount, 0),
    tFilt = list.reduce((s, p) => s + p.amount, 0);
  const chip = (v, l) => (
    <button
      key={v}
      onClick={() => setCat(v)}
      style={{
        padding: '5px 12px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        border: cat === v ? 'none' : '1px solid #e5e7eb',
        cursor: 'pointer',
        background: cat === v ? C.primary : '#fff',
        color: cat === v ? '#fff' : C.muted,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {l}
    </button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 10,
        }}
      >
        <div
          style={{
            background: C.grad,
            borderRadius: 14,
            padding: 18,
            color: '#fff',
            gridColumn: isMobile ? undefined : 'span 2',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,.6)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 4,
            }}
          >
            Toplam Ödenen
          </div>
          <div
            style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.02em' }}
          >
            {fmt(tAll, sym)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,.55)',
              marginTop: 2,
            }}
          >
            {payments.length} işlem
          </div>
        </div>
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            padding: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 5 }}>✅</div>
          <div style={{ fontSize: 11, color: C.subtle, marginBottom: 2 }}>
            Bu Filtre
          </div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#16a34a' }}>
            {fmt(tFilt, sym)}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {[
          ['all', 'Tümü'],
          ['credit_card', 'Kredi Kartı'],
          ['loan', 'Kredi'],
          ['personal_debt', 'Elden Borç'],
        ].map(([v, l]) => chip(v, l))}
      </div>
      {list.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: C.subtle,
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
          }}
        >
          Ödeme kaydı yok.
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((p) => (
            <div
              key={p.id}
              style={{
                background: C.white,
                borderRadius: 12,
                padding: '12px 14px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: C.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.debtName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 3,
                  }}
                >
                  <Badge cat={p.category} />
                  <span style={{ fontSize: 11, color: C.subtle }}>
                    {fmtDT(p.paidAt)}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{ fontWeight: 800, fontSize: 14, color: C.primary }}
                >
                  {fmt(p.amount, sym)}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#7b2e12',
                    background: '#ffdbd0',
                    padding: '2px 7px',
                    borderRadius: 99,
                    marginTop: 2,
                  }}
                >
                  BAŞARILI
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                {['Borç', 'Kategori', 'Tutar', 'Tarih'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      color: C.subtle,
                      padding: '10px 12px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td
                    style={{
                      padding: '11px 12px',
                      borderBottom: '1px solid #f9fafb',
                      fontWeight: 700,
                      fontSize: 13,
                      color: C.text,
                    }}
                  >
                    {p.debtName}
                  </td>
                  <td
                    style={{
                      padding: '11px 12px',
                      borderBottom: '1px solid #f9fafb',
                    }}
                  >
                    <Badge cat={p.category} />
                  </td>
                  <td
                    style={{
                      padding: '11px 12px',
                      borderBottom: '1px solid #f9fafb',
                      fontWeight: 800,
                      fontSize: 13,
                      color: C.primary,
                    }}
                  >
                    {fmt(p.amount, sym)}
                  </td>
                  <td
                    style={{
                      padding: '11px 12px',
                      borderBottom: '1px solid #f9fafb',
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {fmtDT(p.paidAt)}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#7b2e12',
                        background: '#ffdbd0',
                        padding: '2px 7px',
                        borderRadius: 99,
                        marginLeft: 6,
                      }}
                    >
                      BAŞARILI
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ cfg, onChange, onToast, isMobile, onLogout, user }) {
  const [name, setName] = useState(cfg.name),
    [sym, setSym] = useState(cfg.sym),
    [days, setDays] = useState(cfg.days);
  const save = () => {
    onChange({ name: name.trim() || 'Kullanıcı', sym, days });
    onToast('Ayarlar kaydedildi.');
  };
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 14,
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 18,
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: C.subtle,
          }}
        >
          Profil
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: C.grad,
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(user?.user_metadata?.full_name || user?.email || 'U')
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 11, color: C.subtle }}>{user?.email}</div>
          </div>
        </div>
        <TInput
          label="Görünen Ad"
          value={name}
          onChange={setName}
          placeholder="Adınız"
        />
        <Btn onClick={save} full>
          💾 Kaydet
        </Btn>
      </div>
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 18,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: C.subtle,
            marginBottom: 12,
          }}
        >
          Para Birimi
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          {[
            ['₺', 'Türk Lirası'],
            ['$', 'Dolar'],
            ['€', 'Euro'],
            ['£', 'Sterlin'],
          ].map(([s, l]) => (
            <button
              key={s}
              onClick={() => setSym(s)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 12,
                borderRadius: 10,
                background: sym === s ? '#eff6ff' : '#f9fafb',
                border: `1.5px solid ${sym === s ? C.primary : 'transparent'}`,
                cursor: 'pointer',
                color: sym === s ? C.primary : C.muted,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 900 }}>{s}</span>
              <span style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                {l}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 18,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: C.subtle,
            marginBottom: 10,
          }}
        >
          Bildirim
        </div>
        <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}>
          Kaç gün önce uyarsın?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 5, 7].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                background: days === d ? C.primary : '#f3f4f6',
                color: days === d ? '#fff' : C.muted,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {d}g
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 18,
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: C.subtle,
          }}
        >
          Hesap
        </div>
        {[
          ['Backend', 'Supabase'],
          ['Auth', 'Email / Google'],
        ].map(([l, v]) => (
          <div
            key={l}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: C.muted,
            }}
          >
            <span>{l}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: C.border }} />
        <Btn variant="danger" onClick={onLogout} full>
          🚪 Çıkış Yap
        </Btn>
      </div>
    </div>
  );
}

function PanelWrapper({ isMobile, onClose, children, footer }) {
  const s = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '90dvh',
        background: C.white,
        zIndex: 95,
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -8px 32px rgba(0,0,0,.15)',
      }
    : {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 340,
        height: '100%',
        background: C.white,
        zIndex: 80,
        borderRadius: '0 16px 16px 0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,.08)',
      };
  return (
    <>
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            zIndex: 90,
          }}
        />
      )}
      <div style={s}>
        {isMobile && (
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 99,
              background: '#e5e7eb',
              margin: '12px auto 4px',
            }}
          />
        )}
        {children}
        {footer && (
          <div
            style={{
              padding: '12px 16px 16px',
              borderTop: `1px solid ${C.border}`,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

function DetailPanel({
  debt,
  payments,
  sym,
  onClose,
  onPay,
  onEdit,
  onDelete,
  isMobile,
}) {
  const p = pct(debt),
    st = dSt(debt),
    pays = payments.filter((x) => x.debtId === debt.id);
  return (
    <PanelWrapper
      isMobile={isMobile}
      onClose={onClose}
      footer={
        debt.status !== 'paid' && (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}
          >
            <Btn variant="outline" onClick={() => onEdit(debt.id)}>
              ✏️ Düzenle
            </Btn>
            <Btn onClick={() => onPay(debt.id)}>💸 Ödeme Yap</Btn>
          </div>
        )
      }
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <Badge cat={debt.category} />
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: C.text,
              marginTop: 6,
            }}
          >
            {debt.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#eff6ff,#e0e7ff)',
            borderRadius: 12,
            padding: 16,
            borderLeft: `4px solid ${C.primary}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              color: C.primary,
              opacity: 0.7,
              marginBottom: 3,
            }}
          >
            Kalan Borç
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 26,
              color: C.primary,
              letterSpacing: '-.02em',
            }}
          >
            {fmt(debt.remainingAmount, sym)}
          </div>
          {debt.status === 'paid' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                fontSize: 11,
                fontWeight: 700,
                color: '#16a34a',
                background: '#dcfce7',
                padding: '3px 10px',
                borderRadius: 99,
              }}
            >
              ✓ Ödendi
            </span>
          )}
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: C.subtle,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            <span>İlerleme</span>
            <span style={{ fontWeight: 800, color: C.primary }}>{p}%</span>
          </div>
          <Bar value={p} h={8} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: C.subtle,
              marginTop: 4,
            }}
          >
            <span>
              {fmt(debt.totalAmount - debt.remainingAmount, sym)} ödendi
            </span>
            <span>{fmt(debt.totalAmount, sym)}</span>
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          {[
            ['Toplam', fmt(debt.totalAmount, sym)],
            debt.category === 'loan' && debt.totalMonths
              ? [
                  'Vade',
                  (debt.paidMonths || 0) + '/' + debt.totalMonths + ' ay',
                ]
              : ['Aylık', fmt(debt.plannedPaymentAmount, sym)],
            debt.loanType === 'kmh' && debt.monthlyRate
              ? ['Aylık Faiz', '%' + (debt.monthlyRate * 100).toFixed(2)]
              : null,
          ]
            .filter(Boolean)
            .map(([l, v]) => (
              <div
                key={l}
                style={{ background: '#f9fafb', borderRadius: 10, padding: 12 }}
              >
                <div style={{ fontSize: 11, color: C.subtle, marginBottom: 2 }}>
                  {l}
                </div>
                <div
                  style={{ fontWeight: 800, fontSize: 14, color: C.primary }}
                >
                  {v}
                </div>
              </div>
            ))}
        </div>
        <div
          style={{
            background: C.primary2,
            borderRadius: 12,
            padding: 14,
            color: '#fff',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
            Borç Görünümü
          </div>
          <div
            style={{
              height: 7,
              background: 'rgba(255,255,255,.12)',
              borderRadius: 99,
              overflow: 'hidden',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${100 - p}%`,
                background: 'rgba(199,210,254,.8)',
                borderRadius: 99,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,.08)',
              padding: '8px 10px',
              borderRadius: 8,
            }}
          >
            <span>📅</span>
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  fontWeight: 700,
                }}
              >
                Son Ödeme
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, marginTop: 1 }}>
                {fmtD(debt.dueDate)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.subtle, marginBottom: 3 }}>
            Durum
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dCol(st) }}>
            {dLbl(debt)}
          </div>
        </div>
        {debt.note && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: '#f9fafb',
              padding: 12,
              borderRadius: 10,
            }}
          >
            <span>📝</span>
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {debt.note}
            </p>
          </div>
        )}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12, color: C.text }}>
              Ödeme Geçmişi
            </div>
            <span style={{ fontSize: 11, color: C.subtle }}>
              {pays.length} ödeme
            </span>
          </div>
          {pays.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle }}>
              Henüz ödeme yapılmamış.
            </p>
          ) : (
            pays.map((pay) => (
              <div
                key={pay.id}
                style={{
                  background: '#f9fafb',
                  borderRadius: 10,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div style={{ flex: 1, fontSize: 11, color: C.muted }}>
                  {fmtDT(pay.paidAt)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{ fontWeight: 800, fontSize: 13, color: C.primary }}
                  >
                    {fmt(pay.amount, sym)}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#7b2e12',
                      background: '#ffdbd0',
                      padding: '1px 7px',
                      borderRadius: 99,
                    }}
                  >
                    BAŞARILI
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => onDelete(debt.id)}
          style={{
            width: '100%',
            padding: 9,
            borderRadius: 10,
            background: 'transparent',
            color: '#dc2626',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'transparent')
          }
        >
          🗑 Bu borcu sil
        </button>
      </div>
    </PanelWrapper>
  );
}

function FormPanel({ init, sym, onClose, onSave, isMobile }) {
  const isEdit = Boolean(init?.id);
  const [f, setF] = useState(
    init
      ? {
          category: init.category,
          name: init.name,
          totalAmount: String(init.totalAmount),
          plannedPaymentAmount: String(init.plannedPaymentAmount),
          minPayment: String((init.totalAmount * 0.4).toFixed(2)),
          dueDate: init.dueDate,
          note: init.note || '',
          totalMonths: init.totalMonths ? String(init.totalMonths) : '',
          loanType: init.loanType || 'kredi',
          monthlyRate: init.monthlyRate ? String(init.monthlyRate) : '',
        }
      : {
          category: 'credit_card',
          name: '',
          totalAmount: '',
          plannedPaymentAmount: '',
          minPayment: '',
          dueDate: '',
          note: '',
          totalMonths: '',
          loanType: 'kredi',
          monthlyRate: '',
        },
  );
  const [errs, setErrs] = useState({}),
    [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setF((p) => {
      const next = { ...p, [k]: v };
      // Toplam borç değişince asgari ödemeyi otomatik %40 hesapla
      if (k === 'totalAmount') {
        const t = parseFloat(v);
        if (t > 0) next.minPayment = (t * 0.4).toFixed(2);
        else next.minPayment = '';
      }
      return next;
    });
    setErrs((p) => ({ ...p, [k]: '' }));
  };

  const submit = async () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Borç adı zorunludur.';
    const total = parseFloat(f.totalAmount),
      monthly = parseFloat(f.plannedPaymentAmount);
    if (!total || total <= 0) e.totalAmount = 'Geçerli tutar girin.';
    if (!monthly || monthly <= 0)
      e.plannedPaymentAmount = 'Geçerli tutar girin.';
    else if (monthly > total)
      e.plannedPaymentAmount = 'Toplam borçtan büyük olamaz.';
    if (f.category !== 'personal_debt' && !f.dueDate)
      e.dueDate = 'Tarih zorunludur.';
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          category: f.category,
          name: f.name.trim(),
          totalAmount: total,
          plannedPaymentAmount: monthly,
          dueDate: f.dueDate || null,
          note: f.note.trim(),
          totalMonths:
            f.category === 'loan' && f.totalMonths
              ? parseInt(f.totalMonths)
              : null,
          loanType: f.category === 'loan' ? f.loanType : 'kredi',
          monthlyRate:
            f.category === 'loan' && f.loanType === 'kmh' && f.monthlyRate
              ? parseFloat(f.monthlyRate) / 100
              : null,
        },
        init?.id,
      );
      onClose();
    } catch (err) {
      setErrs({ name: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Asgari ödeme bilgi kartı
  const minPay = parseFloat(f.minPayment) || 0;
  const monthly = parseFloat(f.plannedPaymentAmount) || 0;

  return (
    <PanelWrapper
      isMobile={isMobile}
      onClose={onClose}
      footer={
        <Btn onClick={submit} full size="lg" disabled={saving}>
          {saving
            ? '⏳ Kaydediliyor...'
            : isEdit
              ? '✓ Güncelle'
              : '✓ Borcu Kaydet'}
        </Btn>
      }
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
            {isEdit ? 'Borcu Düzenle' : 'Yeni Borç'}
          </div>
          <div style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>
            {isEdit ? 'Bilgileri güncelleyin.' : 'Yeni borç oluşturun.'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div>
          <Label>Kategori</Label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 8,
            }}
          >
            {Object.entries(CAT).map(([k, c]) => {
              const a = f.category === k;
              return (
                <button
                  key={k}
                  onClick={() => set('category', k)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 6px',
                    borderRadius: 10,
                    background: a ? '#eff6ff' : '#f9fafb',
                    border: `1.5px solid ${a ? C.primary : 'transparent'}`,
                    cursor: 'pointer',
                    color: a ? C.primary : C.muted,
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <TInput
          label="Borç Adı"
          value={f.name}
          onChange={(v) => set('name', v)}
          placeholder="ör. Akbank Axess"
          error={errs.name}
        />

        {/* Kredi türü — sadece loan kategorisinde */}
        {f.category === 'loan' && (
          <div>
            <Label>Kredi Türü</Label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                ['kredi', '🏦 Kredi'],
                ['kmh', '⚡ KMH'],
              ].map(([val, lbl]) => {
                const a = f.loanType === val;
                return (
                  <button
                    key={val}
                    onClick={() => set('loanType', val)}
                    style={{
                      padding: '11px 8px',
                      borderRadius: 10,
                      background: a ? '#eff6ff' : '#f9fafb',
                      border: `1.5px solid ${a ? C.primary : 'transparent'}`,
                      cursor: 'pointer',
                      color: a ? C.primary : C.muted,
                      fontFamily: 'inherit',
                      fontWeight: a ? 700 : 500,
                      fontSize: 13,
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <TInput
          label="Toplam Borç"
          value={f.totalAmount}
          onChange={(v) => set('totalAmount', v)}
          placeholder="0.00"
          type="number"
          prefix={sym}
          error={errs.totalAmount}
        />

        {/* KMH aylık faiz oranı */}
        {f.category === 'loan' && f.loanType === 'kmh' && (
          <div>
            <Label>Aylık Faiz Oranı (%)</Label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#f9fafb',
                border: '1.5px solid transparent',
                borderRadius: 9,
                padding: '9px 12px',
              }}
              onFocusCapture={(e) =>
                (e.currentTarget.style.borderColor = C.primary)
              }
              onBlurCapture={(e) =>
                (e.currentTarget.style.borderColor = 'transparent')
              }
            >
              <input
                type="number"
                value={f.monthlyRate}
                onChange={(e) => set('monthlyRate', e.target.value)}
                placeholder="ör. 4.25"
                step="0.01"
                min="0"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  color: C.text,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              <span style={{ fontWeight: 700, color: C.subtle, fontSize: 13 }}>
                %
              </span>
            </div>
            {f.monthlyRate && (
              <div
                style={{
                  marginTop: 6,
                  padding: '7px 11px',
                  borderRadius: 8,
                  background: '#eff6ff',
                  fontSize: 12,
                  color: C.primary,
                  fontWeight: 600,
                }}
              >
                İşleme alınacak: %{f.monthlyRate} →{' '}
                {(parseFloat(f.monthlyRate) / 100).toFixed(4)} · Örnek: 10.000₺
                borçta aylık{' '}
                {fmt((10000 * parseFloat(f.monthlyRate)) / 100, sym)} faiz
              </div>
            )}
          </div>
        )}

        {/* Asgari Ödeme — sadece kredi kartı */}
        {f.category === 'credit_card' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}
            >
              <Label>Asgari Ödeme</Label>
              {parseFloat(f.totalAmount) > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    background: '#fef9c3',
                    color: '#854d0e',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontWeight: 600,
                  }}
                >
                  %40 = {sym}
                  {(parseFloat(f.totalAmount) * 0.4).toFixed(2)}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#f9fafb',
                border: '1.5px solid transparent',
                borderRadius: 9,
                padding: '9px 12px',
              }}
              onFocusCapture={(e) =>
                (e.currentTarget.style.borderColor = C.primary)
              }
              onBlurCapture={(e) =>
                (e.currentTarget.style.borderColor = 'transparent')
              }
            >
              <span style={{ fontWeight: 700, color: C.subtle, fontSize: 14 }}>
                {sym}
              </span>
              <input
                type="number"
                value={f.minPayment}
                onChange={(e) => set('minPayment', e.target.value)}
                placeholder="Otomatik hesaplanır"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  color: C.text,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: C.subtle, marginTop: 3 }}>
              Toplam borcun %40'ı olarak hesaplandı. İstersen değiştirebilirsin.
            </p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              f.category === 'credit_card' ? '1fr 1fr' : '1fr',
            gap: 10,
          }}
        >
          <TInput
            label="Aylık Ödeme"
            value={f.plannedPaymentAmount}
            onChange={(v) => set('plannedPaymentAmount', v)}
            placeholder="0.00"
            type="number"
            prefix={sym}
            error={errs.plannedPaymentAmount}
          />
          {f.category === 'loan' && f.loanType !== 'kmh' && (
            <TInput
              label="Vade (Ay)"
              value={f.totalMonths}
              onChange={(v) => set('totalMonths', v)}
              placeholder="ör. 36"
              type="number"
            />
          )}
          {f.category === 'credit_card' && (
            <div>
              <Label>Ödeme Durumu</Label>
              {minPay > 0 && monthly > 0 ? (
                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: monthly >= minPay ? '#f0fdf4' : '#fef2f2',
                    border: `1.5px solid ${monthly >= minPay ? '#86efac' : '#fca5a5'}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: monthly >= minPay ? '#16a34a' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {monthly >= minPay
                    ? '✓ Asgari ödeme karşılanıyor'
                    : '⚠️ Asgari ödemenin altında'}
                </div>
              ) : (
                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: '#f9fafb',
                    fontSize: 12,
                    color: C.subtle,
                  }}
                >
                  Tutar girince hesaplanır
                </div>
              )}
            </div>
          )}
        </div>
        {f.category !== 'personal_debt' && (
          <div>
            <Label>
              {f.category === 'loan' ? 'Kredi Vadesi' : 'Son Ödeme Tarihi'}
            </Label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: errs.dueDate ? '#fef2f2' : '#f9fafb',
                border: `1.5px solid ${errs.dueDate ? '#dc2626' : 'transparent'}`,
                borderRadius: 9,
                padding: '9px 12px',
              }}
            >
              <input
                type="date"
                value={f.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: C.text,
                  cursor: 'pointer',
                }}
              />
            </div>
            {errs.dueDate && (
              <p
                style={{
                  fontSize: 11,
                  color: '#dc2626',
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {errs.dueDate}
              </p>
            )}
          </div>
        )}
        <div>
          <Label>Not</Label>
          <textarea
            value={f.note}
            onChange={(e) => set('note', e.target.value)}
            rows={2}
            placeholder="Ek notlar..."
            style={{
              width: '100%',
              background: '#f9fafb',
              border: '1.5px solid transparent',
              borderRadius: 9,
              padding: '9px 12px',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'none',
              color: C.text,
            }}
          />
        </div>
        <div
          style={{
            background: '#fff7f3',
            border: '1px solid #fed7aa',
            borderRadius: 10,
            padding: 12,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 20 }}>✨</div>
          <div
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: '#c2410c',
              marginTop: 4,
            }}
          >
            "Başarının sırrı başlamaktır."
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}

function PayModal({ debt, sym, onClose, onConfirm, isMobile }) {
  const [amount, setAmount] = useState(String(debt.plannedPaymentAmount)),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const parsed = parseFloat(amount) || 0,
    valid = parsed > 0 && parsed <= debt.remainingAmount;
  const chips = [
    ...new Set([
      debt.plannedPaymentAmount,
      +(debt.remainingAmount / 2).toFixed(2),
      debt.remainingAmount,
    ]),
  ]
    .filter((v) => v > 0)
    .slice(0, 3);
  const pay = async () => {
    if (!parsed || parsed <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }
    if (parsed > debt.remainingAmount) {
      setError('Kalan borçtan büyük olamaz.');
      return;
    }
    setSaving(true);
    const result = await onConfirm(debt.id, parsed);
    setSaving(false);
    if (result?.success === false) {
      setError(result.error);
      return;
    }
    onClose();
  };
  const overlayS = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'flex-end',
      }
    : {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        zIndex: 100,
        borderRadius: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
  const boxS = isMobile
    ? {
        background: C.white,
        borderRadius: '20px 20px 0 0',
        padding: 24,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        zIndex: 95,
      }
    : {
        background: C.white,
        borderRadius: 20,
        padding: 24,
        width: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      };
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayS}
    >
      <div style={boxS}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Badge cat={debt.category} />
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: C.text,
                margin: '6px 0 3px',
              }}
            >
              {debt.name}
            </div>
            <div style={{ fontSize: 12, color: C.subtle }}>
              Kalan:{' '}
              <strong style={{ color: C.primary }}>
                {fmt(debt.remainingAmount, sym)}
              </strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              color: C.subtle,
              marginBottom: 8,
            }}
          >
            Ödenecek Tutar
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: 6,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 22, color: C.subtle }}>
              {sym}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              autoFocus
              placeholder="0.00"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 28,
                fontWeight: 900,
                color: C.primary,
                minWidth: 0,
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}
          >
            {chips.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setAmount(String(v));
                  setError('');
                }}
                style={{
                  padding: '4px 11px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: parseFloat(amount) === v ? '#e0e7ff' : '#f3f4f6',
                  color: parseFloat(amount) === v ? C.primary : C.muted,
                  fontFamily: 'inherit',
                }}
              >
                {v === debt.plannedPaymentAmount ? 'Planlanan · ' : ''}
                {v === debt.remainingAmount ? 'Tümü · ' : ''}
                {fmt(v, sym)}
              </button>
            ))}
          </div>
          {error && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#dc2626',
                background: '#fef2f2',
                padding: '8px 12px',
                borderRadius: 9,
                marginTop: 10,
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>
        {valid && (
          <div
            style={{
              background: '#f9fafb',
              borderRadius: 10,
              padding: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[
              ['Kalan borç', fmt(debt.remainingAmount, sym), C.muted],
              ['Bu ödeme', '− ' + fmt(parsed, sym), '#dc2626'],
              [
                'Ödeme sonrası',
                fmt(debt.remainingAmount - parsed, sym),
                C.text,
              ],
            ].map(([l, v, col], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  paddingTop: i === 2 ? 8 : 0,
                  borderTop: i === 2 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ fontWeight: i === 2 ? 700 : 400, color: col }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        )}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}
        >
          <Btn variant="outline" onClick={onClose}>
            İptal
          </Btn>
          <Btn onClick={pay} disabled={!valid || saving}>
            {saving ? '⏳ İşleniyor...' : '💸 Öde'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const w = useWidth(),
    isMobile = w < 768,
    showSidebar = w >= 1024;
  const {
    user,
    authLoading,
    authError,
    clearError,
    register,
    login,
    signInWithGoogle,
    logout,
  } = useAuth();
  const {
    debts,
    payments,
    loading: dbLoading,
    addDebt,
    updateDebt,
    deleteDebt,
    makePayment,
  } = useSupabase(user?.id);

  const [cfg, setCfg] = useState({ name: '', sym: '₺', days: 3 });
  useEffect(() => {
    if (user)
      setCfg((c) => ({
        ...c,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      }));
  }, [user]);

  const [page, setPage] = useState('dashboard'),
    [panel, setPanel] = useState(null),
    [activeId, setActiveId] = useState(null);
  const [editDebt, setEditDebt] = useState(null),
    [toasts, setToasts] = useState([]),
    [debtsCat, setDebtsCat] = useState('all'),
    [menuOpen, setMenuOpen] = useState(false);

  const sum = useMemo(() => {
    const a = debts.filter((d) => d.status === 'active');
    return {
      total: a.reduce((s, d) => s + d.remainingAmount, 0),
      monthly: a.reduce((s, d) => s + d.plannedPaymentAmount, 0),
      cc: a
        .filter((d) => d.category === 'credit_card')
        .reduce((s, d) => s + d.remainingAmount, 0),
      loan: a
        .filter((d) => d.category === 'loan')
        .reduce((s, d) => s + d.remainingAmount, 0),
      personal: a
        .filter((d) => d.category === 'personal_debt')
        .reduce((s, d) => s + d.remainingAmount, 0),
      urgent: a.filter((d) => {
        const s = dSt(d);
        return s === 'overdue' || s === 'urgent';
      }).length,
      activeCount: a.length,
      paidCount: debts.filter((d) => d.status === 'paid').length,
    };
  }, [debts]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const close = () => {
    setPanel(null);
    setActiveId(null);
    setEditDebt(null);
  };
  const openDetail = (id) => {
    setActiveId(id);
    setPanel('detail');
  };
  const openPay = (id) => {
    setActiveId(id);
    setPanel('pay');
  };
  const openEdit = (id) => {
    setEditDebt(debts.find((d) => d.id === id) || null);
    setPanel('form');
  };

  const handleSave = async (data, id) => {
    if (id) {
      await updateDebt(id, data);
      toast('Borç güncellendi.');
    } else {
      await addDebt(data);
      toast('Borç başarıyla eklendi.');
    }
  };
  const handleDelete = async (id) => {
    await deleteDebt(id);
    close();
    toast('Borç silindi.', 'info');
  };
  const handlePay = async (debtId, amount) => {
    const result = await makePayment(debtId, amount);
    if (result.success) {
      const d = debts.find((x) => x.id === debtId);
      toast(
        result.newStatus === 'paid'
          ? `"${d?.name}" tamamen ödendi! 🎉`
          : `${fmt(amount, cfg.sym)} ödeme yapıldı.`,
      );
    }
    return result;
  };
  const navTo = (p) => {
    setPage(p);
    close();
    setMenuOpen(false);
  };
  const filterGo = (cat) => {
    setDebtsCat(cat);
    setPage('debts');
  };
  const activeDebt = debts.find((d) => d.id === activeId);

  if (user === undefined)
    return <LoadingScreen message="Kimlik doğrulanıyor..." />;
  if (!user)
    return (
      <AuthScreen
        onGoogle={signInWithGoogle}
        onLogin={login}
        onRegister={register}
        loading={authLoading}
        error={authError}
        onClearError={clearError}
      />
    );
  if (dbLoading) return <LoadingScreen message="Veriler yükleniyor..." />;

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        background: C.bg,
        fontFamily: "'Inter',system-ui,sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showSidebar && <Sidebar page={page} onNav={navTo} user={user} />}
      {menuOpen && (
        <MobileDrawer
          page={page}
          onNav={navTo}
          user={user}
          onClose={() => setMenuOpen(false)}
          onLogout={logout}
        />
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Topbar
          page={page}
          isMobile={!showSidebar}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
          onAdd={() => {
            setEditDebt(null);
            setPanel('form');
          }}
        />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? 12 : 16,
            paddingBottom: !showSidebar ? 80 : 16,
            minHeight: 0,
          }}
        >
          {page === 'dashboard' && (
            <Dashboard
              debts={debts}
              sum={sum}
              sym={cfg.sym}
              onPay={openPay}
              onDetail={openDetail}
              onFilter={filterGo}
              isMobile={isMobile}
            />
          )}
          {page === 'debts' && (
            <DebtsPage
              debts={debts}
              sym={cfg.sym}
              onPay={openPay}
              onDetail={openDetail}
              initCat={debtsCat}
              isMobile={isMobile}
            />
          )}
          {page === 'history' && (
            <HistoryPage
              payments={payments}
              sym={cfg.sym}
              isMobile={isMobile}
            />
          )}
          {page === 'settings' && (
            <SettingsPage
              cfg={cfg}
              onChange={(c) => setCfg(c)}
              onToast={toast}
              isMobile={isMobile}
              onLogout={logout}
              user={user}
            />
          )}
        </div>
      </div>
      {!showSidebar && <BottomNav page={page} onNav={navTo} />}
      {panel && showSidebar && (
        <div
          onClick={close}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,.35)',
            zIndex: 70,
          }}
        />
      )}
      {panel === 'detail' && activeDebt && (
        <DetailPanel
          debt={activeDebt}
          payments={payments}
          sym={cfg.sym}
          onClose={close}
          onPay={openPay}
          onEdit={openEdit}
          onDelete={handleDelete}
          isMobile={!showSidebar}
        />
      )}
      {panel === 'form' && (
        <FormPanel
          init={editDebt}
          sym={cfg.sym}
          onClose={close}
          onSave={handleSave}
          isMobile={!showSidebar}
        />
      )}
      {panel === 'pay' && activeDebt && (
        <PayModal
          debt={activeDebt}
          sym={cfg.sym}
          onClose={close}
          onConfirm={handlePay}
          isMobile={!showSidebar}
        />
      )}
      <div
        style={{
          position: 'fixed',
          bottom: !showSidebar ? 80 : 20,
          right: 16,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,.15)',
              background:
                t.type === 'success'
                  ? C.primary
                  : t.type === 'error'
                    ? '#dc2626'
                    : '#f3f4f6',
              color: t.type === 'info' ? C.text : '#fff',
            }}
          >
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}{' '}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
