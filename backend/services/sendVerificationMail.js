import { sendMail } from "./mailService.js";

export async function sendVerificationMail(email, token, firstName) {

    const verificationUrl =
        `https://fuelalertbe.app/verify-email?token=${token}`;

    const html = `
        <h2>Welkom bij FuelAlert Belgium</h2>

        <p>Hallo ${firstName},</p>

        <p>Klik op onderstaande knop om je e-mailadres te bevestigen.</p>

        <p>
            <a href="${verificationUrl}">
                Account activeren
            </a>
        </p>

        <p>Of gebruik deze link:</p>

        <p>${verificationUrl}</p>

        <br>

        <p>FuelAlert Belgium</p>
    `;

    await sendMail(
        email,
        "Bevestig je e-mailadres",
        html
    );
}