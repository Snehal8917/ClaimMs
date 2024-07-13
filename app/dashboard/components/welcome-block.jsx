import admin from "@/public/images/all-img/admin.png";
import { motion } from "framer-motion";
import Image from "next/image";
import Counter from "./counter";

const WelcomeBlock = ({ data, session }) => {
  const data1 = [
    {
      title: "Total Jobcards",
      total: data?.data?.totalJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Approved Jobcards",
      total: data?.data?.totalApprovedJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Inprogress Jobcards",
      total: data?.data?.totalInprogressJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Pending Jobcards",
      total: data?.data?.totalPaidJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Paid Jobcards",
      total: data?.data?.totalPendingJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Unpaid Jobcards",
      total: data?.data?.totalUnpaidJobcards || 0,
      role: ["superAdmin", "employee", "company"],
    },
    {
      title: "Total Customers",
      total: data?.data?.totalCustomer || 0,
      role: ["employee", "company"],
    },
    {
      title: "Total Employees",
      total: data?.data?.totalEmployee || 0,
      role: ["company"],
    },
    {
      title: "Total Company",
      total: data?.data?.totalCompany || 0,
      role: ["superAdmin"],
    },
  ];

  const filteredData = data1.filter((data) =>
    data.role.includes(session?.role)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full bg-primary rounded-md flex p-6 relative shadow-lg"
    >
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-2xl font-semibold text-white mb-6"
        >
          Welcome Back {data?.data?.name ? data?.data?.name : ""}
        </motion.div>

        <div className="flex flex-wrap gap-4">
          {filteredData.map((item, index) => (
            <motion.div
              key={`welcome-text-${index}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex items-center w-full max-w-[130px] p-3 rounded bg-white shadow-md"
            >
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-700">
                  {item.title}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  <Counter from={0} to={item.total} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute bottom-0 ltr:right-4 rtl:left-4 ltr:md:right-[30%] rtl:md:left-[30%] ltr:md:bottom-5 ltr:2xl:right-10 rtl:2xl:left-10 w-[100px]"
      >
        <Image src={admin} alt="user" className="w-full h-full object-cover" />
      </motion.div>
    </motion.div>
  );
};

export default WelcomeBlock;
