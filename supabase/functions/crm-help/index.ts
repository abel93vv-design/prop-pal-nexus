import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el asistente de ayuda del CRM Inmobiliario. Tu función es guiar a los usuarios sobre cómo usar la herramienta. Responde SIEMPRE en español, de forma breve y clara.

El CRM tiene estas secciones principales:
- **Dashboard** (/): Vista general con estadísticas, gráfico de ventas/alquileres, accesos rápidos y tareas pendientes.
- **Propiedades** (/propiedades): Gestión de inmuebles (pisos, casas, locales, terrenos). Se pueden crear, editar y eliminar. Cada propiedad tiene título, dirección, tipo, estado (disponible/reservado/vendido), precio, superficie, habitaciones, baños, fotos, agente asignado e inmobiliaria.
- **Clientes** (/clientes): Gestión de clientes (compradores, vendedores, arrendadores, arrendatarios). Cada cliente tiene nombre, email, teléfono, tipo, estado de lead (nuevo/contactado/en negociación/cerrado), notas e inmobiliaria.
- **Tareas** (/tareas): Gestión de tareas (llamadas, emails, visitas, recordatorios, documentación). Cada tarea tiene título, tipo, estado (pendiente/en progreso/completada), prioridad (baja/media/alta), fecha límite, agente, cliente y propiedad asociados.
- **Equipo** (/equipo): Gestión de miembros del equipo con roles (Admin Global, Admin Inmobiliaria, Agente, Personalizado), permisos y tipo de acceso.
- **Inmobiliarias** (/inmobiliarias): Gestión de agencias inmobiliarias con nombre, dirección, teléfono, email y color.
- **Web Pública** (/publica): Vista pública de propiedades disponibles.
- **Ajustes** (/ajustes): Configuración del perfil, seguridad y preferencias.

Instrucciones para guiar al usuario:
- Para CREAR algo nuevo: Ir a la sección correspondiente y pulsar el botón "Nuevo/Nueva..." (esquina superior derecha). Rellenar el formulario y guardar.
- Para EDITAR: Pasar el ratón sobre el elemento y pulsar el icono de lápiz (✏️). Modificar los campos y guardar.
- Para ELIMINAR: Pulsar el icono de papelera (🗑️) y confirmar.
- Para FILTRAR: Usar los selectores de filtro en la parte superior de cada sección.
- Para BUSCAR: Usar la barra de búsqueda disponible en cada sección.

Si el usuario pregunta algo fuera del ámbito del CRM, indícale amablemente que solo puedes ayudar con el uso de la herramienta.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, inténtalo de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Contacta con el administrador." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del asistente IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("crm-help error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
