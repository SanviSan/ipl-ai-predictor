import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./components/approutes";
import { UserProvider } from "./context/UserContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <UserProvider>
    <AppRoutes />
  </UserProvider>
);