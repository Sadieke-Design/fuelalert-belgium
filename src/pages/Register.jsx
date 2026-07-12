import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("You must accept the Terms and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://fuelalertbe.app/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            termsAccepted,
            privacyAccepted,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccessMessage(
        "Registration successful! Please check your email to activate your account before logging in.",
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTermsAccepted(false);
      setPrivacyAccepted(false);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-black" />
          </div>

          <div>
            <h1 className="text-4xl font-bold">Create account</h1>

            <p className="text-zinc-400">Join FuelAlert Belgium</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">First Name</Label>

                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  required
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Last Name</Label>

                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Email</Label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Password</Label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">
                Confirm Password
              </Label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 text-zinc-300">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />

                <span>
                  I accept the{" "}
                  <Link
                    to="/terms"
                    className="text-yellow-500 hover:text-yellow-400 underline"
                    target="_blank"
                  >
                    Terms and Conditions
                  </Link>
                </span>
              </label>

              <label className="flex items-center gap-3 text-zinc-300">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                />

                <span>
                  I accept the{" "}
                  <Link
                    to="/privacy"
                    className="text-yellow-500 hover:text-yellow-400 underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-yellow-500 hover:text-yellow-400 font-semibold"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
