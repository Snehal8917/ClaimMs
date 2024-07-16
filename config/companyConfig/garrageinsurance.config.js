import AxiosCreator, { api } from "@/config/axios.config";

////Company Insurance company
export const getGarrageInsuranceCompanyList = async () => {
    try {
        const response = await AxiosCreator.get("/api/garage-insurance");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getGarageInsuranceCompanyById = async (id) => {
    try {
        const response = await AxiosCreator.get(`/api/garage-insurance/${id}`);
        return response.data;  // Return the data directly from the response
    } catch (error) {
        console.error('Fetch error:', error);
        return null;  // Return null or a default value in case of an error
    }
};

export const updateGarageInsuranceCompanyById = async (id,updatedFields) => {
    try {
        const response = await AxiosCreator.put(
            `/api/garage-insurance/edit/${id}`,
            updatedFields
        );
        return response.data;
    } catch (error) {
        throw error?.data;
    }
}
