import { FormEvent, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { supabase } from '../supabase';

export function AuthScreen() {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setErrorMessage('');
    setMessage('');
    setIsSubmitting(true);
    const result = isCreatingAccount
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error.message);
    } else if (isCreatingAccount && !result.data.session) {
      setMessage('Confira seu e-mail para confirmar a criação da conta.');
    }
  }

  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900">
        <section className="mx-auto max-w-md rounded-lg bg-white p-7 shadow-sm">
          <Building2 className="mb-5 h-8 w-8 text-indigo-700" />
          <h1 className="text-xl font-bold">Conecte o Supabase</h1>
          <p className="mt-2 text-sm text-slate-600">Configure estas variáveis no arquivo `.env.local` para habilitar o acesso:</p>
          <pre className="mt-4 overflow-x-auto rounded bg-slate-950 p-4 text-xs text-slate-100">{`VITE_SUPABASE_URL=https://ryfpfpynlhzphnroixvx.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica`}</pre>
          <p className="mt-4 text-xs text-slate-500">Use a chave publishable/anon do projeto. Nunca coloque a service_role no navegador.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900">
      <section className="mx-auto max-w-md rounded-lg bg-white p-7 shadow-sm">
        <Building2 className="mb-5 h-8 w-8 text-indigo-700" />
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Obramax</p>
        <h1 className="mt-2 text-2xl font-bold">{isCreatingAccount ? 'Criar acesso' : 'Entrar na sua conta'}</h1>
        <p className="mt-2 text-sm text-slate-600">Seus dados de obras ficam privados na sua conta.</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            E-mail
            <input
              autoComplete="email"
              className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              onChange={event => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-medium">
            Senha
            <input
              autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
              className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              minLength={6}
              onChange={event => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {errorMessage && <p className="text-sm text-red-700" role="alert">{errorMessage}</p>}
          {message && <p className="text-sm text-emerald-700" role="status">{message}</p>}
          <button
            className="flex w-full items-center justify-center gap-2 rounded bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Aguarde...' : isCreatingAccount ? 'Criar conta' : 'Entrar'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <button
          className="mt-5 w-full text-sm font-medium text-slate-600 hover:text-indigo-700"
          onClick={() => {
            setIsCreatingAccount(value => !value);
            setErrorMessage('');
            setMessage('');
          }}
          type="button"
        >
          {isCreatingAccount ? 'Já tem uma conta? Entrar' : 'Primeiro acesso? Criar conta'}
        </button>
      </section>
    </main>
  );
}