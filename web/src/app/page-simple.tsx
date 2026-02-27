export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f6f3',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #e8e4df', 
        background: '#ffffff',
        padding: '1rem 2rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#0f172a',
            letterSpacing: '0.1em'
          }}>
            BUENAUTO
          </h1>
          <nav>
            <a href="/autos" style={{ 
              marginRight: '1.5rem', 
              color: '#1e3a5f',
              textDecoration: 'none' 
            }}>Buscar</a>
            <a href="/publicar" style={{ 
              color: '#c9a962',
              textDecoration: 'none',
              fontWeight: 600
            }}>Publicar</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        color: '#ffffff',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 300,
          marginBottom: '1rem'
        }}>
          Compra y vende autos
        </h2>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#c9a962',
          marginBottom: '2rem'
        }}>
          El marketplace de vehículos más confiable de Chile
        </p>
        <a 
          href="/autos"
          style={{ 
            display: 'inline-block',
            background: '#c9a962',
            color: '#0f172a',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Ver autos disponibles
        </a>
      </section>

      {/* Listings placeholder */}
      <section style={{ padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            color: '#0f172a',
            marginBottom: '2rem',
            fontWeight: 600
          }}>
            Avisos destacados
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Static listing cards */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i}
                style={{
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e4df'
                }}
              >
                <div style={{ 
                  height: '180px', 
                  background: '#e8e4df',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}>
                  Imagen del auto
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <h4 style={{ 
                    fontSize: '1.125rem', 
                    color: '#0f172a',
                    marginBottom: '0.5rem',
                    fontWeight: 600
                  }}>
                    TOYOTA Corolla 2020
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    45.000 km • Santiago
                  </p>
                  <p style={{ 
                    color: '#c9a962', 
                    fontSize: '1.25rem', 
                    fontWeight: 700,
                    marginTop: '0.75rem'
                  }}>
                    $12.500.000
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: '#0f172a', 
        color: '#ffffff',
        padding: '2rem',
        textAlign: 'center',
        marginTop: '3rem'
      }}>
        <p style={{ color: '#94a3b8' }}>© 2025 BuenAuto. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
