import { redirect } from "next/navigation";

// El feed vive ahora en la portada "/". Mantenemos /descubre como alias.
export default function Descubre() {
  redirect("/");
}
