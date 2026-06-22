import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>UniDriver</h1>
      <p style={{ color: '#94a3b8', fontSize: 18, marginTop: 0 }}>
        Earn passive income from your idle car — you only ever pay a share when it earns.
      </p>
      <Link
        href="/owner"
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '12px 20px',
          background: '#6366f1',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open the Owner dashboard →
      </Link>
      <p style={{ color: '#64748b', marginTop: 24, fontSize: 14 }}>
        This Next.js app talks to the NestJS API and shares its domain types via
        <code style={{ color: '#a5b4fc' }}> @unidriver/shared</code>.
      </p>
    </div>
  );
}
