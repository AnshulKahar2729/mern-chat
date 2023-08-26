import axios from "axios";
import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export const UserContextProvider = ({ children }) => {
  const [ctxUsername, ctxSetUsername] = useState("");
  const [ctxId, ctxSetId] = useState("");

  useEffect(() => {
    axios.get("/profile").then((res) => {
      ctxSetUsername(res.data.username);
      ctxSetId(res.data.userId);
    }).catch(err=>console.log(err));
  }, []);

  return (
    <UserContext.Provider
      value={{ ctxUsername, ctxSetUsername, ctxId, ctxSetId }}
    >
      {children}
    </UserContext.Provider>
  );
};
