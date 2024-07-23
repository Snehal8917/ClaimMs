import {
  CreateJobCard,
  DeleteJobCard,
  getHistoryList,
  getJobCardById,
  getJobCardsList,
  getJobCardsMyTaskList,
  updateJobCardById
} from "../../config/companyConfig/jobcard.config";


export const addJobCard = async (data) => {
  const response = await CreateJobCard(data);
  return response;
};

export const getJobCardListAction = async ({ page = 1, size = 10, all = false, search = "", status = "", startDate = "", endDate = "" }) => {
  const response = await getJobCardsList({ page, size, all, search, status, startDate, endDate });
  return response;
};

// export const deleteJobCardAction = async (id) => {
//   const response = await DeleteJobCard(id);
//   return response;
// };

export const deleteJobCardAction = async (id) => {
  try {
    const response = await DeleteJobCard(id);
    return response;
  } catch (error) {
    // Handle error, you can log it or throw a custom error if needed
    console.error('Error deleting job card:', error);
    throw new Error('Failed to delete job card');
  }
};


export const getSingleJobCardAction = async (id) => {
  console.log("getSingleJobCardAction", id);
  const response = await getJobCardById(id);
  console.log(response.data, "response response.data");
  return response.data;
};

// Update
export const updateJobCardAction = async (id, updatedFields) => {
  console.log("i update of jobcard data:-", id);
  const response = await updateJobCardById(id, updatedFields);
  return response;
};

// job card history
export const getHistoryAction = async ({ jobCardId = "" }) => {
  const response = await getHistoryList({ jobCardId });
  return response;
}


//my task jobcard new
export const getJobCardMyTaskListAction = async ({ page = 1, size = 10, all = false, search = "", status = "", startDate = "", endDate = "" }) => {
  const response = await getJobCardsMyTaskList({ page, size, all, search, status, startDate, endDate });
  return response;
};