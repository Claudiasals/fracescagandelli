import { AdminToolbarHintRow } from "../components/AdminToolbarBackLink.jsx";
import ContactSection from "../components/ContactSection.jsx";

const Contact = () => {
  return (
    <section className="contact-section mx-auto flex w-full max-w-5xl flex-col py-10 md:max-w-none md:min-h-dvh md:py-0 md:pb-[2.5vw]">
      {!!localStorage.getItem("adminToken") && (
        <div className="mb-[25px] w-full shrink-0 md:hidden">
          <AdminToolbarHintRow />
        </div>
      )}

      <div className="contact-section-body flex w-full flex-1 flex-col justify-center md:min-h-0">
        <ContactSection formId="contact-form" />
      </div>
    </section>
  );
};

export default Contact;
