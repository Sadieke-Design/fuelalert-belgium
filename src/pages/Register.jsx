import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    UserPlus,
    Mail,
    Lock,
    Loader2
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";

export default function Register() {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [email, setEmail] = useState("");

    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword
    ] = useState("");

    const [
        termsAccepted,
        setTermsAccepted
    ] = useState(false);

    const [
        privacyAccepted,
        setPrivacyAccepted
    ] = useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleSubmit =
        async (e) => {

        e.preventDefault();

        setError("");

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match"
            );
            return;
        }

        if (
            !termsAccepted ||
            !privacyAccepted
        ) {
            setError(
                "You must accept the Terms and Privacy Policy"
            );
            return;
        }

        setLoading(true);

        try {

            const response =
                await fetch(
                    "https://fuelalertbe.app/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            first_name:
                                firstName,
                            last_name:
                                lastName,
                            email,
                            password,
                            termsAccepted,
                            privacyAccepted,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok
            ) {
                throw new Error(
                    data.message ||
                    "Registration failed"
                );
            }

            alert(
                "Registration successful. Check your email to activate your account."
            );

            window.location.href =
                "/login";

        } catch (err) {

            setError(
                err.message ||
                "Registration failed"
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <AuthLayout
            icon={UserPlus}
            title="Create your account"
            subtitle="Create your FuelAlert Belgium account"
            footer={
                <>
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-primary font-medium hover:underline"
                    >
                        Log in
                    </Link>
                </>
            }
        >

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-2">
                        <Label>
                            First Name
                        </Label>

                        <Input
                            value={firstName}
                            onChange={(e) =>
                                setFirstName(
                                    e.target.value
                                )
                            }
                            placeholder="John"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Last Name
                        </Label>

                        <Input
                            value={lastName}
                            onChange={(e) =>
                                setLastName(
                                    e.target.value
                                )
                            }
                            placeholder="Doe"
                            required
                        />
                    </div>

                </div>

                <div className="space-y-2">

                    <Label>
                        Email
                    </Label>

                    <div className="relative">

                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                        <Input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            className="pl-10 h-12"
                            placeholder="you@example.com"
                            required
                        />

                    </div>

                </div>

                <div className="space-y-2">

                    <Label>
                        Password
                    </Label>

                    <div className="relative">

                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                        <Input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            className="pl-10 h-12"
                            placeholder="••••••••"
                            required
                        />

                    </div>

                </div>

                <div className="space-y-2">

                    <Label>
                        Confirm Password
                    </Label>

                    <div className="relative">

                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            className="pl-10 h-12"
                            placeholder="••••••••"
                            required
                        />

                    </div>

                </div>

                <div className="space-y-3 text-sm">

                    <label className="flex gap-2 items-start">

                        <input
                            type="checkbox"
                            checked={
                                termsAccepted
                            }
                            onChange={(e) =>
                                setTermsAccepted(
                                    e.target.checked
                                )
                            }
                        />

                        <span>
                            I accept the Terms and Conditions
                        </span>

                    </label>

                    <label className="flex gap-2 items-start">

                        <input
                            type="checkbox"
                            checked={
                                privacyAccepted
                            }
                            onChange={(e) =>
                                setPrivacyAccepted(
                                    e.target.checked
                                )
                            }
                        />

                        <span>
                            I accept the Privacy Policy
                        </span>

                    </label>

                </div>

                <Button
                    type="submit"
                    className="w-full h-12 font-medium"
                    disabled={loading}
                >

                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        "Create account"
                    )}

                </Button>

            </form>

        </AuthLayout>
    );
}