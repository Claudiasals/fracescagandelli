import { Routes, Route, Navigate } from "react-router-dom";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";

// Pagine
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop.jsx";
import WebCredit from "./components/WebCredit.jsx";
import Login from "./pages/Login";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import GalleryPage from "./pages/GalleryPage";
import Legal from "./pages/Legal.jsx";
import Settings from "./pages/Settings";


const App = () => {

  return (
    <SiteSettingsProvider>
    <main
      id="app-main"
      tabIndex={-1}
      className="flex min-h-dvh w-full min-w-0 flex-col font-prose font-normal text-[var(--color-black)] bg-[var(--color-white)] overflow-x-clip focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-verdolight)] focus-visible:ring-offset-2"
    >

      <div className="site-layout-shell flex min-h-0 w-full flex-1 flex-col md:grid md:grid-cols-[max-content_minmax(0,1fr)] md:items-start">
        <Navbar />

        <div className="site-main-column flex min-h-0 min-w-0 w-full flex-1 flex-col">
          <ScrollToTop />

          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery/:slug" element={<GalleryPage />} />
          <Route path="/family" element={<Navigate to="/gallery/family" replace />} />
          <Route path="/portrait" element={<Navigate to="/gallery/portrait" replace />} />
          <Route path="/personal-branding" element={<Navigate to="/gallery/personal-branding" replace />} />
          <Route path="/storytelling" element={<Navigate to="/gallery/storytelling" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy-policy" element={<Navigate to="/legal#privacy" replace />} />
          <Route path="/cookie-policy" element={<Navigate to="/legal#cookie" replace />} />
          <Route path="/terms-of-service" element={<Navigate to="/legal#note-legali" replace />} />
          </Routes>
        </div>
      </div>

      <WebCredit className="site-mobile-credit mt-auto shrink-0 px-[4vw] pb-8 pt-12 text-center md:hidden" />

    </main>
    </SiteSettingsProvider>
  );
};

export default App;
