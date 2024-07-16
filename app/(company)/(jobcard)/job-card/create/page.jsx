"use client";
import { addEmiratesData } from "@/action/emiratesAction/emirates-action";
import { getCustomerListAction } from "@/action/employeeAction/customer-action";
import {
  addJobCard,
  getSingleJobCardAction,
  updateJobCardAction,
} from "@/action/employeeAction/jobcard-action";
import { extractCarAction } from "@/action/extractDataAction/carRcAction";
import { addLicenceData } from "@/action/licenceAction/licence-action";
import FileUploaderMultiple from "@/components/common/file-multi-uploader/file-uploader-multiple";
import ClickableStep from "@/components/common/steps/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";
import { z } from "zod";
import { ratio } from "fuzzball";

import { getInsuranceCompanies } from "@/action/companyAction/insurance-action";
import { getMasterCarDataAction } from "@/action/masterCar/mastercar-action";
import LayoutLoader from "@/components/layout-loader";
import { useParams, useRouter } from "next/navigation";
import { getUserMeAction } from "@/action/auth-action";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
// import { log } from "console";

const commonSchema = z.object({
  value: z.string().optional(),
  label: z.string().optional(),
});

const carDetailsSchema = z.object({
  make: z.string().min(1, { message: "Car Make is required" }),
  model: z.string().min(1, { message: "Car Model is required" }),
  trim: z.string().min(1, { message: "Car Trim is required" }),
  year: z
    .string()
    .min(4, { message: "Car Year is required" })
    .regex(/^\d{4}$/, { message: "Invalid Year format" }),
  plateNumber: z.string().min(1, { message: "Plate Number is required" }),
  chassisNo: z.string().min(1, { message: "Chassis Number is required" }),
});

const insuranceDetailsSchema = z.object({
  currentInsurance: z
    .string()
    .min(1, { message: "Current Insurer is required" }),
  insuranceExpiryDate: z.any().optional(),
});

const documentSchema = z.object({
  policeReport: z
    .any()
    .refine((val) => val?.length > 0, { message: "Police report is required" }),
  beforePhotos: z
    .any()
    .refine((val) => val?.length > 0, { message: "Before Photo is required" }),
});

// Step 1 schema
const step1Schema = z.object({
  email: z
    .string()
    .optional()
    .refine((value) => {
      return value !== undefined && value.trim() !== "";
    }, "Email is required")
    .refine((value) => {
      return /^\S+@\S+\.\S+$/.test(value);
    }, "Invalid email format"),
  mobileNumber: z
    .string()
    .refine((value) => {
      return value !== undefined && value.trim() !== "";
    }, "Mobile number is required")
    .refine((value) => {
      return /^[0-9]{10}$/.test(value);
    }, "Invalid mobile number format"),
  fullName: z.string().refine((value) => value.trim() !== "", {
    message: "Customer Name required",
  }),
  //   emiratesId: z.array(z.any()).optional(),
  //   drivingId: z.array(z.any()).optional(),
  customerEmiratesId: z.string().refine((value) => value.trim() !== "", {
    message: "Customer Emirates ID is required",
  }),
  licenceNo: z.string().refine((value) => {
    return value !== undefined && value.trim() !== "";
  }, "Licence number is required"),
  licenceIssueDate: z
    .string()
    .refine((value) => value.trim() !== "", {
      message: "Issue date required",
    })
    .transform((str) => new Date(str)),
  licenceExpiryDate: z
    .string()
    .refine((value) => value.trim() !== "", {
      message: "Expiry date required",
    })
    .refine((value, ctx) => {
      return value > (ctx?.licenceIssueDate || "");
    }, "Expiry date must be after issue date")
    .transform((str) => new Date(str)),

  tcNo: z.string().refine((value) => value.trim() !== "", {
    message: "TC number is required",
  }),
});

// Step 2 schema
const step2Schema = z.object({
  email: z.string().optional(),
  customerEmiratesId: z.any().optional(),
  carDetails: carDetailsSchema.optional(),
  insuranceDetails: insuranceDetailsSchema.optional(),
});

// Step 3 schema
const step3Schema = z.object({
  details: z.any().optional(),
  startDate: z.any().optional(),
  // status: z.any().optional(),
});

// Step 4 schema
const step4Schema = z.object({
  dateOfAccident: z.any().optional(),
  isFault: z.boolean().optional(),
  documents: documentSchema,
});

