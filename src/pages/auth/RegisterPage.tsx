/**
 * @file src/pages/auth/RegisterPage.tsx
 * @description User registration page with Supabase Auth for TrendHub
 * Creates auth user and profile record on signup
 * @author TrendHub Engineering
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/feed", { replace: true });
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email || !password) {
      addToast({ type: "error", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    if (password.length < 6) {
      addToast({ type: "error", title: "A senha deve ter ao menos 6 caracteres" });
      return;
    }

    // Username validation
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      addToast({
        type: "error",
        title: "Username inválido",
        description: "Use apenas letras minúsculas, números e _ (3-20 chars)",
      });
      return;
    }

    setLoading(true);

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      addToast({ type: "error", title: "Username já está em uso" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName || username },
      },
    });

    if (error) {
      addToast({ type: "error", title: "Erro ao cadastrar", description: error.message });
      setLoading(false);
      return;
    }

    if (data.user) {
      // If the user is logged in immediately, create the profile record.
      if (data.session) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          display_name: displayName || username,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          addToast({
            type: "error",
            title: "Erro ao criar perfil",
            description: profileError.message,
          });
          setLoading(false);
          return;
        }

        addToast({
          type: "success",
          title: "Conta criada com sucesso! 🎉",
          description: "Bem-vindo ao TrendHub!",
        });
        navigate("/feed");
      } else {
        addToast({
          type: "success",
          title: "Conta criada!",
          description:
            "Confira seu email para concluir o cadastro e depois faça login.",
        });
        navigate("/login");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            TrendHub
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Junte-se à{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              comunidade
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Crie seu perfil, participe de desafios e conecte-se com criadores incríveis.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🏆", text: "Desafios criativos" },
              { emoji: "👥", text: "Comunidades ativas" },
              { emoji: "⚡", text: "Trends em tempo real" },
              { emoji: "💬", text: "Chat privado" },
            ].map(({ emoji, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
              >
                <span>{emoji}</span>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm relative">
          © 2024 TrendHub. Todos os direitos reservados.
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              TrendHub
            </span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white">Criar conta</h2>
            <p className="text-slate-400 mt-2">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Entre agora
              </Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="seu_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de exibição</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Seu Nome"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Ao criar sua conta, você concorda com os nossos{" "}
              <span className="text-cyan-400 cursor-pointer">Termos de Uso</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
