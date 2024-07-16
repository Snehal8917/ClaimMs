"use client";

import BasicDataTable from "@/components/common/data-table/basic-table";
import DialogPlacement from "@/components/common/dialog/dialog-placement";
import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import SkeletonPage from "@/components/common/skeleton-page";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";

import { useSession } from "next-auth/react";

import { getUserMeAction } from "@/action/auth-action";
import {
  getJobCardListAction,
  updateJobCardAction,
} from "@/action/employeeAction/jobcard-action";
import { Badge } from "@/components/ui/badge";
import { DeleteJobCard } from "@/config/companyConfig/jobcard.config";
import { useEffect } from "react";

const statusOptions = [
  "Pending",
  "In-Progress",
  "Approved",
  "Unpaid",
  "Paid",
  "Draft",
];
const statusOptions2 = ["Pending", "In-Progress", "Approved", "Unpaid", "Paid"];
const JobCardListPage = () => {
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectJobCard, setselectJobCard] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchString, setSearchString] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const role = session?.role;

  const isEmployee = role === "employee";
  const isCompany = role === "company";


  // useEffect(() => {
  //   if (router.isReady) {
  //     const { statusOpen } = router.query;
  //     console.log(statusOpen, "statusOpen");
  //     if (statusOpen) {
  //       console.log(statusOpen,"statusOpen");
  //       setStatus(statusOpen);
  //     }
  //   }
  // }, [router.isReady, router.query]);
  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ["userMe"],
    queryFn: () => getUserMeAction(session.jwt),
    enabled: !!session?.jwt, // Only run the query if the token is available
  });
  const CREATED_USER_ROLE = userData?.data?.userId?.designation;

  const PERMISSION_VIEW_JOBCARD =
    userData?.data?.userId?.permissionId?.jobCard?.view;
  const PERMISSION_CREATE_JOBCARD =
    userData?.data?.userId?.permissionId?.jobCard?.create;
  const PERMISSION_DELETE_JOBCARD =
    userData?.data?.userId?.permissionId?.jobCard?.delete;
  const PERMISSION_UPDATE_JOBCARD =
    userData?.data?.userId?.permissionId?.jobCard?.update;

  const canViewJobCard = isCompany || (PERMISSION_VIEW_JOBCARD && isEmployee);
  const canCreateJobCard =
    isCompany ||
    (PERMISSION_CREATE_JOBCARD && isEmployee && CREATED_USER_ROLE === "CSR");
  const canUpdateJobCard =
    isCompany || (PERMISSION_UPDATE_JOBCARD && isEmployee);
  const canDeleteJobCard =
    isCompany || (PERMISSION_DELETE_JOBCARD && isEmployee);

  const handleEditClick = (jobCardId) => {
    if (canUpdateJobCard) {
      handleInsuranceEdit(jobCardId);
    }
  };

  const handleDeleteClick = (jobCardId) => {
    if (canDeleteJobCard) {
      setselectJobCard(jobCardId);
      setModalOpen(true);
    }
  };
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      console.log(id, status, "updateStatusMutation");
      const formData = new FormData();
      formData.append("status", status ? status : "");
      return await updateJobCardAction(id, formData);
    },
    onSuccess: () => {
      toast.success("Job card status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    },
  });

  const handleStatusUpdate = (jobID, newStatus) => {
    updateStatusMutation.mutate({ id: jobID, status: newStatus });
    console.log(jobID, newStatus, "handleStatusUpdate");
  };
  const columns = [
    {
      accessorKey: "jobCardNumber",
      header: "job Card Number",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3  rtl:space-x-reverse items-center">
            <span className="whitespace-nowrap">
              {row?.original?.jobCardNumber || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Customer Name",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3  rtl:space-x-reverse items-center">
            <span className="whitespace-nowrap">
              {row?.original?.customerId?.fullName || "-"}
            </span>
          </div>
        </div>
      ),
    },

    {
      accessorKey: "email",
      header: "email",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3  rtl:space-x-reverse items-center">
            <span className="whitespace-nowrap">
              {row?.original?.customerId?.email || "-"}
            </span>
          </div>
        </div>
      ),
    },

    {
      accessorKey: "plateNumber",
      header: "plate Number",
      cell: ({ row }) => (
        <div className="font-medium text-card-foreground/80">
          <div className="flex space-x-3  rtl:space-x-reverse items-center">
            <span className="whitespace-nowrap">
              {row?.original?.carId?.plateNumber || "-"}
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
              (row?.original?.status === "Pending" && "default") ||
              (row?.original?.status === "Approved" && "success") ||
              (row?.original?.status === "Completed" && "info") ||
              (row?.original?.status === "Unpaid" && "warning") ||
              (row?.original?.status === "Paid" && "success")
            }
            className="capitalize"
          >
            {row?.original?.status || "-"}
          </Badge>
        </div>
        //   <Select
        //   value={row?.original?.status}
        //   onValueChange={(value, e) => {
        //     if (e) {
        //       e.stopPropagation();
        //     }
        //     handleStatusUpdate(row?.original?._id, value);
        //   }}
        //   disabled={row?.original?.status === "Draft"} // Disable the select if status is "Draft"
        // >
        //   <SelectTrigger className="w-[180px]">
        //     <SelectValue placeholder="Select a status" />
        //   </SelectTrigger>
        //   <SelectContent>
        //     {row?.original?.status === "Draft"
        //       ? statusOptions.map((status) => (
        //           <SelectItem key={status} value={status}>
        //             {status}
        //           </SelectItem>
        //         ))
        //       : statusOptions2.map((status) => (
        //           <SelectItem key={status} value={status}>
        //             {status}
        //           </SelectItem>
        //         ))}
        //   </SelectContent>
        // </Select>
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
        // console.log(row, "row into actions");
        const jobCardId = row?.original?._id;
        const handleStopPropagation = (e) => {
          e.stopPropagation();
        };

        return (
          <div className="flex gap-3 items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  color="secondary"
                  className=" h-7 rounded-full bg-transparent w-7 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
                >
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="h-6 w-6"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" avoidCollisions>
                <DropdownMenuLabel>Action Center</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    handleJobcardView(jobCardId);
                    handleStopPropagation(e);
                  }}
                  disabled={!canViewJobCard}
                  className={`${
                    canViewJobCard
                      ? "text-default-500"
                      : "text-default-300 cursor-not-allowed"
                  }`}
                >
                  <Icon icon="heroicons:eye" className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    handleEditClick(jobCardId);
                    handleStopPropagation(e);
                  }}
                  disabled={!canUpdateJobCard}
                  className={`${
                    canUpdateJobCard
                      ? "text-default-500"
                      : "text-default-300 cursor-not-allowed"
                  }`}
                >
                  <Icon
                    icon="heroicons:pencil-square"
                    className="h-4 w-4 mr-2"
                  />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    handleDeleteClick(jobCardId);
                    handleStopPropagation(e);
                  }}
                  disabled={!canDeleteJobCard}
                  className={`${
                    canDeleteJobCard
                      ? "text-default-500"
                      : "text-default-300 cursor-not-allowed"
                  }`}
                >
                  <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const handleInsuranceEdit = (jobCardId) => {
    console.log(jobCardId, "jobCardId");
    // router.push(`/jobcard-list/create_jobcard/${jobCardId}`);
    router.push(`/job-card/update_Jobcard/${jobCardId}`);
  };

  const handleJobcardView = (jobCardId) => {
    if (canViewJobCard) {
      console.log(jobCardId, "jobCardId");
      router.push(`/jobcard-list/view_jobcard/${jobCardId}`);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: DeleteJobCard,
    mutationKey: ["DeleteJobCard"],
    onSuccess: (res) => {
      console.log(res, "res");
      toast.success(res?.message);
      setModalOpen(false);
      setselectJobCard(null);
      queryClient.invalidateQueries({ queryKey: ["GetJobCardsList"] });
    },
    onError: (error) => {
      console.error("Error deleting employee:", error);
    },
  });

  // const handleDeleteClick = (jobCardId) => {
  //   setselectJobCard(jobCardId);
  //   setModalOpen(true);
  // };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectJobCard);
    setModalOpen(false);
  };

  const { data, error, refetch } = useQuery({
    queryKey: ["GetJobCardsList", pageIndex, pageSize],
    queryFn: async () => {
      setTableLoading(true);
      return getJobCardListAction({
        page: pageIndex + 1,
        size: pageSize,
        all: false,
        search: searchString,
        status: status || "",
        startDate: startDate || "",
        endDate: endDate || "",
      }).finally(() => {
        setTableLoading(false);
        setComponentLoading(false);
      });
    },
    // keepPreviousData: true,
  });

  useEffect(() => {
    if (searchString?.length > 2) {
      // refetch();
      if (pageIndex !== 0) {
        setPageIndex(0);
      } else {
        refetch();
      }
    } else if (searchString?.length === 0) {
      refetch();
    }
  }, [pageIndex, pageSize, refetch, searchString]);

  // if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  // if (!data?.data) return null;

  if (componentLoading) {
    return <div>Loading...</div>;
  }

  const handleStatusChange = (e) => setStatus(e.target.value);
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  const handleReset = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    requestAnimationFrame(() => {
      refetch();
    });
  };

  // console.log(columns, "columns");

  return (
    <Fragment>
      <div className="flex justify-between">
        <Breadcrumbs>
          <BreadcrumbItem>Menus</BreadcrumbItem>
          <BreadcrumbItem>Job Cards</BreadcrumbItem>
        </Breadcrumbs>
        <Button
          asChild
          className={`${canCreateJobCard ? "" : "disable cursor-not-allowed"}`}
        >
          {canCreateJobCard ? (
            <Link href="/job-card/create">
              <Plus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              Create Job Card
            </Link>
          ) : (
            <> </>
          )}
        </Button>
      </div>
      <div className="mt-4 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Job Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BasicDataTable
              data={data?.data?.jobCards || []}
              // filterColumn="companyName"
              filterPlaceHolder="by Customer name"
              columns={columns}
              setSearchString={setSearchString}
              searchString={searchString}
              pageIndex={pageIndex}
              pagination={data?.pagination}
              pageSize={pageSize}
              setPageIndex={setPageIndex}
              setPageSize={setPageSize}
              pageCount={data?.pagination?.totalPages || 0}
              tableLoading={tableLoading}
              status={status}
              startDate={startDate}
              endDate={endDate}
              handleStatusChange={handleStatusChange}
              handleStartDateChange={(date) => setStartDate(date)}
              handleEndDateChange={(date) => setEndDate(date)}
              handleReset={handleReset}
              refetch={refetch}
              hiddenFilter={true}
              handleViewClick={handleJobcardView}
              rowClickable
            />
          </CardContent>
        </Card>
      </div>
      <DialogPlacement
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onDelete={handleDeleteConfirm}
        employee={selectJobCard}
        message="Are you sure you want to delete this Job Card?"
      />
    </Fragment>
  );
};

export default JobCardListPage;
