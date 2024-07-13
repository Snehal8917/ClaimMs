import {
  createQuotation,
  getQuotation,
  deleteQuotatione,
  getQuotationeById,
  updateQuotationeById,
  genratePdfOfQuotation,
  supplementQuotation,
} from "../../config/quotationConfig/quotation.config";

export const addQuotation = async (data) => {
  const response = await createQuotation(data);
  return response;
};

export const getAllQuotation = async ({
  page = 1,
  size = 10,
  all = false,
  search = "",
  jobCardId = "",
}) => {
  const response = await getQuotation({ page, size, all, search, jobCardId });
  return response;
};

export const deleteQuotation = async (id) => {
  const response = await deleteQuotatione(id);
  return response;
};

//

export const getSingleQuotation = async (id) => {
  const response = await getQuotationeById(id);
  return response.data;
};

//update

export const updateQuotation = async (id, updatedFields) => {
  const response = await updateQuotationeById(id, updatedFields);
  return response;
};



// genrate pdf

export const getPDFGenrate = async (id) => {
  const response = await genratePdfOfQuotation(id);
  return response;
};

//sup



export const addsupplementQuotation = async (data) => {
  const response = await supplementQuotation(data);
  return response;
};