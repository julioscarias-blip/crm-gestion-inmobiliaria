// ==============================================================================
// SUPABASE EDGE FUNCTION: notify-email-lead
// Disparada al crearse un nuevo lead para enviar un correo con la Ficha de Búsqueda
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const lead = payload.record || payload; // Soporta tanto Webhook de Supabase como llamada directa

    if (!lead || !lead.nombre_completo) {
      return new Response(JSON.stringify({ message: "Payload inválido" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Determinar el email de destino:
    // Por defecto toma la variable NOTIFICACION_EMAIL_DESTINO (ej: tu mail personal o de la inmobiliaria)
    let emailDestino = Deno.env.get("NOTIFICACION_EMAIL_DESTINO") || "inmobiliaria@ejemplo.com";
    let nombreAsesor = "Equipo Inmobiliario";

    // Si el lead está asignado a un agente, buscamos su mail en la base de datos
    if (lead.agente_id) {
      const { data: agente } = await supabase
        .from("perfiles_agentes")
        .select("nombre_completo, email")
        .eq("id", lead.agente_id)
        .single();

      if (agente?.email) {
        emailDestino = agente.email;
        nombreAsesor = agente.nombre_completo;
      }
    }

    // 2. Construir el HTML del correo
    const zonas = Array.isArray(lead.zonas_interes) ? lead.zonas_interes.join(", ") : "No especificada";
    const presupuesto = `${lead.moneda_presupuesto || 'USD'} $${Number(lead.presupuesto_max).toLocaleString('es-AR')}`;
    const linkWhatsApp = `https://wa.me/${(lead.telefono_whatsapp || '').replace(/[^0-9]/g, '')}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1120; color: #ffffff; padding: 25px; border-radius: 16px;">
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px;">
          <h1 style="color: #10b981; margin: 0; font-size: 24px;">🏡 Nueva Ficha de Búsqueda</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Se ha recibido un nuevo prospecto en el CRM</p>
        </div>

        <div style="margin-top: 25px; background-color: #111827; padding: 20px; border-radius: 12px; border: 1px solid #1f2937;">
          <h3 style="color: #38bdf8; margin-top: 0; font-size: 16px;">👤 Datos del Cliente</h3>
          <p><strong>Nombre:</strong> ${lead.nombre_completo}</p>
          <p><strong>Teléfono / WhatsApp:</strong> <a href="${linkWhatsApp}" style="color: #10b981; font-weight: bold;">${lead.telefono_whatsapp}</a></p>
          <p><strong>Email del cliente:</strong> ${lead.email || 'No especificado'}</p>
        </div>

        <div style="margin-top: 15px; background-color: #111827; padding: 20px; border-radius: 12px; border: 1px solid #1f2937;">
          <h3 style="color: #38bdf8; margin-top: 0; font-size: 16px;">🎯 Preferencias de Búsqueda</h3>
          <p><strong>Operación:</strong> ${String(lead.tipo_operacion || '').toUpperCase()}</p>
          <p><strong>Tipo de Inmueble:</strong> ${String(lead.tipo_propiedad || '').toUpperCase()}</p>
          <p><strong>Presupuesto Máximo:</strong> <span style="color: #10b981; font-size: 18px; font-weight: bold;">${presupuesto}</span></p>
          <p><strong>Zonas de interés:</strong> ${zonas}</p>
          <p><strong>Dormitorios mínimos:</strong> ${lead.dormitorios_min || 1} | <strong>Ambientes:</strong> ${lead.ambientes_min || 1}</p>
          <p><strong>Cochera requerida:</strong> ${lead.cochera_requerida ? 'Sí' : 'No'}</p>
          ${lead.notas_adicionales ? `<p><strong>Notas:</strong> <em>${lead.notas_adicionales}</em></p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${linkWhatsApp}" style="display: inline-block; background-color: #10b981; color: #000000; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-size: 15px;">
            💬 Contactar por WhatsApp al Cliente
          </a>
        </div>

        <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 25px;">
          Notificación automática enviada a: <strong>${emailDestino}</strong> (${nombreAsesor})
        </p>
      </div>
    `;

    // 3. Envío del email mediante Resend API (Estándar recomendado por Supabase)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CRM Inmobiliario <onboarding@resend.dev>",
          to: [emailDestino],
          subject: `🚨 Nuevo Prospecto: ${lead.nombre_completo} (${lead.tipo_propiedad} - ${presupuesto})`,
          html: htmlBody,
        }),
      });

      const resData = await res.json();
      console.log("[Email Notification Result]:", resData);
    } else {
      console.log(`[Email Notification Simulado] Para activar envíos reales configure RESEND_API_KEY. Destino: ${emailDestino}`);
    }

    return new Response(JSON.stringify({ success: true, emailDestino }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
