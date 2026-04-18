// screens.jsx — all screens for the delivery prototype
// Depends on: data.jsx (TENANTS, formatARS), icons.jsx (Icon)

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function ImageTile({ tone, label, style = {}, radius = 12 }) {
  // Striped placeholder per system prompt guidance
  const stripe = `repeating-linear-gradient(135deg, ${tone} 0 10px, color-mix(in oklch, ${tone} 90%, #000) 10px 20px)`;
  return (
    <div style={{
      background: stripe, borderRadius: radius, position: 'relative',
      overflow: 'hidden', ...style,
    }}>
      {label && (
        <div style={{
          position: 'absolute', inset: 'auto 0 6px 8px',
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: 0.5,
          color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase',
        }}>{label}</div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const c = status === 'open' ? 'var(--fresh)' : status === 'busy' ? '#C78A3B' : '#999';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: c, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>
        {status === 'open' ? 'Abierto' : status === 'busy' ? 'Demorado' : 'Cerrado'}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Category Nav — 3 variants controlled by Tweaks
// ─────────────────────────────────────────────────────────────
function CategoryNav({ variant, categories, active, onSelect }) {
  if (variant === 'chips') {
    return (
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '10px 16px 12px', scrollbarWidth: 'none',
      }}>
        {categories.map(c => {
          const isActive = c === active;
          return (
            <button key={c} onClick={() => onSelect(c)} style={{
              flexShrink: 0, padding: '8px 14px', height: 36,
              borderRadius: 99,
              background: isActive ? 'var(--ink)' : '#fff',
              color: isActive ? '#fff' : 'var(--ink)',
              border: isActive ? '1px solid var(--ink)' : '1px solid var(--hairline)',
              fontSize: 14, fontWeight: 500, letterSpacing: -0.1,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>{c}</button>
          );
        })}
      </div>
    );
  }
  if (variant === 'segmented') {
    // condensed segmented control — good for ≤4 cats; scrolls if more
    return (
      <div style={{ padding: '10px 16px 12px' }}>
        <div style={{
          display: 'flex', background: '#EFEBE3', borderRadius: 10, padding: 3,
          overflowX: 'auto', gap: 2,
        }}>
          {categories.map(c => {
            const isActive = c === active;
            return (
              <button key={c} onClick={() => onSelect(c)} style={{
                flex: '1 0 auto', padding: '7px 12px', minWidth: 72,
                borderRadius: 8, border: 'none',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-2)',
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                fontFamily: 'inherit', cursor: 'pointer',
                boxShadow: isActive ? '0 1px 0 rgba(0,0,0,0.04)' : 'none',
              }}>{c}</button>
            );
          })}
        </div>
      </div>
    );
  }
  // default: tabs (underline)
  return (
    <div style={{
      display: 'flex', gap: 20, overflowX: 'auto',
      padding: '4px 16px 0', borderBottom: '1px solid var(--hairline)',
      scrollbarWidth: 'none',
    }}>
      {categories.map(c => {
        const isActive = c === active;
        return (
          <button key={c} onClick={() => onSelect(c)} style={{
            flexShrink: 0, padding: '12px 0 10px', background: 'none',
            border: 'none', borderBottom: isActive ? '2px solid var(--ink)' : '2px solid transparent',
            color: isActive ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 14, fontWeight: isActive ? 600 : 500,
            fontFamily: 'inherit', cursor: 'pointer', marginBottom: -1,
          }}>{c}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME / MENU
// ─────────────────────────────────────────────────────────────
function HomeScreen({ tenant, cart, onOpenProduct, onOpenCart, navVariant, onBack, auth, onAuthClick }) {
  const [active, setActive] = useState(tenant.categories[0]);
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    let list = tenant.products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    } else {
      list = list.filter(p => p.cat === active);
    }
    return list;
  }, [search, active, tenant]);

  const cartCount = Object.values(cart).reduce((s, it) => s + it.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const isClosed = tenant.status === 'closed';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header — compact, scrolls with content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: cartCount > 0 ? 100 : 34 }}>
        {/* Hero image */}
        <div style={{ position: 'relative', padding: '0 0 0' }}>
          <ImageTile tone={tenant.hero.tone} label={tenant.hero.label}
            style={{ height: 160, borderRadius: 0 }} />
          {auth && auth.loggedIn ? (
            <button onClick={onAuthClick} style={{
              position: 'absolute', top: 56, right: 16,
              height: 40, paddingLeft: 4, paddingRight: 14,
              borderRadius: 99, border: 'none',
              background: 'rgba(255,255,255,0.95)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 99,
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, letterSpacing: 0.2,
              }}>{(auth.user?.initials) || 'M'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>
                {(auth.user?.firstName) || 'Cuenta'}
              </span>
            </button>
          ) : (
            <button onClick={onAuthClick} style={{
              position: 'absolute', top: 56, right: 16,
              height: 40, padding: '0 16px',
              borderRadius: 99, border: 'none',
              background: 'var(--ink)', color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
            }}>Ingresar</button>
          )}
        </div>

        {/* Tenant info block */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 28, lineHeight: 1.05,
            letterSpacing: -0.5, color: 'var(--ink)', fontWeight: 400,
          }}>{tenant.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{tenant.tagline}</span>
            <span style={{ color: 'var(--hairline-2)' }}>·</span>
            <StatusDot status={tenant.status} />
          </div>
          <div style={{
            display: 'flex', gap: 14, marginTop: 12,
            fontSize: 12, color: 'var(--ink-2)', alignItems: 'center',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {Icon.clock('var(--ink-3)', 13)} {tenant.delivery.eta}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {Icon.moto('var(--ink-3)', 14)} Envío {formatARS(tenant.delivery.fee)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Mín. {formatARS(tenant.delivery.min)}
            </span>
          </div>
        </div>

        {/* Closed banner */}
        {isClosed && (
          <div style={{
            margin: '12px 16px', padding: '12px 14px', borderRadius: 10,
            background: '#F6EEE4', border: '1px solid #EADFCB',
            fontSize: 13, color: '#6D5838',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>El local está cerrado</div>
            <div>{tenant.hours}. Podés armar tu pedido y programarlo.</div>
          </div>
        )}

        {/* Sticky category nav */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 4, background: 'var(--bg)',
          borderBottom: navVariant === 'tabs' ? 'none' : '1px solid var(--hairline)',
        }}>
          <CategoryNav variant={navVariant} categories={tenant.categories}
            active={active} onSelect={setActive} />
        </div>

        {/* Product list */}
        <div>
          {visible.map(p => {
            const qty = cart[p.id]?.qty || 0;
            return (
              <button key={p.id}
                onClick={() => !p.soldOut && onOpenProduct(p)}
                disabled={p.soldOut}
                style={{
                  width: '100%', display: 'flex', gap: 12,
                  padding: '14px 16px', background: 'none',
                  border: 'none', borderBottom: '1px solid var(--hairline)',
                  cursor: p.soldOut ? 'not-allowed' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  opacity: p.soldOut ? 0.55 : 1,
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                    letterSpacing: -0.1, marginBottom: 3,
                    textDecoration: p.soldOut ? 'line-through' : 'none',
                  }}>{p.name}</div>
                  <div style={{
                    fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', marginBottom: 8, textWrap: 'pretty',
                  }}>{p.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      {formatARS(p.price)}
                    </span>
                    {p.soldOut && (
                      <span style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 4,
                        background: '#EEE8DC', color: '#8A7B5E', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.3,
                      }}>Sin stock</span>
                    )}
                  </div>
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ImageTile tone={p.tone} style={{ width: 88, height: 88 }} />
                  {!p.soldOut && !isClosed && (
                    <div style={{
                      position: 'absolute', right: -6, bottom: -6,
                      width: 32, height: 32, borderRadius: 99,
                      background: '#fff', border: '1px solid var(--hairline-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {qty > 0 ? (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{qty}</span>
                      ) : (
                        Icon.plus('var(--ink)', 16)
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky cart pill */}
      {cartCount > 0 && (
        <div style={{
          position: 'absolute', left: 12, right: 12, bottom: 42, zIndex: 20,
        }}>
          <button onClick={onOpenCart} style={{
            width: '100%', height: 56, borderRadius: 14,
            background: 'var(--accent)', color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px 0 14px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>{cartCount}</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>Ver mi pedido</span>
            </span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{formatARS(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT BOTTOM SHEET
// ─────────────────────────────────────────────────────────────
function ProductSheet({ product, tenant, onClose, onAdd, existing }) {
  const modGroups = product.modifiers ? tenant.modifiers : {};
  const groupKeys = Object.keys(modGroups);

  // initial selections
  const [sel, setSel] = useState(() => {
    const s = {};
    for (const k of groupKeys) {
      const g = modGroups[k];
      s[k] = g.multi ? [] : (g.required ? g.options[0].id : null);
    }
    return existing?.selections || s;
  });
  const [qty, setQty] = useState(existing?.qty || 1);

  const extraCost = useMemo(() => {
    let e = 0;
    for (const k of groupKeys) {
      const g = modGroups[k];
      if (g.multi) {
        for (const id of sel[k] || []) {
          e += g.options.find(o => o.id === id)?.delta || 0;
        }
      } else if (sel[k]) {
        e += g.options.find(o => o.id === sel[k])?.delta || 0;
      }
    }
    return e;
  }, [sel, modGroups]);

  const unitPrice = product.price + extraCost;
  const total = unitPrice * qty;

  const canAdd = groupKeys.every(k => !modGroups[k].required || sel[k]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.38)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg)', borderRadius: '18px 18px 0 0',
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
        animation: 'sheetUp 260ms cubic-bezier(.2,.8,.2,1)',
      }}>
        {/* grabber */}
        <div style={{ padding: '8px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--hairline-2)' }}/>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Hero */}
          <ImageTile tone={product.tone} style={{ height: 180, borderRadius: 0, margin: '10px 0 0' }} />

          <button onClick={onClose} style={{
            position: 'absolute', top: 22, right: 16,
            width: 34, height: 34, borderRadius: 99, border: 'none',
            background: 'rgba(255,255,255,0.92)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{Icon.close('var(--ink)', 16)}</button>

          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{
              fontFamily: 'var(--display)', fontSize: 24, lineHeight: 1.1,
              letterSpacing: -0.4, color: 'var(--ink)', fontWeight: 400,
            }}>{product.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>
              {product.desc}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>{formatARS(product.price)}</div>
          </div>

          {/* Modifier groups */}
          {groupKeys.map(k => {
            const g = modGroups[k];
            return (
              <div key={k} style={{ borderTop: '8px solid #F3EEE4', padding: '14px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{g.title}</div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: 0.5, padding: '3px 7px', borderRadius: 4,
                    background: g.required ? 'var(--ink)' : '#EEE8DC',
                    color: g.required ? '#fff' : '#8A7B5E',
                  }}>{g.required ? 'Obligatorio' : 'Opcional'}</span>
                </div>
                {g.options.map(o => {
                  const selected = g.multi ? sel[k]?.includes(o.id) : sel[k] === o.id;
                  return (
                    <button key={o.id} onClick={() => {
                      setSel(prev => {
                        if (g.multi) {
                          const cur = prev[k] || [];
                          return { ...prev, [k]: cur.includes(o.id) ? cur.filter(x => x !== o.id) : [...cur, o.id] };
                        }
                        return { ...prev, [k]: o.id };
                      });
                    }} style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '12px 0', background: 'none', border: 'none',
                      borderBottom: '1px solid var(--hairline)', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}>
                      <div style={{
                        width: 20, height: 20, flexShrink: 0,
                        borderRadius: g.multi ? 4 : 99,
                        border: `1.6px solid ${selected ? 'var(--accent)' : 'var(--hairline-2)'}`,
                        background: selected ? 'var(--accent)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        {selected && (g.multi
                          ? Icon.check('#fff', 12)
                          : <span style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }}/>)}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{o.label}</span>
                      {o.delta > 0 && (
                        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>+{formatARS(o.delta)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div style={{ height: 110 }} />
        </div>

        {/* Footer: stepper + add CTA */}
        <div style={{
          padding: '12px 16px 34px', borderTop: '1px solid var(--hairline)',
          background: 'var(--bg)', display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            height: 48, borderRadius: 99, border: '1px solid var(--hairline-2)',
            background: '#fff',
          }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{
              width: 44, height: 46, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.minus('var(--ink)', 18)}</button>
            <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>{qty}</span>
            <button onClick={() => setQty(qty + 1)} style={{
              width: 44, height: 46, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.plus('var(--ink)', 18)}</button>
          </div>
          <button disabled={!canAdd}
            onClick={() => onAdd({
              id: product.id, name: product.name, unitPrice, qty,
              selections: sel, tone: product.tone,
            })}
            style={{
              flex: 1, height: 48, borderRadius: 99,
              background: canAdd ? 'var(--accent)' : '#D8CFC0',
              color: '#fff', border: 'none', cursor: canAdd ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px',
            }}>
            <span>{existing ? 'Actualizar' : 'Agregar'}</span>
            <span>{formatARS(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────────────
function CartScreen({ tenant, cart, onChange, onBack, onCheckout }) {
  const items = Object.values(cart);
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const isEmpty = items.length === 0;
  const underMin = !isEmpty && subtotal < tenant.delivery.min;
  const missing = tenant.delivery.min - subtotal;
  const total = subtotal + (isEmpty ? 0 : tenant.delivery.fee);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        paddingTop: 54, paddingBottom: 10, paddingLeft: 8, paddingRight: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: '1px solid var(--hairline)',
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.chevLeft('var(--ink)', 22)}</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>Mi pedido</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{tenant.name}</div>
        </div>
      </div>

      {isEmpty ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 99, background: '#F1EBDF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>{Icon.bag('var(--ink-3)', 28)}</div>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 22, color: 'var(--ink)',
            letterSpacing: -0.3, marginBottom: 6,
          }}>Todavía no agregaste nada</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.4 }}>
            Volvé al menú y elegí lo que se te antoje.
          </div>
          <button onClick={onBack} style={{
            marginTop: 24, height: 44, padding: '0 20px',
            borderRadius: 99, background: 'var(--ink)', color: '#fff',
            border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}>Ver menú</button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Items */}
            <div>
              {items.map(it => (
                <div key={it.id} style={{
                  display: 'flex', gap: 12, padding: '14px 16px',
                  borderBottom: '1px solid var(--hairline)',
                }}>
                  <ImageTile tone={it.tone} style={{ width: 56, height: 56, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      {formatARS(it.unitPrice)} c/u
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', marginTop: 8,
                      height: 30, border: '1px solid var(--hairline-2)',
                      borderRadius: 99, width: 'fit-content', background: '#fff',
                    }}>
                      <button onClick={() => onChange(it.id, it.qty - 1)} style={{
                        width: 32, height: 28, border: 'none', background: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{Icon.minus('var(--ink)', 14)}</button>
                      <span style={{ minWidth: 18, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{it.qty}</span>
                      <button onClick={() => onChange(it.id, it.qty + 1)} style={{
                        width: 32, height: 28, border: 'none', background: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{Icon.plus('var(--ink)', 14)}</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    {formatARS(it.qty * it.unitPrice)}
                  </div>
                </div>
              ))}
            </div>

            {/* Add more link */}
            <button onClick={onBack} style={{
              width: '100%', padding: '14px 16px', background: 'none',
              border: 'none', borderBottom: '1px solid var(--hairline)',
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 10,
              color: 'var(--accent)', fontSize: 14, fontWeight: 500,
            }}>
              {Icon.plus('var(--accent)', 16)} Agregar más
            </button>

            {/* Totals */}
            <div style={{ padding: '16px 16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
                Resumen
              </div>
              <Row label="Subtotal" value={formatARS(subtotal)} />
              <Row label="Envío" value={formatARS(tenant.delivery.fee)} muted />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: 10, marginTop: 6, borderTop: '1px solid var(--hairline)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{formatARS(total)}</span>
              </div>
            </div>

            {underMin && (
              <div style={{
                margin: '0 16px 16px', padding: '12px 14px', borderRadius: 10,
                background: '#F6EEE4', border: '1px solid #EADFCB',
                fontSize: 13, color: '#6D5838',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Te faltan {formatARS(missing)} para el pedido mínimo
                </div>
                <div style={{
                  height: 6, background: '#EADFCB', borderRadius: 99, overflow: 'hidden', marginTop: 8,
                }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, (subtotal / tenant.delivery.min) * 100)}%`,
                    background: 'var(--accent)',
                  }}/>
                </div>
              </div>
            )}

            <div style={{ height: 90 }} />
          </div>

          {/* Sticky CTA */}
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 42, zIndex: 20,
          }}>
            <button disabled={underMin} onClick={onCheckout} style={{
              width: '100%', height: 56, borderRadius: 14,
              background: underMin ? '#D8CFC0' : 'var(--accent)',
              color: '#fff', border: 'none', cursor: underMin ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px',
            }}>
              <span>{underMin ? `Faltan ${formatARS(missing)}` : 'Ir a pagar'}</span>
              <span>{formatARS(total)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 14, color: muted ? 'var(--ink-2)' : 'var(--ink)',
      padding: '4px 0',
    }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────
function CheckoutScreen({ tenant, cart, onBack, onPlace }) {
  const items = Object.values(cart);
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const [form, setForm] = useState({
    mode: 'delivery', // 'delivery' | 'pickup'
    address: 'Gorriti 5462', apt: '3° B', notes: '',
    phone: '', name: 'Matías', payment: 'mp',
  });
  const isPickup = form.mode === 'pickup';
  const deliveryFee = isPickup ? 0 : tenant.delivery.fee;
  const total = subtotal + deliveryFee;

  // Auto-correct payment method if switching to pickup
  useEffect(() => {
    if (isPickup && form.payment === 'cash') {
      setForm(f => ({ ...f, payment: 'pickup-cash' }));
    } else if (!isPickup && form.payment === 'pickup-cash') {
      setForm(f => ({ ...f, payment: 'cash' }));
    }
  }, [isPickup]);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const addrOk = isPickup || form.address.trim().length > 5;
  const phoneOk = /^\+?[\d\s-]{8,}$/.test(form.phone);

  const submit = () => {
    const e = {};
    if (!addrOk) e.address = 'Completá la dirección';
    if (!phoneOk) e.phone = 'Ingresá un teléfono válido';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setTimeout(() => onPlace(), 700);
  };

  const paymentOptions = isPickup
    ? [
        { id: 'mp', label: 'Mercado Pago', sub: 'Pagás ahora desde la app' },
        { id: 'pickup-cash', label: 'Efectivo al retirar', sub: 'Pagás en el local' },
      ]
    : [
        { id: 'mp', label: 'Mercado Pago', sub: 'Terminada en 4782' },
        { id: 'cash', label: 'Efectivo al recibir', sub: 'Indicá con cuánto abonás' },
      ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        paddingTop: 54, paddingBottom: 10, paddingLeft: 8, paddingRight: 16,
        display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: '1px solid var(--hairline)', background: 'var(--bg)',
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.chevLeft('var(--ink)', 22)}</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>
          Finalizar pedido
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Collapsible order summary */}
        <button onClick={() => setSummaryOpen(!summaryOpen)} style={{
          width: '100%', padding: '14px 16px', background: 'none',
          border: 'none', borderBottom: '1px solid var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 99, background: '#F1EBDF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.bag('var(--ink-2)', 14)}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
              {items.length} ítems · {formatARS(total)}
            </span>
          </span>
          <span style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
            {Icon.chevDown('var(--ink-3)', 16)}
          </span>
        </button>
        {summaryOpen && (
          <div style={{ padding: '4px 16px 16px', borderBottom: '1px solid var(--hairline)' }}>
            {items.map(it => (
              <div key={it.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', fontSize: 13, color: 'var(--ink-2)',
              }}>
                <span>{it.qty}× {it.name}</span>
                <span>{formatARS(it.unitPrice * it.qty)}</span>
              </div>
            ))}
            <Row label="Subtotal" value={formatARS(subtotal)} muted />
            <Row label={isPickup ? 'Retiro' : 'Envío'} value={isPickup ? 'Gratis' : formatARS(deliveryFee)} muted />
            <Row label="Total" value={formatARS(total)} />
          </div>
        )}

        {/* Mode: Delivery vs Pickup */}
        <Section title="¿Cómo lo recibís?">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            marginBottom: 14,
          }}>
            {[
              { id: 'delivery', label: 'Envío a domicilio', sub: tenant.delivery.eta },
              { id: 'pickup', label: 'Retiro en el local', sub: '15–20 min' },
            ].map(o => {
              const sel = form.mode === o.id;
              return (
                <button key={o.id} onClick={() => setForm({ ...form, mode: o.id })} style={{
                  padding: '14px 12px', borderRadius: 12,
                  border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--hairline-2)'}`,
                  background: sel ? 'color-mix(in oklch, var(--accent) 6%, #fff)' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Address — only for delivery */}
        {!isPickup ? (
          <Section title="Entrega">
            <Field label="Dirección" error={errors.address}>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Calle y número"
                style={inputStyle(errors.address)}
              />
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {Icon.pin('var(--ink-3)', 11)} Palermo, CABA
              </div>
            </Field>
            <Field label="Piso / depto (opcional)">
              <input
                value={form.apt}
                onChange={e => setForm({ ...form, apt: e.target.value })}
                placeholder="3° B"
                style={inputStyle()}
              />
            </Field>
            <Field label="Notas para el repartidor">
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Ej: timbre no funciona, llamar al celu"
                style={inputStyle()}
              />
            </Field>
          </Section>
        ) : (
          <Section title="Retirá en">
            <div style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '4px 0 14px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: tenant.hero.tone,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icon.store('var(--ink)', 20)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{tenant.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                  Honduras 5532, Palermo
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Listo en 15–20 min
                </div>
              </div>
            </div>
            <Field label="Notas (opcional)">
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Ej: pasame la cuenta cuando llegue"
                style={inputStyle()}
              />
            </Field>
          </Section>
        )}

        <Section title="Contacto">
          <Field label="Teléfono" error={errors.phone}>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              onBlur={() => setErrors(er => ({ ...er, phone: phoneOk || !form.phone ? undefined : 'Teléfono inválido' }))}
              placeholder="11 5555 5555" inputMode="tel"
              style={inputStyle(errors.phone)}
            />
          </Field>
        </Section>

        <Section title="Método de pago">
          {paymentOptions.map(p => (
            <button key={p.id} onClick={() => setForm({ ...form, payment: p.id })} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 0', background: 'none', border: 'none',
              borderBottom: '1px solid var(--hairline)', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                border: `1.6px solid ${form.payment === p.id ? 'var(--accent)' : 'var(--hairline-2)'}`,
                background: form.payment === p.id ? 'var(--accent)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {form.payment === p.id && <span style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{p.sub}</div>
              </div>
            </button>
          ))}
        </Section>

        <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
          {isPickup
            ? `Retirás en ${tenant.name}`
            : `Llega en ${tenant.delivery.eta} · ${tenant.name}`}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 42, zIndex: 20 }}>
        <button disabled={submitting} onClick={submit} style={{
          width: '100%', height: 56, borderRadius: 14,
          background: submitting ? '#C7BBA6' : 'var(--accent)',
          color: '#fff', border: 'none', cursor: submitting ? 'wait' : 'pointer',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px',
        }}>
          <span>{submitting ? 'Procesando…' : 'Confirmar pedido'}</span>
          <span>{formatARS(total)}</span>
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '18px 16px 4px', borderBottom: '8px solid #F3EEE4' }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10,
      }}>{title}</div>
      {children}
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 6 }}>{label}</div>
      {children}
      {error && <div style={{ fontSize: 12, color: '#B94A2A', marginTop: 4 }}>{error}</div>}
    </div>
  );
}
function inputStyle(err) {
  return {
    width: '100%', height: 44, padding: '0 14px',
    borderRadius: 10, border: `1px solid ${err ? '#E0A898' : 'var(--hairline-2)'}`,
    background: '#fff', fontSize: 15, color: 'var(--ink)',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };
}

// ─────────────────────────────────────────────────────────────
// TRACKING — horizontal stepper
// ─────────────────────────────────────────────────────────────
function TrackingScreen({ tenant, cart, onBack, onHome }) {
  const [step, setStep] = useState(1); // 0..3
  useEffect(() => {
    const id = setTimeout(() => setStep(s => Math.min(3, s + 1)), 3500);
    return () => clearTimeout(id);
  }, [step]);

  const steps = [
    { key: 'received', label: 'Recibido', sub: 'El local confirmó tu pedido' },
    { key: 'cooking', label: 'En cocina', sub: 'Están preparando la comida' },
    { key: 'delivery', label: 'En camino', sub: 'Salió para tu dirección' },
    { key: 'delivered', label: 'Entregado', sub: 'Esperamos que lo disfrutes' },
  ];

  const items = Object.values(cart);
  const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0) + tenant.delivery.fee;
  const orderNum = 'BA-' + Math.floor(Math.random() * 9000 + 1000);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        paddingTop: 54, paddingBottom: 10, paddingLeft: 8, paddingRight: 16,
        display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: '1px solid var(--hairline)',
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.close('var(--ink)', 20)}</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>Tu pedido</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>#{orderNum}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* ETA card */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
            textTransform: 'uppercase', color: 'var(--ink-3)',
          }}>Llega aproximadamente</div>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 40, lineHeight: 1.05,
            letterSpacing: -0.8, color: 'var(--ink)', fontWeight: 400, marginTop: 4,
          }}>
            {step === 3 ? '¡Llegó!' : '21:30 – 21:45'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
            {steps[step].sub}
          </div>
        </div>

        {/* Horizontal stepper */}
        <div style={{ padding: '8px 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={s.key}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                    background: done || active ? 'var(--accent)' : '#EFE9DD',
                    border: active ? '3px solid color-mix(in oklch, var(--accent) 30%, transparent)' : 'none',
                    boxSizing: 'content-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i === 0 ? 0 : 0, transition: 'all 300ms',
                  }}>
                    {done
                      ? Icon.check('#fff', 14)
                      : active
                        ? <span style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }}/>
                        : <span style={{ width: 6, height: 6, borderRadius: 99, background: '#C8BEA6' }}/>
                    }
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, borderRadius: 2,
                      background: done ? 'var(--accent)' : '#EFE9DD',
                      transition: 'background 300ms',
                      margin: active ? '0 6px 0 0' : '0',
                    }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {steps.map((s, i) => (
              <div key={s.key} style={{
                fontSize: 11, fontWeight: i === step ? 600 : 500,
                color: i <= step ? 'var(--ink)' : 'var(--ink-3)',
                flex: 1, textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center',
              }}>{s.label}</div>
            ))}
          </div>
        </div>

        {/* Order details */}
        <div style={{ borderTop: '8px solid #F3EEE4', padding: '16px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8,
          }}>Desde</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: tenant.hero.tone,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.store('var(--ink)', 18)}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{tenant.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{tenant.tagline}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--hairline)' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10,
          }}>Tu pedido ({items.reduce((s, it) => s + it.qty, 0)})</div>
          {items.map(it => (
            <div key={it.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', fontSize: 13, color: 'var(--ink-2)',
            }}>
              <span>{it.qty}× {it.name}</span>
              <span style={{ color: 'var(--ink)' }}>{formatARS(it.unitPrice * it.qty)}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 10, marginTop: 8, borderTop: '1px solid var(--hairline)',
            fontSize: 14, fontWeight: 600, color: 'var(--ink)',
          }}>
            <span>Total</span><span>{formatARS(total)}</span>
          </div>
        </div>

        {/* WhatsApp support */}
        <div style={{ padding: '12px 16px 40px' }}>
          <button style={{
            width: '100%', height: 48, borderRadius: 12,
            background: '#fff', border: '1px solid var(--hairline-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--ink)',
            cursor: 'pointer',
          }}>
            {Icon.whatsapp('#1FAF53', 18)} Consultar por WhatsApp
          </button>
          <button onClick={onHome} style={{
            width: '100%', height: 44, marginTop: 8,
            background: 'none', border: 'none',
            fontFamily: 'inherit', fontSize: 13, color: 'var(--ink-3)',
            cursor: 'pointer',
          }}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, ProductSheet, CartScreen, CheckoutScreen, TrackingScreen,
});
