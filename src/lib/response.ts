/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
}

/**
 * Helper to create a success response
 */
export const successResponse = <T>(
  status: number,
  message: string,
  data: T,
): ApiResponse<T> => {
  return {
    success: true,
    status,
    message,
    data,
  };
};

/**
 * Helper to create an error response
 */
export const errorResponse = (
  status: number,
  message: string,
): ApiResponse<null> => {
  return {
    success: false,
    status,
    message,
    data: null,
  };
};
