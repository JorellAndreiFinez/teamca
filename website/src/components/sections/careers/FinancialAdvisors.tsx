import SectionHeader from "@/components/header/SectionHeader";
import { Mail, User, MessageCircle } from "lucide-react";

export default function FinancialAdvisors() {
  const contacts = [
    {
      name: "Isabela Santos",
      facebook: "Isabela Santos",
      email: "plukisabelasantos@gmail.com",
    },
    {
      name: "Nicole Adriano",
      facebook: "Nicole Adriano",
      email: "andrenicole.adriano@gmail.com",
    },
    {
      name: "Angel Luna",
      facebook: "Angel Luna",
      email: "plukgiljenangelaluna@gmail.com",
    },
  ];

  return (
    <section className="relative w-full min-h-[60vh] text-white px-6 py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader
          title="Become a Financial Advisor"
          description="Join the team and build your future with us."
          align="center"
          size="xl"
          containerSize="lg"
          color="yellow"
        />

        {/* MAIN CARD */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-xl">
            {/* TOP CONTENT */}
            <div className="p-8 md:p-12">
              <div className="max-w-3xl">
                <h3 className="text-2xl md:text-3xl font-semibold leading-tight">
                  Start Your Journey With Team CA
                </h3>

                <p className="mt-5 text-white/70 text-sm md:text-base leading-relaxed">
                  Interested applicants may send their CV or resume to our Human
                  Resources Associates via email, or through a private message
                  on Messenger for faster communication.
                </p>

                {/* SUBJECT FORMAT */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                    Email Subject Format
                  </p>

                  <p className="text-sm md:text-base text-white font-medium">
                    [FA] Financial Advisor Application - Last Name
                  </p>
                </div>
              </div>

              {/* CONTACT CARDS */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="
                      rounded-2xl
                      border border-white/10
                      bg-white/[0.03]
                      backdrop-blur-lg
                      p-6
                      transition-all duration-300
                      hover:bg-white/[0.06]
                      hover:-translate-y-1
                    "
                  >
                    {/* NAME */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-lg">
                          {contact.name}
                        </h4>

                        <p className="text-white/50 text-sm">HR Associate</p>
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-4 h-4 mt-1 text-white/60" />

                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/40">
                            Messenger
                          </p>

                          <p className="text-sm text-white/80">
                            {contact.facebook}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 mt-1 text-white/60" />

                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/40">
                            Email
                          </p>

                          <p className="text-sm text-white/80 break-all">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="border-t border-white/10 bg-black/10 px-8 md:px-12 py-6">
              <p className="text-center text-sm md:text-base text-white/60 leading-relaxed">
                We welcome passionate individuals who are eager to grow,
                inspire, and create a meaningful impact through financial
                education and protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
