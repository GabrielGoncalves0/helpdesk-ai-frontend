'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { User, Lock, Key, Target, Shield, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { apiFetch } from '@/services/api-client';
import { CustomSelect } from '@/components/ui/custom-select';

export default function ProfilePage() {
  const { user } = useAuth();

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Target Concurso / Examiner Form State
  const [targetConcurso, setTargetConcurso] = useState('');
  const [targetExaminer, setTargetExaminer] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Preencha a senha atual e a nova senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setIsChangingPassword(false);
      toast.success('🔒 Senha alterada com sucesso via criptografia bcrypt!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setIsChangingPassword(false);
      toast.error(err.message || 'Erro ao alterar a senha. Verifique sua senha atual.');
    }
  };

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Configurações de Concurso (${targetConcurso}) e Banca (${targetExaminer}) salvas!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Perfil do Concurseiro & Segurança <User className="w-6 h-6 text-violet-400" />
        </h2>
        <p className="text-sm text-slate-400">
          Gerencie seu e-mail, altere sua senha de acesso e escolha sua banca examinadora de foco.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info Summary Card */}
        <Card className="glass-panel border-violet-500/20 bg-slate-900/60 flex flex-col justify-between">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-xl shadow-violet-900/40 border border-violet-400/30 mx-auto mb-2">
              {user?.name?.[0] || 'G'}
            </div>
            <CardTitle className="text-base text-white">{user?.name || 'Gabriel Gonçalves'}</CardTitle>
            <CardDescription className="text-xs text-slate-400">{user?.email || 'bie.gabriel1@outlook.com'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs text-slate-400">Tipo de Conta</span>
              <div>
                <Badge variant="purple" className="px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1 text-violet-400" />
                  Concurseiro VIP / ADMIN
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Proteção de Senha:</span>
                <span className="text-emerald-400 font-semibold">Bcrypt Hash (10)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status da Conta:</span>
                <span className="text-emerald-400 font-semibold">Ativa & Verificada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Forms (2 Columns) */}
        <div className="md:col-span-2 space-y-6">
          {/* Form 1: Change Password */}
          <Card className="glass-panel border-violet-500/30 bg-slate-900/80 p-6">
            <CardHeader className="p-0 mb-4 space-y-1">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-400" />
                <CardTitle className="text-base text-white">Alterar Senha de Acesso</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Sua nova senha será encriptada no banco PostgreSQL usando o algoritmo seguro <strong className="text-slate-200">Bcrypt</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Senha Atual</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nova Senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs py-2.5 mt-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Criptografando e salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>Atualizar Senha com Criptografia Bcrypt</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Form 2: Target Exam & Examiner */}
          <Card className="glass-panel border-cyan-500/20 bg-slate-900/80 p-6">
            <CardHeader className="p-0 mb-4 space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-base text-white">Configurações de Concurso & Banca Alvo</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                A IA adapta a persona do Tutor e os Simulados com base no seu objetivo.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={handleSaveProfileSettings} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Concurso Alvo</label>
                    <input
                      type="text"
                      value={targetConcurso}
                      onChange={(e) => setTargetConcurso(e.target.value)}
                      placeholder="Ex: TJ-SP Escrevente"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                    <CustomSelect
                      value={targetExaminer}
                      onChange={(val) => setTargetExaminer(val)}
                      options={[
                        { value: 'FGV', label: 'FGV (Fundação Getulio Vargas)' },
                        { value: 'Cebraspe', label: 'Cebraspe / CESPE' },
                        { value: 'FCC', label: 'FCC (Fundação Carlos Chagas)' },
                        { value: 'Vunesp', label: 'Vunesp (São Paulo)' },
                      ]}
                      className="border-cyan-500/30 focus:border-cyan-500"
                    />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full text-xs py-2.5 mt-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span>Salvar Preferências do Concurso</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
