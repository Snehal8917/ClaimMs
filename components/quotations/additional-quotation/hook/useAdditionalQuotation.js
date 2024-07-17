"use client"
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { additionalQuotationSchema } from "../schema/additionalQuotationSchema";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

import { getSingleJobCardAction } from "../../../../action/employeeAction/jobcard-action";
import { addAdQuotation } from "@/action/quotationAction/quotation-action";

export const useAdditionalQuotation = () => {
    const [loading, setLoading] = useState(false);
    const [snewtatus, setSnewtatus] = useState("");
    const params = useParams();
    const jobCardId = params?.jobcardId;

    const {
        isLoading: isLoadingJobCardData,
        isError: isErrorJobCardData,
        data: jobcardData,
        error: jobCardDataError,
    } = useQuery({
        queryKey: ["jobcardData", jobCardId],
        queryFn: () => getSingleJobCardAction(jobCardId),
        enabled: !!jobCardId,
        retry: false,
        onSuccess: (data) => { },
    });

    const formatDate = (dateString) =>
        dateString ? new Date(dateString).toISOString().split("T")[0] : "";


    const addADQuotationMutation = useMutation({
        mutationKey: ["addADQuotationMutation"],
        mutationFn: async (data) => {
            return await addAdQuotation(data);
        },
        onSuccess: (response) => {
            toast.success(response?.message);

            //   router.push("/quotations-list");
        },
        onError: (error) => {
            toast.error(error?.data?.message);
        },
    });


    //addAdQuotation
    const handleQuotationForm = async (values) => {
        console.log("i am values yyyy:-", values);

        const dateTime = new Date(values?.quDateAndTime);

        const timeZone = "America/New_York";
        const options = {
            timeZone,
            hour12: false,
            hour: "numeric",
            minute: "numeric",
        };
        const timeFormatted = dateTime.toLocaleString("en-US", options);


        const {
            quCustomer,
            quCar,
            quJobCard,
            qudaystocomplete,
            itemList,
            quStatus,
            sectionItems,
        } = values;


        const payLoad = {
            date: dateTime.toISOString().split("T")[0],
            time: timeFormatted,
            customer: quCustomer,
            car: quCar,

            daysToQuote: qudaystocomplete,
            listOfItems: itemList,

            jobCardId: quJobCard,
            status: snewtatus || quStatus,
            sectionItemList: sectionItems,
        };

        await addADQuotationMutation.mutateAsync(payLoad);

    };


    const initialValues = useMemo(() => ({
        quDateAndTime: formatDate(new Date()),
        quCustomer: jobcardData?.customerId?._id || "",
        quCar: jobcardData?.carId?._id || "",
        quJobCard: jobcardData?._id || "",
        qudaystocomplete: "",
        itemList: [{ itemName: "", itemPrice: "" }],
        sectionItems: [
            {
                sectionName: "",
                itemsList: [{ itemName: "" }],
                price: "",
            },
        ],
    }), [jobcardData]);


    return {
        initialValues: initialValues,
        schema: additionalQuotationSchema,
        submit: handleQuotationForm,
        setSnewtatus,
        loading,
    };
};
