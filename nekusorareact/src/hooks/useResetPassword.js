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
            await authService.forgotPW(inputEmail);
            setEmail(inputEmail);
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.message || "Gửi OTP thất bại, vui lòng thử lại";
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.forgotPW(email);
        } catch (err) {
            const msg = err.response?.data?.message || "Gửi lại OTP thất bại";
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (otp) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.verifyOTP(email, otp);
            setResetToken(data.reset_token);
            setStep(3);
        } catch (err) {
            const msg = err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn";
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (newPassword) => {
        setLoading(true);
        setError(null);
        try {
            await authService.resetPW(email, resetToken, newPassword);
            setStep(4);
        } catch (err) {
            const msg = err.response?.data?.message || "Đặt lại mật khẩu thất bại, vui lòng thử lại";
            setError(msg);
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