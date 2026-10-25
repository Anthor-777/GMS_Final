import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/axios';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      push('Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg);
      push(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/40 blur-[110px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent/30 blur-[120px]" />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-md rounded-2xl p-8 shadow-glow"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient font-bold text-white">P</div>
          <div>
            <p className="text-lg font-semibold">Pulse Gym</p>
            <p className="text-sm text-ink-muted">Sign in to the admin console</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-ink-secondary">Username</span>
            <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink-secondary">Password</span>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <motion.button
            type="submit"
            className="btn-primary w-full"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
