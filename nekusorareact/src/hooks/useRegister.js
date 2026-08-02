import { useState } from "react";
import authService from "../services/authService";

export function useRegister() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pendingData, setPendingData] = useState(null);

    const reset = () => { setStep(1); setError(""); setPendingData(null); };
    const clearError = () => setError("");

    const sendOtp = async (formData) => {
        setLoading(true);
        setError("");
        try {
            await authService.sendOTP("register", { email: formData.email, phone_number: formData.phone_number });
            setPendingData(formData);
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
        setError("");
        try {
            await authService.sendOTP("register", { email: pendingData.email });
        } catch (err) {
            setError(err.response?.data?.message || "Gửi lại OTP thất bại");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (otp) => {
        setLoading(true);
        setError("");
        try {
            const { token } = await authService.verifyOTP("register", { email: pendingData.email }, otp);
            await authService.authComplete("register", { ...pendingData, token });
            return { success: true };
        } catch (err) {
            setError(err.response?.data?.message || "Đã có lỗi xảy ra");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { step, loading, error, reset, clearError, sendOtp, verifyOtp, resendOtp };
}