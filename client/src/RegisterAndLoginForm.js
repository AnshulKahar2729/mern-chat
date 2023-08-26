import React, { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

const RegisterAndLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginorRegister, setIsLoginorRegister] = useState("Register");
  const { ctxSetUsername, ctxSetId } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = isLoginorRegister === "Login" ? "/login" : "/register";
    const { data } = await axios.post(url, { username, password });

    ctxSetId(data.id);
    ctxSetUsername(username);
    console.log(data);
  };

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          type="text"
          className="block w-full rounded-sm p-2 mb-2 border"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="block w-full rounded-sm p-2 mb-2 border"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <button className="bg-blue-500 block text-white w-full rounded-sm p-2">
          {isLoginorRegister}
        </button>
        <div className="text-center mt-2">
          {isLoginorRegister === "Register" && (
            <>
              {" "}
              Already a member?
              <button
                onClick={(event) => {
                  event.preventDefault();
                  setIsLoginorRegister("Login");
                }}
              >
                Login here
              </button>
            </>
          )}

          {isLoginorRegister === "Login" && (
            <>
              Don't have an account?
              <button
                onClick={(event) => {
                  event.preventDefault();
                  setIsLoginorRegister("Register");
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterAndLoginForm;
