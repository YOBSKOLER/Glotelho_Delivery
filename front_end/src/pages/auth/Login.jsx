import { useState } from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "@/components/auth-Layout";
import { Button } from "@/components/button";
import { Checkbox, CheckboxField } from "@/components/checkbox";
import { Field, Label } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { Input } from "@/components/input";
import { Strong } from "@/components/text";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(form.email, form.password);
      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "livreur") navigate("/livreur/dashboard");
      else navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Email ou mot de passe incorrect",
      );
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-6"
      >
        <Heading>Sign in to your account</Heading>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <Field>
          <Label>Email</Label>

          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            required
          />
        </Field>

        {/* Password */}

        <Field className="relative">
          <Label>Password</Label>

          <Input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Votre mot de passe"
            required
          />
        </Field>

        <div className="flex item-center justify-between">
          <CheckboxField>
            <Checkbox />
            <Label>Se souvenir de moi</Label>
          </CheckboxField>

          <Link to="/forgot-password">
            <Strong>Mot de passe oublié ?</Strong>
          </Link>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Connexion...
            </>
          ) : (
            <>Se connecter</>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
