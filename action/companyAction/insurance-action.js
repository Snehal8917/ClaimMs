import { addInsuranceCompanyUser, deleteInsuranceCompany, editInsuranceCompanyUser, getInsuranceCompanyById, getInsuranceCompanyUsers, updateInsuranceCompanyById } from "../../config/companyConfig/insurancecompany.config";

export const addInsuranceCompany = async (data) => {
    // console.log(data, config, "data");
    const response = await addInsuranceCompanyUser(data);
    return response;
};

export const getInsuranceCompanies = async ({ page = 1, size = 10, all = false, search = "" }) => {
    const response = await getInsuranceCompanyUsers({ page, size, all, search });
    return response;
}

export const deleteInsurance = async (data) => {
    const response = await deleteInsuranceCompany(data);
    return response;
}

export const getSingleInsurance = async (id) => {
    const response = await getInsuranceCompanyById(id);
    return response.data;
};

export const updateInsurance = async (id, updatedFields) => {
    return await updateInsuranceCompanyById(id, updatedFields);
};



// export const editInsuranceCompany = async (data) => {
//     const response = await editInsuranceCompanyUser(data);
//     return response;
// }