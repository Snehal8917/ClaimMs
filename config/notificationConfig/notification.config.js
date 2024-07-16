import AxiosCreator from "../axios.config";

export const getNotification = async (token) => {
    try {
      const response = await AxiosCreator.get('/api/notification', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // Return the data directly from the response
    } catch (error) {
      console.error('Fetch error:', error);
      return null; // Return null or a default value in case of an error
    }
  };