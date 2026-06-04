import { Routes, Route } from "react-router-dom";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";

// Pagine
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Login from "./pages/Login";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import GalleryPage from "./pages/GalleryPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsOfService from "./pages/TermsOfService";
import Settings from "./pages/Settings";


const App = () => {

  return (
    <SiteSettingsProvider>
    <main
      id="app-main"
      tabIndex={-1}
      className="flex min-h-screen w-full min-w-0 flex-col font-prose font-normal text-[var(--color-black)] bg-[var(--color-white)] overflow-x-clip focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-verdolight)] focus-visible:ring-offset-2"
    >

      <div className="site-layout-shell w-full md:grid md:grid-cols-[max-content_minmax(0,1fr)] md:items-start">
        <Navbar />

        <div className="site-main-column min-w-0 w-full">
          <ScrollToTop />

          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/family" element={<GalleryPage />} />
          <Route path="/portrait" element={<GalleryPage />} />
          <Route path="/personal-branding" element={<GalleryPage />} />
          <Route path="/storytelling" element={<GalleryPage />} />
          <Route path="/gallery/:slug" element={<GalleryPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </div>
      </div>

      <Footer />

    </main>
    </SiteSettingsProvider>
  );
};

export default App;
