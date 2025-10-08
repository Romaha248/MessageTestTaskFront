"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import { useState } from "react";
import { loginSchema } from "../../zodSchemas/login";
import { loginUser } from "../../service/auth";
import Cookies from "js-cookie";
import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import type { User } from "../../interfaces/authContext";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string>("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await loginUser(data.email, data.password);
      Cookies.set("access_token", res.access_token, { expires: 7 });

      const decoded = jwtDecode<User>(res.access_token);
      setUser({ id: decoded.id, username: decoded.username });

      navigate("/chats");
    } catch (err: unknown) {
      let msg = "Login failed. Try again.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setServerError(msg);
      console.error("Failed to login:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className={`w-full px-3 py-2 border rounded ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {serverError && (
          <p className="text-center mt-4 text-red-500">{serverError}</p>
        )}
      </form>
    </div>
  );
}
