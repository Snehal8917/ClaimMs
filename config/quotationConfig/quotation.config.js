import AxiosCreator, { api } from "@/config/axios.config";

export const createQuotation = async (data) => {
  try {
    const response = await AxiosCreator.post("api/quotation/add", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getQuotation = async ({
  page = 1,
  size = 10,
  all = false,
  search = "",
  jobCardId = "",
}) => {
  try {
    const response = await AxiosCreator.get(
      `/api/quotation?page=${page}&size=${size}&all=${all}&search=${search}&jobCardId=${jobCardId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteQuotatione = async (id) => {
  try {
    const response = await AxiosCreator.delete(`/api/quotation/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// get single quotaion

export const getQuotationeById = async (id) => {
  try {
    const response = await AxiosCreator.get(`/api/quotation/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
//update by id

export const updateQuotationeById = async (id, updatedFields) => {
  try {
    const response = await AxiosCreator.put(
      `/api/quotation/edit/${id}`,
      updatedFields
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//

export const genratePdfOfQuotation = async (id) => {
  try {
    const response = await AxiosCreator.get(
      `/api/quotation/generate-pdf/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//
export const supplementQuotation = async (data) => {
  try {
    const response = await AxiosCreator.post(
      "/api/quotation/addSupplmentery",
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
