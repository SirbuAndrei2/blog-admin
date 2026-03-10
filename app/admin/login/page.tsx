"use client";
import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Login failed");
            }

            window.location.href = "/admin";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a1122" }}>
            <div style={{ width: 400, background: "#111827", padding: "40px", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ display: "inline-flex", width: 48, height: 48, background: "#f59e0b", borderRadius: 12, alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>✦</div>
                    <h1 style={{ color: "#f8fafc", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "var(--font-display)" }}>Blog Admin</h1>
                    <p style={{ color: "#94a3b8", fontSize: 14, margin: "8px 0 0" }}>Sign in to continue</p>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={{ display: "block", color: "#cbd5e1", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#cbd5e1", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: "100%", padding: "14px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 8 }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
