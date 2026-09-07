import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import BiensListPage from "./pages/BiensListPage";
import BienDetailPage from "./pages/BienDetailPage";
import OffresPage from "./pages/OffresPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import InvitePage from "./pages/InvitePage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="biens" element={<BiensListPage />} />
        <Route path="biens/:reference" element={<BienDetailPage />} />
        <Route path="offres" element={<OffresPage />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="invite/:code" element={<InvitePage />} />
        <Route
          path="mon-compte"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
