import type { RegisterData } from "../interfaces/register";
import apiClient from "./client";

export const getAllUsers = async () => {
  const responce = await apiClient.get("/users/all");
  return responce.data;
};

export const registerUser = async (
  data: RegisterData
): Promise<RegisterData> => {
  const response = await apiClient.post("/auth/create", data);
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const body = new URLSearchParams({
    username: email,
    password: password,
  }).toString();

  const response = await apiClient.post("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};
