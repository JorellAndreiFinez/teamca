import { DollarSign, TrendingUp, ShieldCheck, HelpCircle } from "lucide-react";

const data = [
  {
    icon: DollarSign,
    title: "Start",
    description: "Track your income and expenses effectively.",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    description: "Invest wisely to grow your wealth.",
  },
  {
    icon: ShieldCheck,
    title: "Protect",
    description: "Secure your financial assets and identity.",
  },
];

export default function WhyFinancialMatters() {
  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-5xl font-bold mb-4 text-[--secondary-color]">
          Why Financial Matters
        </h2>
        <p className=" mb-16 max-w-4xl mx-auto text-lg sm:text-xl">
          Understanding your finances helps you make smarter decisions, build
          stability, and achieve long-term success.
        </p>

        <div className="grid grid-cols-3 gap-8 items-center relative">
          {data.map((item, index) => {
            const Icon = item.icon;
            const isStart = item.title === "Start";
            return (
              <div
                key={index}
                className="flex flex-row items-center gap-4 relative px-4"
              >
                <div className={`p-1 flex-shrink-0 text-[--secondary-color]`}>
                  <Icon className="h-12 w-12" />
                </div>
                <p className="text-[--white-color] text-left text-base sm:text-lg">
                  {item.description}
                </p>

                {index < data.length - 1 && (
                  <div className="absolute right-0 bottom-0 h-16 w-px bg-gray-300 hidden md:block"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8 mx-8 text-lg font-bold">
          {data.map((item, index) => {
            const isStart = item.title === "Start";
            const textColor = isStart
              ? "text-white"
              : "text-[--secondary-color]";
            const lineColor = "bg-[--secondary-color]";
            const borderColor = "border-[--secondary-color]";

            return (
              <div key={index} className="flex items-center flex-1 relative">
                <span
                  className={`${textColor} text-2xl sm:text-4xl font-bold uppercase`}
                >
                  {item.title}
                </span>

                {index < data.length - 1 && (
                  <div className="relative flex-1 mx-2">
                    <div
                      className={`absolute top-1/2 left-0 right-0 h-px ${lineColor} -translate-y-1/2`}
                    ></div>
                    <span
                      className={`absolute right-0 top-1/2 w-3 h-3 border-t-2 border-r-2 rotate-45 -translate-y-1/2 ${borderColor}`}
                    ></span>
                  </div>
                )}

                {index === data.length - 1 && (
                  <div className="flex items-center flex-1 ml-4">
                    <div className={`relative flex-1 h-px ${lineColor}`}>
                      <span
                        className={`absolute right-0 top-1/2 w-3 h-3 border-t-2 border-r-2 rotate-45 -translate-y-1/2 ${borderColor}`}
                      ></span>
                    </div>
                    <span className="ml-2 text-2xl sm:text-4xl font-bold uppercase text-[--secondary-color]">
                      Retire
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-4xl mx-auto flex items-start gap-4">
          <HelpCircle className="w-10 h-10 text-[--secondary-color] flex-shrink-0" />
          <div className="text-left">
            <p className="font-bold text-2xl sm:text-4xl text-[--secondary-color]">
              Did you know?
            </p>
            <p className="text-lg sm:text-xl mt-1">
              Most families are unprepared for financial emergencies. With
              proper life insurance and financial planning, you can protect your
              loved ones and ensure their future security, no matter what life
              brings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
