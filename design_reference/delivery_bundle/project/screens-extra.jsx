// screens-extra.jsx — simpler profile + login

function ProfileScreen({ user, onBack, onLogout }) {
  const u = user || {
    firstName: 'Matías', lastName: 'Álvarez',
    email: 'matias.alvarez@mail.com',
  };

  const MenuRow = ({ label, last }) => (
    <button style={{
      width: '100%', display: 'flex', alignItems: 'center',
      padding: '18px 0', background: 'none', border: 'none',
      borderBottom: last ? 'none' : '1px solid var(--hairline)',
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    }}>
      <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>{label}</span>
      {Icon.chevRight('var(--ink-3)', 14)}
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ paddingTop: 54, paddingBottom: 8, paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.close('var(--ink)', 20)}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        <div style={{ padding: '16px 24px 32px' }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 36, lineHeight: 1.05,
            letterSpacing: -0.6, color: 'var(--ink)', fontWeight: 400,
          }}>{u.firstName} {u.lastName}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>{u.email}</div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <MenuRow label="Mis pedidos" />
          <MenuRow label="Direcciones" />
          <MenuRow label="Métodos de pago" />
          <MenuRow label="Ayuda" last />
        </div>

        <div style={{ padding: '40px 24px 0' }}>
          <button onClick={onLogout} style={{
            background: 'none', border: 'none', padding: 0,
            color: 'var(--ink-3)', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

// Google "G" logo
function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z"/>
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-10l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

// LOGIN — minimal, Google-first
function LoginScreen({ onBack, onLogin }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ paddingTop: 54, paddingBottom: 8, paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.close('var(--ink)', 20)}</button>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '24px 28px 40px',
      }}>
        <div style={{ marginTop: 40 }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 44, lineHeight: 1.0,
            letterSpacing: -0.8, color: 'var(--ink)', fontWeight: 400,
          }}>Ingresá</div>
          <div style={{
            fontSize: 15, color: 'var(--ink-2)', marginTop: 12,
            lineHeight: 1.4, maxWidth: 280,
          }}>
            Para guardar tus direcciones y seguir tus pedidos.
          </div>
        </div>

        <div>
          <button onClick={onLogin} style={{
            width: '100%', height: 54, borderRadius: 12,
            background: '#fff', border: '1px solid var(--hairline-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)',
            cursor: 'pointer',
          }}>
            <GoogleMark size={20} />
            <span>Continuar con Google</span>
          </button>

          <div style={{
            textAlign: 'center', fontSize: 12, color: 'var(--ink-3)',
            marginTop: 20, lineHeight: 1.5,
          }}>
            Al continuar aceptás los <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Términos</span> y
            la <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Privacidad</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, LoginScreen });
