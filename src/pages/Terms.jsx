import React from "react";

export default function Terms() {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-10 pb-32">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-4xl font-bold mb-8 text-yellow-500">
                    Terms & Conditions
                </h1>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            1. Acceptance
                        </h2>
                        <p className="text-zinc-300">
                            By using FuelAlert Belgium you agree to these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            2. Fuel prices
                        </h2>
                        <p className="text-zinc-300">
                            Fuel prices are provided for informational purposes only.
                            FuelAlert Belgium cannot guarantee that prices shown in the app
                            exactly match prices at the pump.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            3. Account responsibility
                        </h2>
                        <p className="text-zinc-300">
                            Users are responsible for protecting their account credentials
                            and password.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            4. Premium subscriptions
                        </h2>
                        <p className="text-zinc-300">
                            Premium subscriptions are processed through Apple App Store
                            or Google Play and are subject to their terms and conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            5. Abuse
                        </h2>
                        <p className="text-zinc-300">
                            Abuse of the platform may result in account suspension or removal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            6. Applicable law
                        </h2>
                        <p className="text-zinc-300">
                            These terms are governed by Belgian law.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}