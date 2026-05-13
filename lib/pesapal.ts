// @ts-ignore
import { Pesapal } from "pesapal3-sdk"
import { createServerClient } from "@/lib/supabase/server"

export async function getPesapalClient() {
  const supabase = await createServerClient()
  
  const { data: settings, error } = await supabase
    .from("system_settings")
    .select("*")
    .single()

  // Handle both snake_case and camelCase
  const key = settings?.pesapal_consumer_key || settings?.pesapalConsumerKey;
  const secret = settings?.pesapal_consumer_secret || settings?.pesapalConsumerSecret;
  const environment = settings?.pesapal_environment || settings?.pesapalEnvironment || "sandbox";

  if (!key || !secret) {
    throw new Error("Pesapal configuration missing or invalid")
  }

  // @ts-ignore
  const pesapal = new Pesapal({
    consumer_key: key,
    consumer_secret: secret,
    environment: environment
  }) as any

  return pesapal
}
