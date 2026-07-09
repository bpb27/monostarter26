import { createBrowserRouter } from "react-router";
import { HomePage } from "./routes/home";
import { RootLayout } from "./routes/root";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
