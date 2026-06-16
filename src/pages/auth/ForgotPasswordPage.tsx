/**
 * @file src/pages/auth/ForgotPasswordPage.tsx
 * @description Password recovery page using Supabase Auth resetPasswordForEmail
 * @author TrendHub Engineering
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      addToast({ type: "error", title: "Erro ao enviar email", description: error.message });
    } else {
      setSent(true);
      addToast({
        type: "success",
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            TrendHub
          </span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Email enviado!</h2>
            <p className="text-slate-400">
              Enviamos um link de recuperação para <strong className="text-white">{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full mt-4">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-3xl font-bold text-white">Recuperar senha</h2>
              <p className="text-slate-400 mt-2">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <Link to="/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
