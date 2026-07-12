import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login mislukt");
      }

      localStorage.setItem("fuelalert_token", data.token);

      navigate("/");
    } catch (err) {
      setError(err.message || "Onjuiste email of wachtwoord");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">Welkom terug</h1>

          <p className="text-slate-400">Meld je aan bij FuelAlert Belgium</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 mb-2">Emailadres</label>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

              <input
                type="email"
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
                "
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-slate-300">Wachtwoord</label>

              <Link
                to="/forgot-password"
                className="text-blue-400 text-sm hover:text-blue-300"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                "
              />
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
              transition
              disabled:opacity-50
              flex
              items-center
              justify-center
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Inloggen...
              </>
            ) : (
              "Inloggen"
            )}
          </button>
        </form>

        <div className="text-center mt-8 text-slate-400">
          Nog geen account?
          <Link
            to="/register"
            className="ml-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            Registreer hier
          </Link>
        </div>
      </div>
    </div>
  );
}
