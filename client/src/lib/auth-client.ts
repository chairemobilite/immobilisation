import { createAuthClient } from "better-auth/react";


const createAuthClientInstance = () => {
  const baseURL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "http://localhost:5000/";
  //console.log("Auth baseURL =", baseURL);

  return createAuthClient({
    baseURL: baseURL,
  });
};

export const authClient = createAuthClientInstance();