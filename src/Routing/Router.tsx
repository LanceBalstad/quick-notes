import { createBrowserRouter } from "react-router-dom";
import NotePage from "../Pages/NotePage";

export const Router = createBrowserRouter([
  { path: "/", element: <NotePage /> },
  { path: "/:noteId", element: <NotePage /> }, // TODO: This functionality will need to be added. Check Product_List_Page in Fora
]);
