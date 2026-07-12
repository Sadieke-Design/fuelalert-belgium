import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      // Altijd succes tonen zodat niemand kan testen
      // welke emailadressen bestaan.
      setSent(true);
    } catch (err) {
      console.error(err);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Wachtwoord vergeten
          </h1>

          <p className="text-slate-400">We sturen je een resetlink via email</p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500 text-green-400 rounded-xl p-4 text-center">
            Indien het emailadres bestaat, ontvang je binnen enkele minuten een
            resetlink.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 mb-2">Emailadres</label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  type="email"
                  autoComplete="email"
                  placeholder="naam@email.be"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="
                    w-full
                    bg-slate-800
                    border
                    border-slate-700
                    rounded-xl
                    h-14
                    pl-12
                    pr-4
                    text-white
                    placeholder-slate-500
                    focus:outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-500/20
                  "
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}

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
                disabled:cursor-not-allowed
                flex
                items-center
                justify-center
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verzenden...
                </>
              ) : (
                "Resetlink verzenden"
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Terug naar login
          </Link>
        </div>
      </div>
    </div>
  );
}
