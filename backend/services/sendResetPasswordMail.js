import { sendMail } from "./mailService.js";

export async function sendResetPasswordMail(email, token, firstName) {
  const resetUrl = `https://fuelalertbe.app/reset-password?token=${token}`;

  const html = `
        <h2>FuelAlert Belgium - Wachtwoord herstellen</h2>

        <p>Hallo ${firstName},</p>

        <p>Er werd een aanvraag gedaan om je wachtwoord opnieuw in te stellen.</p>

        <p>Klik op onderstaande knop om een nieuw wachtwoord in te stellen:</p>

        <p>
            <a href="${resetUrl}">
                Wachtwoord opnieuw instellen
            </a>
        </p>

        <p>Of gebruik deze link:</p>

        <p>${resetUrl}</p>

        <br>

        <p>Deze link blijft 1 uur geldig.</p>

        <br>

        <p>Heb je deze aanvraag niet gedaan? Dan mag je deze mail gewoon negeren.</p>

        <br>

        <p>FuelAlert Belgium</p>
    `;

  await sendMail(email, "FuelAlert - Wachtwoord herstellen", html);
}
