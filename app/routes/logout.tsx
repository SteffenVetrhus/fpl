import { redirect } from "react-router";
import { getClearAuthCookieHeader } from "~/lib/pocketbase/client";
import type { Route } from "./+types/logout";

export async function loader() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": getClearAuthCookieHeader(),
    },
  });
}

export async function action() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": getClearAuthCookieHeader(),
    },
  });
}

export default function Logout() {
  return null;
}
