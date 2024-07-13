"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import { getSingleJobCardAction } from "@/action/employeeAction/jobcard-action";
import { useQuery, useMutation } from "@tanstack/react-query";
import { updateClaimAction } from "@/action/claimAction/claim-action";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

const ClaimView = () => {
  const { data: session } = useSession();
  const [selectJobCard, setselectJobCard] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);
  const params = useParams();
  const router = useRouter();
  const jobCardId = params?.view_jobcard;
  const role = session?.role;

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  const statusOptions = [
    { value: "Under Approval", label: "Under Approval" },
    { value: "Approved", label: "Approved" },
    { value: "Re-Submitted", label: "Re-Submitted" },
    { value: "Reject", label: "Reject" },
  ];

  const {
    isLoading,
    isError,
    data: jobcardData,
    refetch,
  } = useQuery({
    queryKey: ["jobcardData", jobCardId],
    queryFn: () => getSingleJobCardAction(jobCardId),
    enabled: !!jobCardId,
    retry: false,
  });

  const updateClaimMutation = useMutation({
    mutationKey: ["updateClaimMutation"],
    mutationFn: async ({ id, status, insuranceClaimNumber }) => {
        return await updateClaimAction(id, { status, insuranceClaimNumber });
    },
    onSuccess: (response) => {
      toast.success("Claim status updated successfully");
      const status = response?.data?.status;
      const jobCardId = response?.data?.jobCardId;
      if (status === "Approved" && role === "company") {
        handleAddQuotation(jobCardId);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  const currentStatus = watch("status");
  const insuranceClaimNumberWatch = watch("insuranceClaimNumber");
  const hasStatusChanged =
    initialStatus !== null && initialStatus !== currentStatus;

  const handleAssign = (data) => {
    const { status, insuranceClaimNumber } = data;
    if (
      currentStatus === "Approved" &&
      (!insuranceClaimNumberWatch || insuranceClaimNumberWatch.length === 0)
    ) {
      setError("insuranceClaimNumber", {
        type: "manual",
        message: "Insurance Claim Number required when status is Approved",
      });
      return;
    }
    const claimId = jobcardData?.claimId?._id;
    if (claimId) {
      const updateData = { status };
      if (insuranceClaimNumber) {
        updateData.insuranceClaimNumber = insuranceClaimNumber;
      }
  
      updateClaimMutation.mutate({ id: claimId, ...updateData });
    }
  };

  useEffect(() => {
    if (jobcardData) {
      setValue("status", jobcardData?.claimId?.status);
      setValue(
        "insuranceClaimNumber",
        jobcardData?.claimId?.insuranceClaimNumber || ""
      );
      setInitialStatus(jobcardData?.claimId?.status);
    }
  }, [jobcardData, setValue]);

  const handleAddQuotation = (jobCardId) => {
    router.push(`/quotations/create/${jobCardId}`);
    setselectJobCard(jobCardId);
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error fetching data...</p>;
  }

  if (!jobcardData.claimId) {
    return (
      <div className="w-full flex flex-wrap justify-between gap-4">
        <div className="w-full lg:w-full space-y-4">
          <Card className="border">
            <CardHeader className="flex flex-row items-center gap-3 font-bold">
              <div className="flex items-center w-full justify-between">
                <div>Claim Details</div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 justify-between w-full">
              <div className="w-full flex flex-wrap justify-between gap-4">
                <p>No Claim available.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isStatusEditable = [
    "Under Approval",
    "Re-Submitted",
    "Reject",
  ].includes(initialStatus);



  return (
    <>
      <form onSubmit={handleSubmit(handleAssign)}>
        <div className="w-full flex flex-wrap justify-between gap-4">
          <div className="w-full lg:w-full space-y-4">
            <Card className="border">
              <CardHeader className="flex flex-row items-center gap-3 font-bold">
                <div className="flex flex-wrap items-center w-full justify-between">
                  <div>Claim Details</div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                <div className="w-full flex flex-wrap justify-between gap-4">
                  <div className="w-full lg:w-[48%] space-y-4">
                    <div className="">
                      <Label htmlFor="details" className="font-bold">
                        Claim Number
                      </Label>
                      <div className="flex gap-2 w-full mt-1 ml-1">
                        <label>{jobcardData?.claimId?.claimNumber}</label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status" className="font-bold">
                        Status
                      </Label>
                      <div className="flex gap-2 w-full mt-1 ml-1">
                        <div className="flex gap-4">
                          <div className="w-[20rem]">
                            <Controller
                              name="status"
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <Select
                                  className="react-select"
                                  classNamePrefix="select"
                                  id="status"
                                  options={statusOptions}
                                  onChange={(selectedOption) =>
                                    onChange(selectedOption.value)
                                  }
                                  value={statusOptions.find(
                                    (option) => option.value === value
                                  )}
                                  isDisabled={!isStatusEditable}
                                />
                              )}
                            />
                          </div>
                          <div className="w-[20rem]">
                            {hasStatusChanged && (
                              <Button
                                className="ml-auto"
                                type="submit"
                                variant="primary"
                              >
                                Update Status
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      {hasStatusChanged &&
                        initialStatus !== "Approved" &&
                        currentStatus === "Approved" && (
                          <div className="flex gap-2 w-full mt-1 ml-1">
                            <div className="w-[20rem]">
                              <Label>Insurance Claim Number</Label>
                              <Controller
                                name="insuranceClaimNumber"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                  <Input
                                    type="text"
                                    name="insuranceClaimNumber"
                                    placeholder="Insurance Claim Number"
                                    size="lg"
                                    id="insuranceClaimNumber"
                                    value={value}
                                    onChange={onChange}
                                  />
                                )}
                              />
                              {errors.insuranceClaimNumber && (
                                <p className="text-red-500">
                                  {errors.insuranceClaimNumber.message}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      {initialStatus === "Approved" && (
                        <div className="flex gap-2 w-full mt-1 ml-1">
                          <div className="w-[20rem]">
                            <Label htmlFor="details" className="font-bold">
                              Insurance Claim Number
                            </Label>
                            <div className="flex gap-2 w-full mt-1 ml-1">
                              <label>
                                {jobcardData?.claimId?.insuranceClaimNumber ||
                                  ""}
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
};

export default ClaimView;
