
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "./Components/Header";
import Hero from "./Components/Hero";
import About from "./Components/About";
import Portfolio from "./Pages/Portfolio";
import Contact from "./Pages/Contact";
import Footer from "./Pages/Footer";

import Reviews from "./Pages/Review";
import Auth from "./Pages/Auth";
import MyBookings from "./Pages/MyBooking";
import Profile from "./Pages/Profile";

// Admin pages
import AdminLayout from "../Admin/Pages/AdminLayout";
import Dashboard from "../Admin/Pages/Dashboard";
import AdminLogin from "../Admin/Pages/AdminLogin";
import AdminAbout from "../Admin/Pages/Photography/About";
import HeroManagement from "../Admin/Components/HeroManagement";

import Gallery from "../Admin/Pages/Photography/Gallery";
import Bookings from "../Admin/Pages/Photography/Booking";
import ReviewsAdmin from "../Admin/Pages/Photography/Reviews";

import Projects from "../Admin/Pages/Web/Projects";
import Enquiries from "../Admin/Pages/Web/Enquiries";

import Settings from "../Admin/Pages/Settings";
import Payments from "./Pages/Payements";

function RequireAdmin({ children }) {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function RequireUser({ children }) {
  const userToken = localStorage.getItem("userToken");

  if (!userToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicWebsite() {
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  return (
    <>
      <Header
        onLoginClick={() => setAuthOpen(true)}
        onBookingsClick={() => setBookingsOpen(true)}
      />

      <main>
        <Hero />
        <About />
        <Portfolio />
        <Contact />
        <Reviews onLoginClick={() => setAuthOpen(true)} />
        <Footer />
      </main>

      <AnimatePresence>
        {authOpen && (
          <Auth onClose={() => setAuthOpen(false)} />
        )}

        {bookingsOpen && (
          <MyBookings onClose={() => setBookingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function PortfolioPage() {
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed left-5 top-24 z-40 border border-white/20 bg-black/70 px-4 py-2 text-xs uppercase tracking-widest text-white backdrop-blur-md transition hover:bg-white hover:text-black"
      >
        Back to Home
      </button>

      <div className="min-h-screen bg-[#05070a] pt-20 text-white">
        <Portfolio />
      </div>
    </>
  );
}

function ProfilePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  return (
    <>
      <Header
        onLoginClick={() => setAuthOpen(true)}
        onBookingsClick={() => setBookingsOpen(true)}
      />

      <main className="pt-[70px]">
        <Profile />
      </main>

      <AnimatePresence>
        {authOpen && (
          <Auth onClose={() => setAuthOpen(false)} />
        )}

        {bookingsOpen && (
          <MyBookings onClose={() => setBookingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<PublicWebsite />} />

      <Route path="/portfolio" element={<PortfolioPage />} />

      <Route
        path="/profile"
        element={
          <RequireUser>
            <ProfilePage />
          </RequireUser>
        }
      />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="hero" element={<HeroManagement />} />
        <Route path="about" element={<AdminAbout />} />
        <Route path="payments" element={<Payments />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="projects" element={<Projects />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
