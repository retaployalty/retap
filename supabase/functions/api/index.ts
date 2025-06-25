import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from "./router.ts";

serve(async (req) => {
  return await handleRequest(req);
}); 