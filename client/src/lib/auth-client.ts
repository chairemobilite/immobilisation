import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

const createAuthClientInstance = () => {
  const baseURL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "http://localhost:5000/";
  //console.log("Auth baseURL =", baseURL);

  return createAuthClient({
    baseURL: baseURL,
    plugins:[
      adminClient(),
      apiKeyClient()
    ]
  });
};

export const authClient = createAuthClientInstance();