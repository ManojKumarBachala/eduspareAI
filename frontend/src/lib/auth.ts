export const isAuthenticated = () => {
    if (typeof window === "undefined") return false;

    return !!localStorage.getItem("access_token");
};

export const logout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
};