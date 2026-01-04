import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) return setStatus("invalid");

    fetch(`/api/invites/accept?token=${token}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <p>Accepting invite…</p>;
  if (status === "success") return <p>Invite accepted 🎉</p>;
  return <p>Invalid or expired invite</p>;
}
