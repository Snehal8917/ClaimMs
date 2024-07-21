"use client";
import { getSingleJobCardAction } from "@/action/employeeAction/jobcard-action";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import AdditionalQuotionView from "../additional-quotation-view/AdditionalQuotionView";
import ClaimView from "../claim-view/ClaimView";
import CustomerView from "../customer-view/CustomerView";
import DocuementView from "../docuemnt-view/DocuementView";
import HistoryView from "../history-view/HistoryView";
import QuotionView from "../quotation-view/QuotionView";

const JobCardView = () => {
  const [activeTab, setActiveTab] = useState("Customer");

  const params = useParams();
  const jobCardId = params?.view_jobcard;

  const {
    isLoading,
    isError,
    data: jobcardData,
  } = useQuery({
    queryKey: ["jobcardData", jobCardId],
    queryFn: () => getSingleJobCardAction(jobCardId),
    enabled: !!jobCardId,
    retry: false,
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "Customer":
        return <CustomerView />;
      case "ClaimView":
        return <ClaimView />;
      case "QuotationView":
        return <QuotionView />;
      case "AdditionalQuotionView":
        return <AdditionalQuotionView jobcardData={jobcardData} />;
      case "DocuementView":
        return <DocuementView />;
      case "HistoryView":
        return <HistoryView />;
      default:
        return null;
    }
  };
  return (
    <>
      <div className="flex flex-col justify-start items-start gap-6">
        <div className="flex justify-start items-center gap-4">
          <div className="flex flex-col justify-center items-start gap-3">
            <div className="flex justify-center items-center gap-2">
              <span className="text-base font-medium">Job Card Number:</span>

              <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                {jobcardData?.jobCardNumber}
              </span>
            </div>
            <div className="flex justify-center items-center gap-2">
              <span className="text-base font-medium">Customer Email :</span>

              <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                {jobcardData?.customerId?.email}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 bg-muted p-2 rounded-lg w-auto bg-[#6478B]">
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "Customer"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("Customer")}
          >
            Job Details
          </button>
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "ClaimView"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("ClaimView")}
          >
            Claim
          </button>
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "QuotationView"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("QuotationView")}
          >
            Quotation
          </button>
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "AdditionalQuotionView"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("AdditionalQuotionView")}
          >
            Additional Quotation
          </button>
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "DocuementView"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("DocuementView")}
          >
            Documents
          </button>
          <button
            className={`px-4 py-2 rounded-lg hover:bg-muted/80 ${
              activeTab === "HistoryView"
                ? "bg-card text-card-foreground font-bold"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("HistoryView")}
          >
            History
          </button>
        </div>
        <div className="mt-0 w-full">{renderTabContent()}</div>
      </div>
    </>
  );
};

export default JobCardView;
