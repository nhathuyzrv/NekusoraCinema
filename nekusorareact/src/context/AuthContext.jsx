import { createContext, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Token from "../configs/Token";
import authService from "../services/authService";
import userService from "../services/userService";

const AuthContext = createContext();

async function fetchCurrentUser() {
    if (!Token.exists()) return null;
    try {
        return await userService.getCurrentUser();
    } catch {
        Token.clear();
        return null;
    }
}

export function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const {
        data: user,
        isLoading: appLoading,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: fetchCurrentUser,
        retry: false,
        staleTime: 1000 * 6 * 5,
    });

    const refreshUser = useCallback(() => {
        return queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    }, [queryClient]);

    const login = useCallback(async ({ username, password }) => {
        setActionLoading(true);
        setError(null);
        try {
            const data = await authService.login({ username, password });
            Token.save(data);
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        } catch (err) {
            const msg = err.response?.status === 400 ? "Email hoặc Mật khẩu sai" : "Đã có lỗi xảy ra, vui lòng thử lại";
            setError(msg);
            throw err;
        } finally {
            setActionLoading(false);
        }
    }, [queryClient]);

    const logout = useCallback(async () => {
        try {
            await authService.logout(Token.getAccess());
        } catch {
            //
        } finally {
            Token.clear();
            queryClient.setQueryData(["currentUser"], null);
            queryClient.clear();
        }
    }, [queryClient]);

    const clearError = useCallback(() => setError(null), []);

    const hasRole = useCallback((...roles) => user && roles.includes(user.role), [user]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                appLoading,
                actionLoading,
                error,
                isAuthenticated,
                login,
                logout,
                clearError,
                hasRole,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;