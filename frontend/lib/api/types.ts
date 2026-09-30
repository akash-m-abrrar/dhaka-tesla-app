export interface ApiSuccessEnvelope<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
