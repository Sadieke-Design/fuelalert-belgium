import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");

          setTimeout(() => {
            window.location.href = "/login";
          }, 5000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      {status === "loading" && <h1>Email verificatie bezig...</h1>}

      {status === "success" && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-500">
            Email succesvol bevestigd
          </h1>

          <p className="mt-4">
            Je wordt automatisch doorgestuurd naar de loginpagina...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">
            Ongeldige of verlopen verificatielink
          </h1>
        </div>
      )}
    </div>
  );
}
