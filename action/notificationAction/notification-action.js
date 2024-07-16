import { getNotification } from "../../config/notificationConfig/notification.config";

export const getNotificationAction = async (token) => {
    const response = await getNotification(token);
    return response;
  };