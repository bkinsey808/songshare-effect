import { guardAsProvider } from "@/shared/providers";

const v2 = guardAsProvider("google");
console.log(typeof v2);
