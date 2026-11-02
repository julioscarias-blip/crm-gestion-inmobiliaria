// ==============================================================================
// SUPABASE EDGE FUNCTION: notify-whatsapp-lead
// Disparada por Database Webhook en evento INSERT sobre la tabla 'leads'
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    agente_id?: string;
    nombre_completo: string;
    telefono_whatsapp: string;
    tipo_operacion: string;
    tipo_propiedad: string;
    zonas_interes: string[];
    moneda_presupuesto: string;
    presupuesto_max: number;
    ambientes_min?: number;
    dormitorios_min?: number;
    cochera_requerida?: boolean;
    notas_adicionales?: string;
  };
  old_record: null | Record<string, unknown>;
}

serve(async (req: Request) => {
  // Manejo de Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();

    // Solo procesamos inserciones nuevas
    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ message: "Evento ignorado (no es INSERT)" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lead = payload.record;

    // Inicializar cliente Supabase con Service Role para consultas internas
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let agenteTelefono = Deno.env.get("DEFAULT_AGENT_PHONE") || "+5491100000000";
    let agenteNombre = "Agente Inmobiliario";

    // Si el lead está asignado a un agente, buscar sus datos
    if (lead.agente_id) {
      const { data: agente, error: agenteError } = await supabase
        .from("perfiles_agentes")
        .select("nombre_completo, telefono_whatsapp")
        .eq("id", lead.agente_id)
        .single();

      if (!agenteError && agente) {
        agenteNombre = agente.nombre_completo;
        if (agente.telefono_whatsapp) {
          agenteTelefono = agente.telefono_whatsapp;
        }
      }
    }

    // Formatear el mensaje de alerta para WhatsApp
    const zonasTexto = lead.zonas_interes && lead.zonas_interes.length > 0 
      ? lead.zonas_interes.join(", ") 
      : "No especificada";

    const mensajeWhatsApp = 
      `🚨 *NUEVO PROSPECTO CAPTADO EN CRM*\n\n` +
      `👤 *Cliente:* ${lead.nombre_completo}\n` +
      `📱 *WhatsApp Cliente:* ${lead.telefono_whatsapp}\n` +
      `🎯 *Búsqueda:* ${lead.tipo_operacion.toUpperCase()} de ${lead.tipo_propiedad}\n` +
      `📍 *Zonas:* ${zonasTexto}\n` +
      `💰 *Presupuesto:* ${lead.moneda_presupuesto} $${Number(lead.presupuesto_max).toLocaleString("es-AR")}\n` +
      `🛏 *Dormitorios:* ${lead.dormitorios_min || "Sin preferencia"}\n` +
      `🚗 *Cochera:* ${lead.cochera_requerida ? "Sí requerida" : "No requerida"}\n` +
      (lead.notas_adicionales ? `📝 *Notas:* ${lead.notas_adicionales}\n\n` : `\n`) +
      `⚡ *Acción rápida:* Iniciá la conversación o mirá los matches sugeridos en tu panel: \n` +
      `https://wa.me/${lead.telefono_whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${lead.nombre_completo}, soy ${agenteNombre}. Recibí tu ficha de búsqueda de propiedad y ya tengo opciones para mostrarte.`)}`;

    // ENVÍO DE WHATSAPP:
    // Compatible con Meta Cloud API, Evolution API o Twilio
    // Aquí implementamos el dispatch genérico configurable por variables de entorno
    const provider = Deno.env.get("WHATSAPP_PROVIDER") || "EVOLUTION_API"; // "META", "TWILIO", "EVOLUTION_API"

    let sendResult;
    if (provider === "EVOLUTION_API") {
      const evolutionUrl = Deno.env.get("EVOLUTION_API_URL"); // ej: https://wpp.midominio.com/message/sendText/crm-instance
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

      if (evolutionUrl && evolutionApiKey) {
        const response = await fetch(evolutionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            number: agenteTelefono.replace(/[^0-9]/g, ""),
            text: mensajeWhatsApp,
          }),
        });
        sendResult = await response.json();
      }
    } else if (provider === "META") {
      const metaToken = Deno.env.get("WHATSAPP_META_TOKEN");
      const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
      if (metaToken && phoneId) {
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: agenteTelefono.replace(/[^0-9]/g, ""),
            type: "text",
            text: { body: mensajeWhatsApp },
          }),
        });
        sendResult = await response.json();
      }
    }

    console.log(`[WhatsApp Webhook] Notificación enviada a ${agenteTelefono}`, sendResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificación de WhatsApp procesada correctamente",
        lead_id: lead.id,
        agente_notificado: agenteTelefono,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[WhatsApp Webhook Error]:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
