import { useState } from "react";
import authService from "../services/authService";

export function useResetPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const clearError = () => setError(null);

    const sendOtp = async (inputEmail) => {
        setLoading(true);
        setError(null);
        try {
            await authService.sendOTP("reset_password", { email: inputEmail });
            setEmail(inputEmail);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Gửi OTP thất bại, vui lòng thử lại");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.sendOTP("reset_password", { email });
        } catch (err) {
            setError(err.response?.data?.message || "Gửi lại OTP thất bại");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (otp) => {
        setLoading(true);
        setError(null);
        try {
            const { token } = await authService.verifyOTP("reset_password", { email }, otp);
            setResetToken(token);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (newPassword) => {
        setLoading(true);
        setError(null);
        try {
            await authService.authComplete("reset_password", { email, token: resetToken, new_password: newPassword });
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại, vui lòng thử lại");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setEmail("");
        setResetToken("");
        setError(null);
        setLoading(false);
    };

    return { step, email, loading, error, clearError, sendOtp, resendOtp, verifyOtp, resetPassword, reset };
}