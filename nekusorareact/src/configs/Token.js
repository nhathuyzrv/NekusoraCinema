const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const Token = {
    // { access_token, refresh_token, token_type, expires_in, scope }
    getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    setAccess: (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
    removeAccess: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
    getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefresh: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    removeRefresh: () => localStorage.removeItem(REFRESH_TOKEN_KEY),

    save: ({ access_token, refresh_token }) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    },

    clear: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    exists: () => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

export default Token;