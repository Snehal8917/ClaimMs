"use client";
import { Fragment, useEffect, useState } from "react";

import {
  getAllQuotation,
  getAllAdQuotation,
  updateQuotation,
  deleteQuotation,
} from "@/action/quotationAction/quotation-action";
import BasicDataTable from "@/components/common/data-table/basic-table";
import DialogPlacement from "@/components/common/dialog/dialog-placement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdditionalQuotionView = ({ jobcardData }) => {
  const params = useParams();
  const jobCardIEd = params?.view_jobcard;
  const statusOptions = ["Approved", "Pending", "Declined", "Draft"];
  //
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quIDk, setquIDk] = useState("");
  const [searchString, setSearchString] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, error, refetch } = useQuery({
    queryKey: ["GetQuotation", pageIndex, pageSize, searchString],
    queryFn: () => {
      setTableLoading(true);
      return getAllAdQuotation({
        page: pageIndex + 1,
        size: pageSize,
        all: false,
        search: searchString,
        jobCardId: jobCardIEd,
      }).finally(() => {
        setTableLoading(false);
        setComponentLoading(false);
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      toast.success("Quotation deleted successfully");
      setModalOpen(false);
      setSelectedJobCard(null);
      queryClient.invalidateQueries({ queryKey: ["GetQuotation"] });
    },
    onError: (error) => {
      console.error("Error deleting quotation:", error);
      toast.error("Error deleting quotation");
    },
  });

  useEffect(() => {
    if (searchString.length > 2 || searchString.length === 0) {
      refetch();
    }
  }, [pageIndex, pageSize, searchString, refetch]);

  const handleEditClick = (jobCardId) => {
    router.push(`/additional-quotation/update/${jobCardId}`);
  };

  const handleViewClick = (jobCardId) => {
    router.push(`/additional-quotation/view/${jobCardId}`);
  };

  const handleDeleteClick = (jobCardId) => {
    setSelectedJobCard(jobCardId);
    setModalOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (selectedJobCard) {
      deleteMutation.mutate(selectedJobCard);
    }
  };

  ///

  const updateQuotationMutation = useMutation({
    mutationKey: ["updateQuotationMutation"],
    mutationFn: async (data) => {
      try {
        const formData = new FormData();
        formData.append("quotatioDetails", JSON.stringify(data));
        const quotaionsId = quIDk;
        const response = await updateQuotation(quotaionsId, formData);
        return response;
      } catch (error) {
        throw new Error(
          error.response?.data?.message || "Failed to update quotation"
        );
      }
    },
    onSuccess: (res) => {
      toast.success("Status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error?.message || "An error occurred. Please try again.");
    },
  });

  const handleStatusUpdate = (quotionId, newStatus) => {
    setquIDk(quotionId);
    const payload = {
      status: newStatus,
    };
    updateQuotationMutation.mutate(payload);
  };

  const handleReCreate = (quotationID) => {
    router.push(`/quotations/recreate/${quotationID}`);
  };

  const enable_Quotation = jobcardData?.status !== "Draft"

  //

  const columns = [
    {
      accessorKey: "additionalQuotesNumber",
      header: "Quotation ID",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3 items-center">
            <span className="whitespace-nowrap">
              {row?.original?.additionalQuotesNumber || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "daysToQuote",
      header: "Days To Complete",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3 items-center">
            <span className="whitespace-nowrap">
              {row?.original?.daysToQuote || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "jobCardNumber",
      header: "Job Card Number",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3 items-center">
            <span className="whitespace-nowrap">
              {row?.original?.jobCardId?.jobCardNumber || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
        <Badge
          variant="outline"
          color={
            (row?.original?.status === "Draft" && "default") ||
            (row?.original?.status === "Approved" && "success") ||
            (row?.original?.status === "Declined" && "warning") ||
            (row?.original?.status === "Pending" && "default")
          }
          className="capitalize"
        >
          {row?.original?.status || "-"}
        </Badge>
        </div>
      ),
      filterFn: (row, id, value) => {
        return value?.includes(row.getValue(id));
      },
    },
    {
      header: "Actions",
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const jobCardId = row?.original?._id;
        const statusBtn = row?.original?.status;
        return (
          <div className="flex gap-3 items-center justify-end">
            <Button
              size="icon"
              className="h-9 w-9 rounded bg-default-100 dark:bg-default-200 text-default-500 hover:text-primary-foreground"
              onClick={() => handleViewClick(jobCardId)}
            >
              <Icon icon="heroicons:eye" className="w-5 h-5" />
            </Button>
            {statusBtn !== "Pending" && statusBtn !== "Approved" && (
              <>
                {statusBtn !== "Declined" &&  statusBtn !== "Pending" &&(
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded bg-default-100 dark:bg-default-200 text-default-500 hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(jobCardId);
                    }}
                  >
                    <Icon icon="heroicons:pencil-square" className="w-5 h-5" />
                  </Button>
                )}
                {/* <Button
                  size="icon"
                  className="h-9 w-9 rounded bg-default-100 dark:bg-default-200 text-default-500 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(jobCardId);
                  }}
                >
                  <Icon icon="heroicons:trash" className="w-5 h-5" />
                </Button> */}
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (componentLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data</div>;
  }
  const quotations = data?.data?.allAdditionalWorkQuotes || [];

  return (
    <Fragment>
      <div className="mt-4 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Additional Quotations List</CardTitle>
              {enable_Quotation && 
              <Button asChild>
                  <Link href={`/additional-quotation/create/${jobCardIEd}`}>
                    <Plus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                    Create Additional Quotation
                  </Link>
                </Button>
                }
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <BasicDataTable
              data={quotations}
              columns={columns}
              filterPlaceHolder="Quotation Id"
              setSearchString={setSearchString}
              searchString={searchString}
              pageIndex={pageIndex}
              pagination={data?.pagination}
              pageSize={pageSize}
              setPageIndex={setPageIndex}
              setPageSize={setPageSize}
              pageCount={data?.pagination?.totalPages || 0}
              tableLoading={tableLoading}
              refetch={refetch}
              handleViewClick={handleViewClick}
              rowClickable
            />
          </CardContent>
        </Card>
      </div>
      <DialogPlacement
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onDelete={handleDeleteConfirm}
        message="Are you sure you want to delete this Quotation?"
      />
    </Fragment>
  );
};

export default AdditionalQuotionView;
