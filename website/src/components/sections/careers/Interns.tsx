import SectionHeader from "@/components/header/SectionHeader";
import { Mail, FileText, QrCode, BriefcaseBusiness } from "lucide-react";

export default function Interns() {
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
          title="Become an Intern"
          description="Start your professional journey and gain valuable real-world experience with Team CA."
          align="center"
          size="xl"
          containerSize="lg"
          color="yellow"
        />

        {/* MAIN CARD */}
        <div className="mt-14 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* LEFT SIDE */}
              <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <BriefcaseBusiness className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-semibold">
                      Internship Application
                    </h3>

                    <p className="text-white/50 text-sm">
                      Team CA Internship Program
                    </p>
                  </div>
                </div>

                <p className="text-white/70 leading-relaxed text-sm md:text-base">
                  Interested applicants may simply apply through the following
                  methods. Please ensure that all required information and
                  supporting documents are complete before submission.
                </p>

                {/* APPLICATION FORM */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold">
                        Application Form
                      </h4>

                      <p className="mt-2 text-white/70 text-sm leading-relaxed">
                        Please submit the completed form along with the required
                        information and documents, and kindly await further
                        updates regarding your application via email.
                      </p>

                      <p className="mt-4 text-sm text-white break-all">
                        https://bit.ly/PLUKInternshipApplicationForm
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold">
                        Email Application
                      </h4>

                      <p className="mt-2 text-white/70 text-sm leading-relaxed">
                        Kindly send your CV or resume to the email address
                        below.
                      </p>

                      <p className="mt-4 text-sm text-white break-all">
                        prulifeukbosliarecruitments.tca@gmail.com
                      </p>

                      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                          Subject Format
                        </p>

                        <p className="text-sm text-white">
                          [DEPARTMENT] Internship Application - Last Name
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTE */}
                <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
                  <p className="text-sm md:text-base text-white/80 leading-relaxed">
                    For <span className="font-semibold">Multimedia</span> and{" "}
                    <span className="font-semibold">Full-Stack Developer</span>{" "}
                    applicants, kindly attach your respective portfolios
                    relevant to the position you are applying for.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="p-8 md:p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <QrCode className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl md:text-3xl font-semibold text-center">
                  Scan to Apply
                </h3>

                <p className="mt-3 text-white/60 text-center max-w-sm">
                  Use your mobile device to scan the QR code and access the
                  internship application form instantly.
                </p>

                {/* QR PLACEHOLDER */}
                <div className="mt-8 rounded-3xl bg-white p-5 shadow-2xl">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://bit.ly/PLUKInternshipApplicationForm"
                    alt="Internship QR Code"
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>

                <p className="mt-5 text-xs tracking-[0.2em] uppercase text-white/40 text-center">
                  Team CA Internship Program
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
