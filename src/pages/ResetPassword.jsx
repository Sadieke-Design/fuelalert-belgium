import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (newPassword !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Resetlink is ongeldig of verlopen.");
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-white mb-4">
            Ongeldige resetlink
          </h1>

          <p className="text-slate-400 mb-6">
            Deze wachtwoordlink ontbreekt of is ongeldig.
          </p>

          <Link
            to="/forgot-password"
            className="text-blue-400 hover:text-blue-300"
          >
            Vraag een nieuwe resetlink aan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-white mx-auto mb-6" />

          <h1 className="text-4xl font-bold text-white mb-2">
            Nieuw wachtwoord
          </h1>

          <p className="text-slate-400">
            Stel hieronder een nieuw wachtwoord in
          </p>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 rounded-xl p-4 mb-6 text-center">
            Wachtwoord succesvol gewijzigd. Je wordt doorgestuurd naar de
            loginpagina...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 mb-2">
                Nieuw wachtwoord
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="
                    w-full
                    bg-slate-800
                    border
                    border-slate-700
                    rounded-xl
                    h-14
                    pl-12
                    pr-12
                    text-white
                    placeholder-slate-500
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2">
                Bevestig wachtwoord
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="
                    w-full
                    bg-slate-800
                    border
                    border-slate-700
                    rounded-xl
                    h-14
                    pl-12
                    pr-12
                    text-white
                    placeholder-slate-500
                    focus:outline-none
                    focus:border-blue-500
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-14
                bg-blue-600
                hover:bg-blue-700
                rounded-xl
                text-white
                font-semibold
                transition-all
                disabled:opacity-50
                flex
                items-center
                justify-center
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wachtwoord wijzigen...
                </>
              ) : (
                "Wachtwoord wijzigen"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
