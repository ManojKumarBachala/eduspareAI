import axios, { AxiosHeaders } from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (token) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !== "undefined" &&
            error.response?.status === 401 &&
            window.location.pathname !== "/login"
        ) {
            localStorage.removeItem("access_token");
            window.location.assign("/login");
        }

        return Promise.reject(error);
    },
);

export default api;
