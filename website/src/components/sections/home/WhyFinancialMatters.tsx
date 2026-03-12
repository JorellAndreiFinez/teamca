import React from "react";
import SectionHeader from "../../header/SectionHeader";

const WhyFinancialMatters = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 ">
        <SectionHeader
          subtitle="Lorem Ipsum"
          title="Lorem ipsum dolor sit, amet consectetur adipisicing elit."
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          align="hybrid"
          size="md"
        />

        <hr className="border-gray-300 my-12" />

        <div className="flex flex-col lg:flex-row items-center gap-8 mb-16">
          <div className="lg:w-1/2">
            <img
              src="https://placehold.co/600x400?text=Financial+Growth"
              alt="Financial Growth"
              className="rounded-xl shadow-lg w-full"
            />
          </div>
          <div className="lg:w-1/2">
            <h3 className="text-2xl font-bold text-[--primary-color] mb-4">
              Smart Budgeting
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Track your income and expenses easily</li>
              <li>Set achievable savings goals</li>
              <li>Visualize spending patterns over time</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 mb-16">
          <div className="lg:w-1/2 lg:order-2">
            <img
              src="https://placehold.co/600x400?text=Investment+Insights"
              alt="Investment Insights"
              className="rounded-xl shadow-lg w-full"
            />
          </div>
          <div className="lg:w-1/2 lg:order-1">
            <h3 className="text-2xl font-bold text-[--primary-color] mb-4">
              Investment Insights
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Learn strategies to grow your wealth</li>
              <li>Minimize risks with expert advice</li>
              <li>Track investment performance over time</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="lg:w-1/2">
            <img
              src="https://placehold.co/600x400?text=Secure+Planning"
              alt="Secure Planning"
              className="rounded-xl shadow-lg w-full"
            />
          </div>
          <div className="lg:w-1/2">
            <h3 className="text-2xl font-bold text-[--primary-color] mb-4">
              Secure Planning
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Safeguard your financial future</li>
              <li>Use reliable tools for planning</li>
              <li>Prepare for emergencies and retirement</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyFinancialMatters;