const repairOptions = [
  { value: "Breakdown", label: "Breakdown" },
  { value: "Booked Vehicle", label: "Booked Vehicle" },
  { value: "Repeat Job", label: "Repeat Job" },
  { value: "Customer Waiting", label: "Customer Waiting" },
  { value: "Demo", label: "Demo" },
];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const JobCardPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [resetTrigger, setResetTrigger] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [jobCardId, setJobCardId] = useState(null);
  const [paramId, setParamId] = useState(null);
  //  Emirates document uploader
  const [emiratesData, setEmiratesData] = useState([]);
  const [emiratesApi, setEmiratesApi] = useState(false);
  // Extract Loader State
  const [loadingoverlay, setLoadingoverlay] = useState(false);
  const [loadingDriving, setLoadingDriving] = useState(false);
  const [loadingCarExtract, setLoadingCarExtract] = useState(false);

  // Driving Licence documnet uploader
  const [drivingData, setDrivingData] = useState([]);
  const [drivingApi, setDrivingApi] = useState(false);

  const [currentInsId, setCurrentInsId] = useState("");
  const [apiCalled, setApiCalled] = useState(false);
  const [exctractCarData, setExctractCarData] = useState("");
  const [binaryFiles, setBinaryFiles] = useState([]);
  const [defaultDate, setDefaultDate] = useState("");
  const isInitialized = useRef(false);

  const [jobCardDataResponse, setJobCardDataResponse] = useState(null);

  const [filePreviews, setFilePreviews] = useState([]);
  const [filePreviews1, setFilePreviews1] = useState([]);
  const [policeReportimg, setPoliceReportImg] = useState([]);
  const [beforePhotosimg, setBeforePhotosImg] = useState([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const [carModelLists, setCarModelLists] = useState([]);
  const [carTrimLists, setCarTrimLists] = useState([]);

  const [isEmiratesIdSet, setIsEmiratesIdSet] = useState(false);

  const { update_Jobcard } = useParams();

  useEffect(() => {
    if (update_Jobcard && update_Jobcard.length > 0) {
      setJobCardId(update_Jobcard[0]);
      setParamId(update_Jobcard[0]);
    }
  }, [update_Jobcard]);

  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ["userMe"],
    queryFn: () => getUserMeAction(session.jwt),
    enabled: !!session?.jwt, // Only run the query if the token is available
  });

  const CREATED_USER_ID = userData?.data?.userId?._id;
  const CREATED_USER_ROLE = userData?.data?.userId?.role;

  const {
    isLoading: isLoadingCompanyData,
    isError: isErrorCompanyData,
    data: jobcardData,
    error: companyDataError,
  } = useQuery({
    queryKey: ["jobcardData", jobCardId],
    queryFn: () => getSingleJobCardAction(jobCardId),
    enabled: !!jobCardId, // Only enable query if customerId is truthy
    retry: false,
    onSuccess: (data) => {
      setJobCardDataResponse(data);
    },
  });

  const { data: getMasterCarData, isLoading: isLoadinggetMasterCarData } =
    useQuery({
      queryKey: ["getMasterCarDataAction"],
      queryFn: getMasterCarDataAction,
    });

  const formattedCarData = getMasterCarData?.data?.map((make) => ({
    value: make,
    label: make,
  }));

  const handleMakeChange = async (selectedMake) => {
    try {
      const response = await getMasterCarDataAction({
        params: { brand: selectedMake },
      });
      setCarModelLists(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleModelChange = async (selectedModel, prevMake) => {
    try {
      const response = await getMasterCarDataAction({
        params: { brand: selectedMake || prevMake, model: selectedModel },
      });
      setCarTrimLists(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // const { data: carsData } = useQuery({
  //   queryKey: ["getCars", pageIndex, pageSize],
  //   queryFn: () => getCars({ page: pageIndex + 1, size: pageSize, all: false }),
  // });
  const { data: InsuranceCompaniesData } = useQuery({
    queryKey: ["getInsuranceCompanies"],
    queryFn: () =>
      getInsuranceCompanies({
        all: true,
      }),
  });

  // const {
  //   data: employeeData,
  //   isLoading: isLoading2,
  //   error: error2,
  // } = useQuery({
  //   queryKey: ["getEmployeeList", pageIndex, pageSize],
  //   queryFn: () => getAllEmployee({ all: true }),
  // });

  const InsuranseCompanyList = InsuranceCompaniesData?.data?.map(
    (insuranse_compnay) => ({
      value: insuranse_compnay.companyName,
      label: insuranse_compnay.companyName,
      id: insuranse_compnay._id,
    })
  );

  // const customersLists = customersData?.data?.customers?.map((customer) => ({
  //   value: customer._id,
  //   label: customer.firstName,
  // }));

  // const employeeLists = employeeData?.data?.map((employee) => ({
  //   value: employee._id,
  //   label: employee.firstName,
  // }));

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    resetField,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isFault: true,
    },
    resolver: zodResolver(
      activeStep === 0
        ? step1Schema
        : activeStep === 1
        ? step2Schema
        : activeStep === 2
        ? step3Schema
        : activeStep === 3
        ? step4Schema
        : schema // default schema if none of the above conditions match
    ),
    mode: "all",
  });
  const beforePhotosList = watch("documents.beforePhotos");
  const selectedMake = useWatch({
    control,
    name: "carDetails.make",
  });
  const selectedModel = useWatch({
    control,
    name: "carDetails.model",
  });

  const mutation = useMutation({
    mutationKey: ["addJobCard"],
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append(
        "drivingLicenseLink",
        drivingData?.fileUrl?.path ? drivingData?.fileUrl?.path : ""
      );
      formData.append(
        "emirateIdLink",
        emiratesData?.fileUrl?.path ? emiratesData?.fileUrl?.path : ""
      );
      for (const key in data) {
        if (key !== "redirect") {
          // formData.append("email", data.email);
          // formData.append("customerName", data.customerName);
          // formData.append("mobileNumber", data.mobileNumber);
          // if (key !== "redirect") {
          formData.append(key, data[key]);
        }
      }
      return await addJobCard(formData);
      // return await addEmiratesData(formData);
    },
    onSuccess: (res) => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      // toast.success(res?.message);
      toast.success("Step 1 completed Successfully");
    },
    onError: (error) => {
      console.error("Error in mutation:", error);
      toast.error(error?.message || "An error occurred. Please try again.");
    },
  });

  const extractCarMutation = useMutation({
    mutationKey: ["extractCar"],
    mutationFn: async (formData) => {
      setLoadingCarExtract(true);
      return await extractCarAction(formData);
    },
    onSuccess: (response) => {
      toast.success("Registration Card File uploaded successfully.");
      setExctractCarData(response);
      setApiCalled(true);
      setLoadingCarExtract(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
      setLoadingCarExtract(false);
    },
  });
  const updatePostMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();

      formData.append(
        "drivingLicenseLink",
        drivingData?.fileUrl?.path ? drivingData?.fileUrl?.path : ""
      );
      formData.append(
        "emirateIdLink",
        emiratesData?.fileUrl?.path ? emiratesData?.fileUrl?.path : ""
      );
      formData.append(
        "registrationCard",
        exctractCarData?.fileUrl?.path ? exctractCarData?.fileUrl?.path : ""
      );
      formData.append("insuranceCompanyId", currentInsId ? currentInsId : "");

      for (const key in data) {
        if (key === "carDetails" || key === "insuranceDetails") {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === "documents" && activeStep === 3) {
          // Handle documents as binary files
          if (key === "documents") {
            if (
              data?.documents?.policeReport &&
              data?.documents?.policeReport?.length > 0
            ) {
              formData.append(
                "policeReport",
                data?.documents?.policeReport?.[0]
                  ? data?.documents?.policeReport?.[0]
                  : ""
              );
            }
            if (beforePhotosList && beforePhotosList?.length > 0) {
              Array.from(beforePhotosList).forEach((photo) => {
                formData.append("beforePhotos", photo);
              });
            }
          }
        } else if (key !== "redirect") {
          formData.append(key, data[key]);
        }
      }
      // Set the statusToSend based on the provided status
      if (activeStep === 3) {
        const statusToSend =
          !jobcardData?.status || jobcardData?.status === "Draft"
            ? "In-Progress"
            : jobcardData?.status;
        formData.append("status", statusToSend);
        if (CREATED_USER_ROLE === "employee" && CREATED_USER_ID) {
          formData.append("assignedEmployeeId", CREATED_USER_ID);
        }
      }
      return await updateJobCardAction(jobCardId, formData);
    },
    onSuccess: (response, { redirect }) => {
      if (activeStep === 0) {
        toast.success("Step 1 Completed Successfully");
      } else if (activeStep === 1) {
        toast.success("Step 2 Completed Successfully");
      } else if (activeStep === 2) {
        toast.success("Step 3 Completed Successfully");
      }
      if (activeStep !== 3) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
      if (redirect) {
        if (paramId) {
          toast.success(response?.message);
          router.push("/jobcard-list");
        } else {
          toast.success("Jobcard Created Successfully");
          router.push("/jobcard-list");
        }
      }
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  const onSubmit = async (data, redirect = false) => {
    try {
      if (activeStep === 0) {
        if (paramId || jobCardId) {
          await updatePostMutation.mutateAsync({
            ...data,
            redirect,
          });
        } else {
          const response = await mutation.mutateAsync(data);
          setJobCardId(response.data._id);
        }
      } else if (activeStep === 1 || activeStep === 2 || activeStep === 3) {
        await updatePostMutation.mutateAsync({ ...data, redirect });
      }
    } catch (error) {
      console.error("Error:", error?.data?.message);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    reset();
    setActiveStep(0);
    setResetTrigger(!resetTrigger);
  };

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    setDefaultDate(formattedDate);
  }, []);

  useEffect(() => {
    setValue("startDate", defaultDate);
    setValue("endDate", defaultDate);
    setValue("insuranceDetails.insuranceExpiryDate", defaultDate);
  }, [defaultDate]);

  const handleDeleteFile = (index) => {
    const updatedPreviews = [...filePreviews];
    updatedPreviews.splice(index, 1);
    setFilePreviews(updatedPreviews);
  };

  const handleDeleteFile1 = (index) => {
    const updatedPreviews = [...filePreviews1];
    updatedPreviews.splice(index, 1);
    setFilePreviews1(updatedPreviews);
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    const filePreviews = [];
    const binaryFiles = [];

    setPoliceReportImg(files);

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const filePreview = e.target.result;
        filePreviews.push(filePreview);
        setFilePreviews([...filePreviews]);

        // Convert file to binary data
        const file = files[i];
        const binaryReader = new FileReader();
        binaryReader.readAsArrayBuffer(file);
        binaryReader.onload = () => {
          const binaryData = binaryReader.result;
          binaryFiles.push(binaryData);
          setBinaryFiles([...binaryFiles]);
        };
      };

      reader.readAsDataURL(files[i]);
    }
  };
  const handleFileChange2 = (event) => {
    const files = event.target.files;
    const filePreviews1 = [];
    setBeforePhotosImg(files);

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const filePreview = e.target.result;
        filePreviews1.push(filePreview);
        setFilePreviews1([...filePreviews1]);

        // Convert file to binary data
        const file = files[i];
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
          const binaryData = reader.result;
        };
      };

      reader.readAsDataURL(files[i]);
    }
  };
  const registrationCard = {
    control,
    name: "registrationCard",
  };

  const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];
  const stepDescriptions = [
    "Customer Details",
    "Car & Insuranse Details",
    "JobCard Data",
    "Documents Upload",
  ];
  // Emirates Id Extraction
  const extractEmiratesMutation = useMutation({
    mutationKey: ["extractEmirates"],
    mutationFn: async (formData) => {
      setLoadingoverlay(true);
      return await addEmiratesData(formData);
    },
    onSuccess: (res) => {
      toast.success("File uploaded successfully.");
      setEmiratesData(res);
      setLoadingoverlay(false);
    },
    onError: (error) => {
      toast.error("File upload failed.");
      setLoadingoverlay(false);
    },
  });

  const handleEmirateData = (files) => {
    // console.log(typeof files[0], files[0], "value inside value");

    if (
      files &&
      files.length > 0 &&
      !emiratesApi &&
      typeof files[0] === "object"
    ) {
      const formData = new FormData();
      formData.append("emiratesId", files[0]);
      extractEmiratesMutation.mutate(formData);
      setEmiratesApi(true);
    } else if (!files || files.length === 0) {
      setEmiratesData(null);
      setEmiratesApi(false);
    }
  };
  const handleDrivingIdData = (files) => {
    if (
      files &&
      files.length > 0 &&
      !drivingApi &&
      typeof files[0] === "object"
    ) {
      const formData = new FormData();
      formData.append("drivingLicense", files[0]);
      extractDrivingMutation.mutate(formData);
      setDrivingApi(true);
    } else if (!files || files.length === 0) {
      setDrivingData(null);
      setDrivingApi(false);
    }
  };
  const handleCarRcIdData = (files) => {
    if (
      files &&
      files.length > 0 &&
      !apiCalled &&
      typeof files[0] === "object"
    ) {
      const formData = new FormData();
      formData.append("registrationCard", files[0]);
      extractCarMutation.mutate(formData);
      setApiCalled(true);
    } else if (!files || files.length === 0) {
      setExctractCarData(null);
      setApiCalled(false);
    }
  };
  useEffect(() => {
    if (extractCarMutation.isSuccess && exctractCarData) {
      // Set default values for your form fields
      setValue("carDetails.carId", exctractCarData?.data?.carId);
      setValue("carDetails.year", exctractCarData?.data?.year);
      setValue("carDetails.trim", exctractCarData?.data?.trim);
      // setValue("carDetails.make", exctractCarData?.data?.brand);
      // setValue("carDetails.plateCode", exctractCarData?.data?.plateCode);
      setValue("carDetails.chassisNo", exctractCarData?.data?.chesisNo);
      setValue("carDetails.plateNumber", exctractCarData?.data?.plateNumber);
      // setValue("insuranseCompanyId", { value: exctractCarData.currentInsurer, label: exctractCarData.currentInsurer }); // Assuming you're using react-select and "currentInsurer" corresponds to the value and label of the option
      setValue(
        "insuranceDetails.currentInsurance",
        exctractCarData.data?.currentInsurer
      );
    }
  }, [extractCarMutation.isSuccess, exctractCarData]);
  // console.log(emiratesData, "emiratesData");
  const isDisabled = isEmiratesIdSet || !!paramId;
  useEffect(() => {
    if (extractEmiratesMutation.isSuccess && emiratesData) {
      const customerEmiratesId = emiratesData?.data?.emiratesId;
      setValue("fullName", emiratesData?.data?.fullName);
      setValue("customerEmiratesId", customerEmiratesId);
      setIsEmiratesIdSet(!!customerEmiratesId);
    }
  }, [extractEmiratesMutation.isSuccess, emiratesData]);

  // Driving License Extraction
  const extractDrivingMutation = useMutation({
    mutationKey: ["extractDriving"],
    mutationFn: async (formData) => {
      setLoadingDriving(true);
      return await addLicenceData(formData);
    },
    onSuccess: (res) => {
      // toast.success("Driving License file uploaded successfully.");
      setDrivingData(res);
      setLoadingDriving(false);
    },
    onError: (error) => {
      toast.error("Driving License file upload failed.");
      setLoadingDriving(false);
    },
  });
  useEffect(() => {
    if (extractDrivingMutation.isSuccess && drivingData) {
      const formatDate = (dateString) =>
        dateString ? new Date(dateString).toISOString().split("T")[0] : "";

      const licenceIssueDate = formatDate(drivingData?.data?.licenceIssueDate);
      const licenceExpiryDate = formatDate(
        drivingData?.data?.licenceExpiryDate
      );
      const drivingFullName = drivingData?.data?.fullName;
      const emiratesFullName = emiratesData?.data?.fullName;

      if (emiratesFullName) {
        if (ratio(drivingFullName, emiratesFullName) > 80) {
          setValue("fullName", drivingFullName);
        } else {
          toast.error(
            "The full name from driving data does not match with Emirates data."
          );
        }
      } else {
        setValue("fullName", drivingFullName);
      }
      setValue("licenceIssueDate", licenceIssueDate);
      setValue("licenceNo", drivingData?.data?.licenceNo);
      setValue("licenceExpiryDate", licenceExpiryDate);
      setValue("tcNo", drivingData?.data?.dlTcNo);
    }
  }, [extractDrivingMutation.isSuccess, drivingData]);

  useEffect(() => {
    if (jobcardData && paramId) {
      const {
        customerId,
        carId,
        insuranceDetails,
        details,
        status,
        documents,
        dateOfAccident,
        isFault,
        insuranceCompany,
      } = jobcardData;

      const formatDate = (dateString) =>
        dateString ? new Date(dateString).toISOString().split("T")[0] : "";
      const licenceIssueDate = formatDate(
        customerId?.documentsDetails?.licenceIssueDate
      );
      const licenceExpiryDate = formatDate(
        customerId?.documentsDetails?.licenceExpiryDate
      );
      const insuranceExpiryDate = formatDate(
        insuranceDetails?.insuranceExpiryDate
      );
      const dateOfAccidentformat = formatDate(dateOfAccident);

      const { drivingLicense, emirateId } = customerId.documents;
      setValue("email", customerId?.email);
      setValue("fullName", customerId?.fullName);
      setValue("mobileNumber", customerId?.mobileNumber);
      setValue("customerEmiratesId", customerId?.customerEmiratesId);
      setValue("licenceNo", customerId?.documentsDetails?.licenceNo);
      setValue("tcNo", customerId?.documentsDetails?.tcNo);
      setValue("licenceIssueDate", licenceIssueDate);
      setValue("licenceExpiryDate", licenceExpiryDate);

      if (carId) {
        const { registrationCard } = carId?.documents;
        setValue("carDetails.make", carId?.make);

        handleMakeChange(carId?.make);
        handleModelChange(carId?.model, carId?.make);

        setValue("carDetails.model", carId?.model);
        setValue("carDetails.trim", carId?.trim);

        setValue("carDetails.year", carId?.year);
        setValue("carDetails.plateNumber", carId?.plateNumber);
        // setValue("carDetails.plateCode", carId?.plateCode);
        setValue("carDetails.chassisNo", carId?.chassisNo);
        setValue(
          "registrationCard",
          registrationCard ? [registrationCard] : []
        );

        // setValue("carDetails.carBrand", carId?.carBrand);
      }
      setValue(
        "insuranceDetails.currentInsurance",
        insuranceDetails?.currentInsurance
      );
      setCurrentInsId(insuranceCompany?._id);
      setValue("insuranceDetails.insuranceExpiryDate", insuranceExpiryDate);
      setValue("dateOfAccident", dateOfAccidentformat);
      setValue("isFault", isFault);
      setValue("details", details);
      setValue("status", status);

      // setValue("emiratesId", [customerId?.documents?.emirateId]);
      // setValue("drivingId", [customerId?.documents?.drivingLicense]);
      setValue("drivingId", drivingLicense ? [drivingLicense] : []);
      setValue("emiratesId", emirateId ? [emirateId] : []);

      // setValue("registrationCard", [carId?.registrationCard]);
      if (documents) {
        if (documents?.beforePhotos?.[0]) {
          setValue("documents.beforePhotos", documents.beforePhotos[0]);
        }
        if (documents?.policeReport[0]) {
          setValue("documents.policeReport", documents.policeReport[0]);
        }
      }
    }
  }, [jobcardData]);

  const { mutate, isLoading:UpdateLoading } = updatePostMutation;

  return (
    <div>
      {(loadingoverlay || loadingDriving || loadingCarExtract) && (
        <div
          id="overlay"
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 51,
          }}
        >
          <div className="flex items-center justify-center w-screen h-full">
            <LayoutLoader />
          </div>
        </div>
      )}
      <div className="">
        <ClickableStep
          activeStep={activeStep}
          steps={steps}
          stepDescriptions={stepDescriptions}
        />
      </div>
      <div className="invoice-wrapper mt-6">
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12">
            <CardHeader className="sm:flex-row sm:items-center gap-3">
              <div className="flex-1 text-xl font-medium text-default-700 whitespace-nowrap">
                {paramId ? "Update Jobcard - " : `Create Jobcard - `}
                {activeStep === 0 && <span>{stepDescriptions[0]}</span>}
                {activeStep === 1 && <span>{stepDescriptions[1]}</span>}
                {activeStep === 2 && <span>{stepDescriptions[2]}</span>}
                {activeStep === 3 && <span>{stepDescriptions[3]}</span>}
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7">
              <CardContent className="flex flex-wrap gap-4">
                {activeStep === 0 && (
                  <>
                    <div className="w-full flex flex-wrap justify-between gap-4 pb-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Document Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-row flex-wrap gap-4 w-full justify-between">
                              <div className="lg:w-[48%]">
                                <div>
                                  <Label
                                    htmlFor="emiratesId"
                                    className="block mb-3 "
                                  >
                                    Emirates ID
                                  </Label>
                                  <Controller
                                    name="emiratesId"
                                    control={control}
                                    rules={{
                                      required: "Emirates ID is required",
                                    }}
                                    render={({
                                      field: { onChange, value },
                                    }) => (
                                      <FileUploaderMultiple
                                        value={value}
                                        onChange={(files) => {
                                          onChange(files);
                                          handleEmirateData(files);
                                        }}
                                        name="emiratesId"
                                        textname="ID"
                                        errors={errors}
                                        width={150}
                                        height={150}
                                        resetTrigger={resetTrigger}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="lg:w-[48%]">
                                <Label
                                  htmlFor="drivingId"
                                  className="block mb-3 "
                                >
                                  Driving License
                                </Label>
                                <Controller
                                  name="drivingId"
                                  control={control}
                                  rules={{
                                    required: "Driving ID is required",
                                  }}
                                  render={({ field: { onChange, value } }) => (
                                    <FileUploaderMultiple
                                      value={value}
                                      onChange={(files) => {
                                        onChange(files);
                                        handleDrivingIdData(files);
                                      }}
                                      height={150}
                                      width={150}
                                      textname="License"
                                      name="drivingId"
                                      errors={errors}
                                      resetTrigger={resetTrigger}
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Customer Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="w-full flex flex-wrap justify-between gap-4">
                              <div className="w-full lg:w-[48%] space-y-4">
                                <div>
                                  <Label htmlFor="fullName">
                                    Customer Name
                                  </Label>
                                  <div className="flex  flex-col gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="fullName"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="text"
                                          placeholder="Customer name"
                                          size="lg"
                                          id="fullName"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.fullName && (
                                      <span className="text-red-700">
                                        {errors.fullName.message}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <div className="flex flex-col  gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="email"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="text"
                                          placeholder="Email"
                                          size="lg"
                                          id="email"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.email && (
                                      <span className="text-red-700">
                                        {errors.email.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label>Mobile no</Label>

                                  <Controller
                                    control={control}
                                    name="mobileNumber"
                                    defaultValue=""
                                    render={({ field }) => (
                                      <Input
                                        type="text"
                                        placeholder="Mobile No"
                                        size="lg"
                                        id="mobileNumber"
                                        {...field}
                                      />
                                    )}
                                  />
                                  {errors.mobileNumber && (
                                    <span className="text-red-700">
                                      {errors.mobileNumber.message}
                                    </span>
                                  )}
                                </div>
                                <div className="">
                                  <Label htmlFor="customerEmiratesId">
                                    Emirate ID
                                  </Label>

                                  <Controller
                                    control={control}
                                    name="customerEmiratesId"
                                    defaultValue=""
                                    render={({ field }) => (
                                      <Input
                                        type="text"
                                        placeholder="Emirate ID"
                                        size="lg"
                                        id="customerEmiratesId"
                                        {...field}
                                        disabled={isDisabled}
                                      />
                                    )}
                                  />
                                  {errors.customerEmiratesId && (
                                    <span className="text-red-700">
                                      {errors.customerEmiratesId.message}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="w-full lg:w-[48%] space-y-4">
                                <div>
                                  <Label htmlFor="licenceNo">
                                    Driving License Number
                                  </Label>
                                  <div className="flex flex-col  gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="licenceNo"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="text"
                                          placeholder="License Number"
                                          size="lg"
                                          id="licenceNo"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.licenceNo && (
                                      <span className="text-red-700">
                                        {errors.licenceNo.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="licenceIssueDate">
                                    Driving License Issue
                                  </Label>
                                  <div className="flex flex-col gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="licenceIssueDate"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="date"
                                          placeholder="Driving License Issue"
                                          size="lg"
                                          id="licenceIssueDate"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.licenceIssueDate && (
                                      <span className="text-red-700">
                                        {errors.licenceIssueDate.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="licenceExpiryDate">
                                    Driving License Expiry
                                  </Label>
                                  <div className="flex flex-col gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="licenceExpiryDate"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="date"
                                          placeholder="Driving License Expiry"
                                          size="lg"
                                          id="licenceExpiryDate"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.licenceExpiryDate && (
                                      <span className="text-red-700">
                                        {errors.licenceExpiryDate.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="tcNo">TC Number</Label>
                                  <div className="flex flex-col gap-2 w-full">
                                    <Controller
                                      control={control}
                                      name="tcNo"
                                      defaultValue=""
                                      render={({ field }) => (
                                        <Input
                                          type="text"
                                          placeholder="TC number"
                                          size="lg"
                                          id="tcNo"
                                          {...field}
                                        />
                                      )}
                                    />
                                    {errors.tcNo && (
                                      <span className="text-red-700">
                                        {errors.tcNo.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}

                {activeStep === 1 && (
                  // Car Details & Insurance Details
                  <>
                    <div className="w-full flex flex-wrap justify-between gap-4 pb-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Document Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-row flex-wrap gap-4 w-full justify-between">
                              <div className="lg:w-[48%]">
                                <div>
                                  <Label
                                    htmlFor="registrationCard"
                                    className="block mb-3 "
                                  >
                                    Car Registration Card
                                  </Label>
                                  <Controller
                                    name="registrationCard"
                                    control={control}
                                    rules={{
                                      required: "Registration Card is required",
                                    }}
                                    render={({
                                      field: { onChange, value },
                                    }) => (
                                      <FileUploaderMultiple
                                        value={value}
                                        onChange={(files) => {
                                          onChange(files);
                                          handleCarRcIdData(files);
                                        }}
                                        name="registrationCard"
                                        textname="Car RC"
                                        errors={errors}
                                        width={150}
                                        height={150}
                                        resetTrigger={resetTrigger}
                                      />
                                    )}
                                  />
                                  {extractCarMutation.isLoading && (
                                    <p>Loading...</p>
                                  )}
                                  {extractCarMutation.isError && (
                                    <p>
                                      Error: {extractCarMutation.error.message}
                                    </p>
                                  )}
                                  {extractCarMutation.isSuccess && (
                                    <p>File uploaded successfully.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Car Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-col flex-wrap gap-4 w-full lg:w-[45%] justify-between">
                              {/* year */}
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="carYear">Year</Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="text"
                                        placeholder="carYear"
                                        {...register("carDetails.year")}
                                        size="lg"
                                        id="year"
                                        className={cn("w-full", {
                                          "border-destructive":
                                            errors.carDetails?.year,
                                        })}
                                      />
                                    </div>
                                    {errors.carDetails?.year && (
                                      <div className="text-red-500 mt-2">
                                        {errors.carDetails.year.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* make */}
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="carDetails.make">
                                      Make
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Controller
                                        name="carDetails.make"
                                        control={control}
                                        render={({
                                          field: { onChange, value },
                                        }) => (
                                          <Select
                                            className="react-select w-full"
                                            classNamePrefix="select"
                                            id="carDetails.make"
                                            styles={styles}
                                            options={formattedCarData}
                                            onChange={(selectedOption) => {
                                              onChange(selectedOption.value); // Assuming selectedOption is { value, label }
                                              handleMakeChange(
                                                selectedOption.value
                                              );
                                            }}
                                            value={formattedCarData?.find(
                                              (option) => option.value === value
                                            )}
                                          />
                                        )}
                                      />
                                    </div>
                                    {errors.carDetails?.make && (
                                      <div className="text-red-500 mt-2">
                                        {errors.carDetails.make.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* model */}
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="carDetails.model">
                                      Model
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Controller
                                        name="carDetails.model"
                                        control={control}
                                        render={({
                                          field: { onChange, value },
                                        }) => (
                                          <Select
                                            className="react-select w-full"
                                            classNamePrefix="select"
                                            id="carDetails.model"
                                            styles={styles}
                                            options={carModelLists?.map(
                                              (model) => ({
                                                value: model,
                                                label: model,
                                              })
                                            )}
                                            onChange={(selectedOption) => {
                                              onChange(selectedOption.value); // Assuming selectedOption is { value, label }
                                              handleModelChange(
                                                selectedOption.value
                                              );
                                            }}
                                            value={{
                                              value: carModelLists?.find(
                                                (option) => option === value
                                              ),
                                              label: carModelLists?.find(
                                                (option) => option === value
                                              ),
                                            }}
                                            isDisabled={!selectedMake}
                                          />
                                        )}
                                      />
                                      {/* <Input
                                        type="text"
                                        placeholder="model"
                                        {...register("carDetails.model")}
                                        size="lg"
                                        id="model"
                                        className={cn("w-full", {
                                          "border-destructive":
                                            errors.carDetails?.model,
                                        })}
                                      /> */}
                                    </div>
                                    {errors.carDetails?.model && (
                                      <div className="text-red-500 mt-2">
                                        {errors.carDetails.model.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* trim */}
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="trim">Trim</Label>
                                    <div className="flex gap-2 w-full">
                                      <Controller
                                        name="carDetails.trim"
                                        control={control}
                                        render={({
                                          field: { onChange, value },
                                        }) => (
                                          <Select
                                            className="react-select w-full"
                                            classNamePrefix="select"
                                            id="carDetails.trim"
                                            styles={styles}
                                            options={carTrimLists?.map(
                                              (trim) => ({
                                                value: trim,
                                                label: trim,
                                              })
                                            )}
                                            onChange={(selectedOption) => {
                                              onChange(selectedOption.value);
                                            }}
                                            value={{
                                              value: carTrimLists?.find(
                                                (option) => option === value
                                              ),
                                              label: carTrimLists?.find(
                                                (option) => option === value
                                              ),
                                            }}
                                            isDisabled={!selectedModel} // Disable the trim select if no model is selected
                                          />
                                        )}
                                      />
                                    </div>
                                    {errors.carDetails?.trim && (
                                      <div className="text-red-500 mt-2">
                                        {errors.carDetails?.trim.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col flex-wrap w-full lg:w-[45%] gap-4">
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="chassisNo">
                                      Chassis No
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="text"
                                        placeholder="Chassis No"
                                        size="lg"
                                        {...register("carDetails.chassisNo")}
                                        id="chassisNo"
                                        className={cn("w-full", {
                                          "border-red-500":
                                            errors?.carDetails?.chassisNo,
                                        })}
                                      />
                                    </div>
                                    {errors.carDetails?.chassisNo && (
                                      <div className="text-red-500 mt-2">
                                        {errors?.carDetails?.chassisNo?.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="plateNumber">
                                      Plate Number
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="text"
                                        placeholder="Plate Number"
                                        size="lg"
                                        id="plateNumber"
                                        {...register("carDetails.plateNumber")}
                                        className={cn("w-full", {
                                          "border-red-500":
                                            errors.carDetails?.plateNumber,
                                        })}
                                      />
                                    </div>
                                    {errors.carDetails?.plateNumber && (
                                      <div className="text-red-500 mt-2">
                                        {errors.carDetails.plateNumber.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className=" border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Insurance Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-col flex-wrap w-full lg:w-[45%] gap-4 justify-between">
                              <div className="w-full space-y-4">
                                <div>
                                  <Label htmlFor="insuranceDetails.currentInsurance">
                                    Current Insurer
                                  </Label>
                                  <div className="flex gap-2 w-full">
                                    <Controller
                                      name="insuranceDetails.currentInsurance"
                                      control={control}
                                      render={({
                                        field: { onChange, value },
                                      }) => (
                                        <Select
                                          className="react-select w-full"
                                          classNamePrefix="select"
                                          id="insuranceDetails.currentInsurance"
                                          styles={styles}
                                          name="clear"
                                          options={InsuranseCompanyList}
                                          onChange={(selectedOption) => {
                                            onChange(selectedOption?.value);
                                            setCurrentInsId(selectedOption?.id);
                                          }}
                                          // onChange={(selectedOption) => {
                                          //   onChange({ companyName: selectedOption.value, companyId: selectedOption.id });
                                          // }}
                                          value={InsuranseCompanyList?.find(
                                            (option) => option?.value === value
                                          )}
                                        />
                                      )}
                                    />
                                    {/* <Input
                                      type="text"
                                      placeholder="Current Insurer"
                                      {...register(
                                        "insuranceDetails.currentInsurance"
                                      )}
                                      size="lg"
                                      id="insuranceDetails.currentInsurance"
                                      className={cn("w-full", {
                                        "border-destructive":
                                          errors?.insuranceDetails
                                            ?.currentInsurance,
                                      })}
                                    /> */}
                                  </div>
                                  {errors?.insuranceDetails
                                    ?.currentInsurance && (
                                    <div className="text-destructive mt-2">
                                      {
                                        errors?.insuranceDetails
                                          ?.currentInsurance.message
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* <div className="w-full space-y-4">
                                <div>
                                  <Label htmlFor="insuranceDetails.insuranceType">
                                    Insurance Type
                                  </Label>
                                  <div className="flex gap-2 w-full">
                                    <Input
                                      type="text"
                                      placeholder="Insurance Type"
                                      {...register(
                                        "insuranceDetails.insuranceType"
                                      )}
                                      size="lg"
                                      id="insuranceDetails.insuranceType"
                                      className={cn("w-full", {
                                        "border-destructive":
                                          errors?.insuranceDetails
                                            ?.insuranceType,
                                      })}
                                    />
                                  </div>
                                  {errors?.insuranceDetails?.insuranceType && (
                                    <div className="text-destructive mt-2">
                                      {
                                        errors?.insuranceDetails?.insuranceType
                                          .message
                                      }
                                    </div>
                                  )}
                                </div>
                              </div> */}
                              <div className="w-full space-y-4">
                                <div>
                                  <Label htmlFor="insuranceDetails.insuranceExpiryDate">
                                    Insurance Expiry Date
                                  </Label>
                                  <div className="flex gap-2 w-full">
                                    <Input
                                      type="date"
                                      placeholder="Expiry Date"
                                      {...register(
                                        "insuranceDetails.insuranceExpiryDate"
                                      )}
                                      size="lg"
                                      defaultValue={defaultDate}
                                      id="insuranceDetails.insuranceExpiryDate"
                                      className={cn("w-full", {
                                        "border-destructive":
                                          errors?.insuranceDetails
                                            ?.insuranceExpiryDate,
                                      })}
                                    />
                                  </div>
                                  {errors?.insuranceDetails
                                    ?.insuranceExpiryDate && (
                                    <div className="text-destructive mt-2">
                                      {
                                        errors?.insuranceDetails
                                          ?.insuranceExpiryDate.message
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
                {activeStep === 2 && (
                  <>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Job Details
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-col flex-wrap gap-4 w-full lg:w-[45%] justify-between">
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="details">Notes</Label>
                                    <div className="flex gap-2 w-full">
                                      <Textarea
                                        placeholder="Notes..."
                                        {...register("details")}
                                        id="details"
                                        className={cn("w-full", {
                                          "border-destructive": errors.details,
                                        })}
                                      />
                                    </div>
                                    {errors.details && (
                                      <div className="text-red-500 mt-2">
                                        {errors.details.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="startDate">
                                      Start Date
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="date"
                                        placeholder="Start Date"
                                        {...register("startDate")}
                                        size="lg"
                                        defaultValue={defaultDate}
                                        id="startDate"
                                        className={cn("w-full", {
                                          "border-destructive":
                                            errors.startDate,
                                        })}
                                      />
                                    </div>
                                    {errors.startDate && (
                                      <div className="text-destructive mt-2">
                                        {errors.startDate.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* <div className="w-full flex flex-wrap justify-between gap-4"> */}
                              {/* <div className="w-full lg:w-[48%] space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Controller
                                  name="status"
                                  control={control}
                                  defaultValue="Draft"
                                  render={({ field: { onChange, value } }) => (
                                    <Select
                                      className="react-select"
                                      classNamePrefix="select"
                                      id="status"
                                      options={StatusList}
                                      onChange={(selectedOption) =>
                                        onChange(selectedOption.value)
                                      }
                                      value={
                                        StatusList.find(
                                          (option) => option.value === value
                                        ) || {
                                          value: "Draft",
                                          label: "Draft",
                                        }
                                      }
                                      isDisabled={!paramId}
                                    />
                                  )}
                                />
                              </div> */}
                            </div>
                            {/* assigned to come here */}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
                {activeStep === 3 && (
                  <>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Documents Upload
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-col flex-wrap gap-4 w-full lg:w-[45%] justify-between">
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="documents.policeReport">
                                      Police Report Upload
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="file"
                                        {...register("documents.policeReport", {
                                          required: "Police report is required",
                                        })}
                                        required
                                        onChange={handleFileChange}
                                        size="lg"
                                        id="documents.policeReport"
                                        className={cn("w-full", {
                                          "border-destructive":
                                            errors.documents?.policeReport,
                                        })}
                                        multiple // Allow multiple files to be selected
                                      />
                                    </div>
                                    {errors?.documents?.policeReport && (
                                      <div className="text-red-500 mt-2">
                                        {
                                          errors?.documents?.policeReport
                                            ?.message
                                        }
                                      </div>
                                    )}

                                    {jobcardData?.documents
                                      ?.policeReport?.[0] &&
                                      filePreviews?.length === 0 && (
                                        <>
                                          <img
                                            src={
                                              jobcardData?.documents
                                                ?.policeReport?.[0]
                                            }
                                            alt={`File Preview`}
                                            className="mt-2 w-32 h-32 object-cover"
                                          />
                                        </>
                                      )}
                                    {filePreviews?.length > 0 && (
                                      <div className="mt-2 grid grid-cols-3 gap-2">
                                        {filePreviews?.map((preview, index) => (
                                          <div key={index} className="relative">
                                            <img
                                              src={preview}
                                              alt={`File Preview ${index + 1}`}
                                              className="w-32 h-32 object-cover"
                                            />
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteFile(index);
                                              }}
                                              className="absolute top-0 left-0 p-1 bg-red-500 rounded-full text-white"
                                            >
                                              X
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col flex-wrap gap-4 w-full lg:w-[45%] justify-between">
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="dateOfAccident">
                                      Accident Date
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="date"
                                        placeholder="Accident Date"
                                        {...register("dateOfAccident")}
                                        size="lg"
                                        defaultValue={defaultDate}
                                        id="dateOfAccident"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <div className="w-full space-y-4">
                                      <div className="w-full lg:w-full">
                                        <div className="flex items-center h-5">
                                          <Controller
                                            name="isFault"
                                            control={control}
                                            render={({ field }) => (
                                              <input
                                                id="isFault"
                                                type="checkbox"
                                                className="border-gray-200 h-6 w-6 disabled:opacity-50 accent-[#30D5C7] checked:bg-[#30D5C7] rounded-sm text-white mr-2"
                                                {...field}
                                                checked={field.value || false}
                                              />
                                            )}
                                          />
                                          <label htmlFor="isFault">
                                            At Fault
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-between gap-4">
                      <div className="w-full lg:w-full space-y-4">
                        <Card className="border">
                          <CardHeader className="flex flex-row items-center gap-3 font-bold">
                            Photo Upload
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4 justify-between w-full">
                            <div className="flex flex-col flex-wrap gap-4 w-full lg:w-[45%] justify-between">
                              <div className="w-full space-y-4">
                                <div className="w-full lg:w-full">
                                  <div>
                                    <Label htmlFor="documents.beforePhotos">
                                      Upload Photo
                                    </Label>
                                    <div className="flex gap-2 w-full">
                                      <Input
                                        type="file"
                                        {...register("documents.beforePhotos")}
                                        onChange={handleFileChange2}
                                        size="lg"
                                        id="documents.beforePhotos"
                                        className={cn("w-full", {
                                          "border-destructive":
                                            errors.documents?.beforePhotos,
                                        })}
                                        multiple // Allow multiple files to be selected
                                      />
                                    </div>
                                    {errors?.documents?.beforePhotos && (
                                      <div className="text-red-500 mt-2">
                                        {
                                          errors?.documents?.beforePhotos
                                            ?.message
                                        }
                                      </div>
                                    )}
                                    {jobcardData?.documents?.beforePhotos
                                      ?.length > 0 && (
                                      <div className="mt-2 grid grid-cols-3 gap-2">
                                        {jobcardData?.documents?.beforePhotos?.map(
                                          (photo, index) => (
                                            <div
                                              key={index}
                                              className="relative"
                                            >
                                              <img
                                                src={photo}
                                                alt={`File Preview ${
                                                  index + 1
                                                }`}
                                                className="w-32 h-32 object-cover"
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}

                                    {filePreviews1?.length > 0 && (
                                      <div className="mt-2 grid grid-cols-3 gap-2">
                                        {filePreviews1?.map(
                                          (preview, index) => (
                                            <div
                                              key={index}
                                              className="relative"
                                            >
                                              <img
                                                src={preview}
                                                alt={`File Preview ${
                                                  index + 1
                                                }`}
                                                className="w-32 h-32 object-cover"
                                              />
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  handleDeleteFile1(index);
                                                }}
                                                className="absolute top-0 left-0 p-1 bg-red-500 rounded-full text-white"
                                              >
                                                X
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-4 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  className={cn({
                    hidden: activeStep === 0,
                  })}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    if (activeStep === 0 && !jobCardId) {
                      handleSubmit((data) => onSubmit(data, false))(); // Submit the form for the first step without redirect
                    } else if (activeStep === 0 && paramId) {
                      handleSubmit((data) => onSubmit(data, false))();
                      // setActiveStep((prevActiveStep) => prevActiveStep + 1);
                    } else {
                      handleSubmit((data) => onSubmit(data, false))();
                      // setActiveStep((prevActiveStep) => prevActiveStep + 1);
                    }
                  }}
                  className={cn("ml-auto", {
                    hidden: activeStep >= 3,
                  })}
                >
                  Next
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit((data) => onSubmit(data, true))(); // Submit the form for the final step with redirect
                  }}
                  className={cn("ml-auto", {
                    hidden: activeStep < 3,
                  })}
                >
                  {UpdateLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading ...
                    </div>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobCardPage;
