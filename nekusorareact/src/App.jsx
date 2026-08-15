import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";
import { ToastProvider } from "./context/ToastContext";
import { TanstackQueryProvider } from "./providers/TanstackQueryProvider";
import ScrollToTop from "./components/ScrollToTop";

const App = () => {
  return (
    <TanstackQueryProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ToastProvider headerHeight={64}>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </TanstackQueryProvider>
  )
};

export default App;
