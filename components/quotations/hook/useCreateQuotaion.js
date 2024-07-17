import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { quotaionFormSchema } from "../schema";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import {
  addQuotation,
  addsupplementQuotation,
  getSingleQuotation,
  updateQuotation,
} from "../../../action/quotationAction/quotation-action";
import { getSingleJobCardAction } from "../../../action/employeeAction/jobcard-action";

export const useCreateQuotaion = ({ CsrList }) => {
  const [loading, setLoading] = useState(false);
  const [lpoStep, setlpoStep] = useState({});
  const params = useParams();
  const router = useRouter();
  const jobCardId = params?.jobcardId;
  const [snewtatus, setSnewtatus] = useState("");
  const quotaionsId = params?.quotaionsId;
  const viewQuotationId = params?.viewQuotationId;
  const reCreateID = params?.reCreateID;

  const supplementId = params?.supplementId;

  const customerCareRepresentative = CsrList[0]?.value || "";
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

  const {
    isLoading: isLoadingQuotation,
    isError: isErrorQuotation,
    data: quotationData,
    error: QuotationError,
  } = useQuery({
    queryKey: ["quotationData", quotaionsId],
    queryFn: () =>
      getSingleQuotation(
        quotaionsId || viewQuotationId || reCreateID || supplementId
      ),
    enabled:
      !!quotaionsId || !!viewQuotationId || !!reCreateID || !!supplementId,
    retry: false,
    onSuccess: (data) => { },
  });

  const addQuotationMutation = useMutation({
    mutationKey: ["addQuotationMutation"],
    mutationFn: async (data) => {
      return await addQuotation(data);
    },
    onSuccess: (response) => {
      toast.success(response?.message);

      router.push("/quotations-list");
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  //update mutaion

  const updateQuotationMutation = useMutation({
    mutationKey: ["updateQuotationMutation"],
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("quotatioDetails", JSON.stringify(data));
      if (lpoStep) {

        formData.append("lpo", lpoStep[0]);
      }
      const quotaionsId = params?.quotaionsId;
      const viewQuotationId = params?.viewQuotationId;

      return await updateQuotation(quotaionsId || viewQuotationId, formData);
    },
    onSuccess: (response) => {
      toast.success(response?.message);
      router.push("/quotations-list");
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });
  //

  //spec

  const addSupQuotationMutation = useMutation({
    mutationKey: ["addSupQuotationMutation"],
    mutationFn: async (data) => {
      return await addsupplementQuotation(data);
    },
    onSuccess: (response) => {
      toast.success(response?.message);

      router.push("/quotations-list");
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  //
  const LpoQuotationMutation = useMutation({
    mutationKey: ["updateQuotationMutation"],
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("lpo", data.lpo);
      const quotaionsId = params?.quotaionsId;
      const viewQuotationId = params?.viewQuotationId;

      return await updateQuotation(quotaionsId || viewQuotationId, formData);
    },
    onSuccess: (res) => {
      toast.success(response?.message);
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  const handleQuotationForm = async (values) => {
    console.log("i am values yyyy:-", values);
    setLoading(true);
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
      quInsuranceCom,
      quJobCard,
      qudaystocomplete,
      itemList,
      quCustomerCareRepresentative,
      quStatus,
      quoLpo,
      sectionItems,
    } = values;

    const payLoad = {
      date: dateTime.toISOString().split("T")[0],
      time: timeFormatted,
      customer: quCustomer,
      car: quCar,
      insuranceCompany: quInsuranceCom,
      daysToQuote: qudaystocomplete,
      listOfItems: itemList,
      CCRId: quCustomerCareRepresentative,
      jobCardId: quJobCard,
      status: snewtatus || quStatus,
      sectionItemList: sectionItems,
    };

    if (quoLpo && typeof quoLpo === "object") {
      setlpoStep(quoLpo);
    }

    try {
      if (quotaionsId && quotationData?.status === "Draft") {
        await updateQuotationMutation.mutateAsync(payLoad);
      } else if ((quotaionsId && quotationData?.status !== "Draft") || viewQuotationId) {
        const payLoadUpdate = {
          date: dateTime.toISOString().split("T")[0],
          time: timeFormatted,
          customer: quCustomer,
          car: quCar,
          insuranceCompany: quInsuranceCom,
          daysToQuote: qudaystocomplete,
          listOfItems: itemList,
          CCRId: quCustomerCareRepresentative,
          jobCardId: quJobCard,
          status: quStatus,
          sectionItemList: sectionItems,
        };

        await updateQuotationMutation.mutateAsync(payLoadUpdate);
      } else if (supplementId) {
        await addSupQuotationMutation.mutateAsync(payLoad);
      } else {
        await addQuotationMutation.mutateAsync(payLoad);
      }
    } catch (error) {
      console.error("Mutation Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toISOString().split("T")[0] : "";

  const initialValues = useMemo(() => {
    if (quotaionsId && quotationData?.status === 'Draft') {
      return {
        quDateAndTime: formatDate(quotationData?.date) || "",
        quCustomer: quotationData?.customer?._id || "",
        quCar: quotationData?.car?._id || "",
        quInsuranceCom: quotationData?.insuranceCompany?._id || "",
        quJobCard: quotationData?.jobCardId?._id || "",
        qudaystocomplete: quotationData?.daysToQuote || "",
        quCustomerCareRepresentative: quotationData?.CCRId || "",

        itemList: quotationData?.listOfItems?.length > 0 ? quotationData?.listOfItems : [
          { itemName: "", itemPrice: "" },
        ],
        quStatus: quotationData?.status || "Draft",
        quoLpo: quotationData?.lpo || [],
        sectionItems: quotationData?.sectionItemList?.length > 0 ?
          quotationData.sectionItemList :
          [{
            sectionName: "",
            itemslist: [{ itemName: "" }], price: ""
          }]
      };
    }
    else if (quotaionsId && quotationData) {
      return {
        quDateAndTime: formatDate(quotationData?.date) || "",
        quCustomer: quotationData?.customer?._id || "",
        quCar: quotationData?.car?._id || "",
        quInsuranceCom: quotationData?.insuranceCompany?._id || "",
        quJobCard: quotationData?.jobCardId?._id || "",
        // quJobCard: quotationData?.jobCardId?.jobCardNumber,
        qudaystocomplete: quotationData?.daysToQuote || "",
        quCustomerCareRepresentative: quotationData?.CCRId || "",
        itemList: quotationData?.listOfItems?.length > 0 ? quotationData?.listOfItems : [
          { itemName: "", itemPrice: "" },
        ],
        quStatus: quotationData?.status || "Draft",
        quoLpo: quotationData?.lpo || [],
        sectionItems: quotationData?.sectionItemList?.length > 0 ?
          quotationData.sectionItemList :
          [{
            sectionName: "",
            itemslist: [{ itemName: "" }], price: ""
          }]
      };
    } else if (supplementId && quotationData) {
      return {
        quDateAndTime: formatDate(quotationData?.date) || "",
        quCustomer: quotationData?.customer?._id || "",
        quCar: quotationData?.car?._id || "",
        quInsuranceCom: quotationData?.insuranceCompany?._id || "",

        quJobCard: quotationData?.jobCardId?._id || "",
        qudaystocomplete: quotationData?.daysToQuote || "",
        quCustomerCareRepresentative: quotationData?.CCRId || "",
        itemList: [{ itemName: "", itemPrice: "" }],
        sectionItems: [
          {
            sectionName: "",
            itemsList: [{ itemName: "" }],
            price: "",
          },
        ],
        quStatus: quotationData?.status || "Draft",
        quoLpo: quotationData?.lpo || [],
      };
    } else if (reCreateID && quotationData) {
      return {
        quDateAndTime: formatDate(quotationData?.date) || "",
        quCustomer: quotationData?.customer?._id || "",
        quCar: quotationData?.car?._id || "",
        quInsuranceCom: quotationData?.insuranceCompany?._id || "",
        quJobCard: quotationData?.jobCardId?._id || "",
        qudaystocomplete: quotationData?.daysToQuote || "",
        quCustomerCareRepresentative: quotationData?.CCRId || "",

        itemList: quotationData?.listOfItems?.length > 0 ? quotationData?.listOfItems : [
          { itemName: "", itemPrice: "" },
        ],
        quStatus: "Pending",
        quoLpo: quotationData?.lpo || [],
        sectionItems: quotationData?.sectionItemList?.length > 0 ?
          quotationData.sectionItemList :
          [{
            sectionName: "",
            itemslist: [{ itemName: "" }], price: ""
          }]
      };
    } else if (viewQuotationId && quotationData) {
      return {
        quDateAndTime: formatDate(quotationData?.date) || "",
        quCustomer: quotationData?.customer?._id || "",
        quCar: quotationData?.car?._id || "",
        quInsuranceCom: quotationData?.insuranceCompany?._id || "",
        quJobCard: quotationData?.jobCardId?._id || "",
        qudaystocomplete: quotationData?.daysToQuote || "",
        quCustomerCareRepresentative: quotationData?.CCRId || "",


        itemList: quotationData?.listOfItems?.length > 0 ? quotationData?.listOfItems : [
          { itemName: "", itemPrice: "" },
        ],

        sectionItems: quotationData?.sectionItemList?.length > 0 ?
          quotationData.sectionItemList :
          [{
            sectionName: "",
            itemslist: [{ itemName: "" }], price: ""
          }],
        quStatus: quotationData?.status || "Draft",
        quoLpo: quotationData?.lpo || [],
      };
    } else if (jobCardId && jobcardData) {
      return {
        quDateAndTime: formatDate(new Date()),
        quCustomer: jobcardData.customerId?._id || "",
        quCar: jobcardData.carId?._id || "",
        quInsuranceCom: jobcardData.insuranceCompany?._id || "",
        quJobCard: jobcardData?._id || "",
        qudaystocomplete: "",
        quCustomerCareRepresentative: customerCareRepresentative,
        itemList: [{ itemName: "", itemPrice: "" }],
        sectionItems: [
          {
            sectionName: "",
            itemsList: [{ itemName: "" }],
            price: "",
          },
        ],
      };
    } else {
      return {
        quDateAndTime: "",
        quCustomer: "",
        quCar: "",
        quInsuranceCom: "",
        quJobCard: "",
        qudaystocomplete: "",
        quCustomerCareRepresentative: "",
        itemList: [{ itemName: "", itemPrice: "" }],
        sectionItems: [
          {
            sectionName: "",
            itemsList: [{ itemName: "" }],
            price: "",
          },
        ],
      };
    }
  }, [quotationData, jobcardData]);

  return {
    initialValues: initialValues,
    loading,
    schema: quotaionFormSchema,
    submit: handleQuotationForm,
    LpoQuotationMutation: LpoQuotationMutation,
    setSnewtatus,
    quotationData,
  };
};
