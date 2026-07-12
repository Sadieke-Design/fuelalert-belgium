import React from "react";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-10 pb-32">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-4xl font-bold mb-8 text-yellow-500">
                    Privacy Policy
                </h1>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            1. Data collected
                        </h2>
                        <p className="text-zinc-300">
                            FuelAlert Belgium stores your name, email address and account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            2. Password security
                        </h2>
                        <p className="text-zinc-300">
                            Passwords are securely encrypted and never stored in plain text.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            3. Location data
                        </h2>
                        <p className="text-zinc-300">
                            Your location is only used to display nearby fuel stations
                            and is never sold to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            4. Data sharing
                        </h2>
                        <p className="text-zinc-300">
                            FuelAlert Belgium does not sell personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            5. Account deletion
                        </h2>
                        <p className="text-zinc-300">
                            Users can request account deletion and removal of personal data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            6. GDPR
                        </h2>
                        <p className="text-zinc-300">
                            FuelAlert Belgium complies with the GDPR regulations applicable
                            within the European Union.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-2">
                            7. Contact
                        </h2>
                        <p className="text-zinc-300">
                            Questions regarding privacy can be sent to:
                        </p>

                        <p className="text-yellow-500 mt-2">
                            info@fuelalertbe.app
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}