'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';

export function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError('Identifiants incorrects');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header decoration */}
      <div className="h-32 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      </div>

      {/* Content */}
      <div className="flex-1 -mt-16 px-6">
        <div className="bg-card rounded-2xl shadow-lg p-6 max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">BE</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">BillboardEye</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi de campagnes d'affichage
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Adresse email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@entreprise.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>
            </FieldGroup>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Forgot password */}
          <button className="w-full text-center text-sm text-primary mt-4 hover:underline">
            Mot de passe oublié ?
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 pb-8">
          Utilisez n'importe quel email pour la démo.
          <br />
          Ajoutez "manager" dans l'email pour l'espace Manager.
        </p>
      </div>
    </div>
  );
}
