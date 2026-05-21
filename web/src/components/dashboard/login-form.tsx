"use client";

interface LoginFormProps {
  loginAction: (formData: FormData) => void | Promise<void>;
  showError: boolean;
}

export function LoginForm({ loginAction, showError }: LoginFormProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <form
        action={loginAction}
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h1 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>A/B Dashboard</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
        {showError && (
          <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Log in
        </button>
      </form>
    </div>
  );
}
