-- ==============================================================================
-- CRM GESTIÓN INMOBILIARIA - ESQUEMA DE BASE DE DATOS EN SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMINIO INMOBILIARIO
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('administrador', 'agente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_lead AS ENUM ('nuevo', 'contactado', 'ficha_completada', 'visita', 'cierre', 'descartado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_propiedad AS ENUM ('departamento', 'casa', 'ph', 'terreno', 'local', 'oficina', 'galpon', 'cochera');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_operacion AS ENUM ('venta', 'alquiler', 'alquiler_temporal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fuente_propiedad AS ENUM ('aldaz', 'dos_click', 'propia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_moneda AS ENUM ('USD', 'ARS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLA: perfiles_agentes
-- Vinculada directamente con auth.users de Supabase
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfiles_agentes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    telefono_whatsapp TEXT NOT NULL, -- Formato E.164 (Ej: +5491112345678) para notificaciones y wa.me
    email TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE, -- Identificador amigable para URLs personalizadas: /buscar?agente=carlos-mendez
    rol rol_usuario NOT NULL DEFAULT 'agente',
    avatar_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABLA: leads (Ficha de Búsqueda y Clientes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.perfiles_agentes(id) ON DELETE SET NULL,
    
    -- Datos de Contacto
    nombre_completo TEXT NOT NULL,
    telefono_whatsapp TEXT NOT NULL, -- Teléfono del cliente para contacto directo
    email TEXT,
    
    -- Estado en el Embudo de Ventas (Tablero Kanban)
    estado estado_lead NOT NULL DEFAULT 'nuevo',
    
    -- Criterios de Búsqueda (Ficha de Auto-Captación)
    tipo_operacion tipo_operacion NOT NULL,
    tipo_propiedad tipo_propiedad NOT NULL,
    zonas_interes TEXT[] NOT NULL DEFAULT '{}', -- Array con barrios o zonas buscadas (ej: ['Palermo', 'Belgrano'])
    
    -- Criterios Económicos
    moneda_presupuesto tipo_moneda NOT NULL DEFAULT 'USD',
    presupuesto_min NUMERIC(14,2) DEFAULT 0,
    presupuesto_max NUMERIC(14,2) NOT NULL,
    
    -- Requisitos de Espacio
    ambientes_min INTEGER DEFAULT 1,
    dormitorios_min INTEGER DEFAULT 1,
    cochera_requerida BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata adicional
    notas_adicionales TEXT,
    origen_lead TEXT DEFAULT 'landing_propia', -- 'landing_propia', 'whatsapp_directo', 'portal'
    utm_source TEXT,
    utm_campaign TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: propiedades_unificadas (Inventario unificado Aldaz + Dos Click)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.propiedades_unificadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuente fuente_propiedad NOT NULL,
    external_id TEXT NOT NULL, -- ID original en Aldaz o en Dos Click
    
    -- Datos Principales
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo_propiedad tipo_propiedad NOT NULL,
    tipo_operacion tipo_operacion NOT NULL,
    
    -- Aspectos Económicos
    precio NUMERIC(14,2) NOT NULL,
    moneda tipo_moneda NOT NULL DEFAULT 'USD',
    expensas NUMERIC(12,2) DEFAULT 0,
    
    -- Ubicación
    direccion TEXT,
    barrio_zona TEXT NOT NULL,
    ciudad TEXT DEFAULT 'Buenos Aires',
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    
    -- Dimensiones y Ambientes
    superficie_total_m2 NUMERIC(8,2),
    superficie_cubierta_m2 NUMERIC(8,2),
    ambientes INTEGER DEFAULT 1,
    dormitorios INTEGER DEFAULT 0,
    banos INTEGER DEFAULT 1,
    cocheras INTEGER DEFAULT 0,
    
    -- Multimedia & URLs
    imagenes TEXT[] NOT NULL DEFAULT '{}',
    url_original TEXT, -- Link hacia la publicación original
    
    -- Estado y Amenities
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    amenities JSONB DEFAULT '{}'::jsonb, -- {'pileta': true, 'parrilla': true, 'balcon': true}
    
    -- Control de sincronización ETL
    ultima_sincronizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Clave única para evitar duplicados en ingestas recurrentes (UPSERT)
    CONSTRAINT uq_fuente_external_id UNIQUE (fuente, external_id)
);

-- ==============================================================================
-- 6. ÍNDICES DE ALTO RENDIMIENTO
-- Optimizados para búsquedas y cruce de datos inteligente (Match)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_agente ON public.leads(agente_id);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_busqueda ON public.leads(tipo_operacion, tipo_propiedad, presupuesto_max);
CREATE INDEX IF NOT EXISTS idx_leads_zonas ON public.leads USING GIN (zonas_interes);

CREATE INDEX IF NOT EXISTS idx_propiedades_matching ON public.propiedades_unificadas (
    tipo_operacion, 
    tipo_propiedad, 
    moneda, 
    precio, 
    disponible
);
CREATE INDEX IF NOT EXISTS idx_propiedades_barrio ON public.propiedades_unificadas (barrio_zona);
CREATE INDEX IF NOT EXISTS idx_propiedades_fuente_ext ON public.propiedades_unificadas(fuente, external_id);

-- ==============================================================================
-- 7. FUNCIÓN Y TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_agentes_updated_at
    BEFORE UPDATE ON public.perfiles_agentes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_propiedades_updated_at
    BEFORE UPDATE ON public.propiedades_unificadas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. FUNCIÓN STORED PROCEDURE: Smart Match Inmobiliario
-- Cruza la ficha del lead con las propiedades que se ajustan al presupuesto y zona
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.buscar_propiedades_matching(p_lead_id UUID, p_limite INTEGER DEFAULT 20)
RETURNS TABLE (
    propiedad_id UUID,
    titulo TEXT,
    tipo_propiedad tipo_propiedad,
    tipo_operacion tipo_operacion,
    precio NUMERIC,
    moneda tipo_moneda,
    barrio_zona TEXT,
    ambientes INTEGER,
    dormitorios INTEGER,
    cocheras INTEGER,
    imagenes TEXT[],
    url_original TEXT,
    score_coincidencia INTEGER
) AS $$
DECLARE
    v_lead public.leads%ROWTYPE;
BEGIN
    -- Obtener datos del cliente
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS propiedad_id,
        p.titulo,
        p.tipo_propiedad,
        p.tipo_operacion,
        p.precio,
        p.moneda,
        p.barrio_zona,
        p.ambientes,
        p.dormitorios,
        p.cocheras,
        p.imagenes,
        p.url_original,
        (
            -- Cálculo de scoring de coincidencia (0 - 100)
            50 -- Base por cumplir operación, tipo y presupuesto
            + CASE 
                WHEN array_length(v_lead.zonas_interes, 1) > 0 
                     AND EXISTS (
                         SELECT 1 FROM unnest(v_lead.zonas_interes) z 
                         WHERE lower(p.barrio_zona) LIKE '%' || lower(trim(z)) || '%'
                     ) THEN 30 
                ELSE 0 
              END
            + CASE WHEN p.dormitorios >= v_lead.dormitorios_min THEN 10 ELSE 0 END
            + CASE WHEN v_lead.cochera_requerida AND p.cocheras > 0 THEN 10 ELSE 0 END
        )::INTEGER AS score_coincidencia
    FROM public.propiedades_unificadas p
    WHERE 
        p.disponible = TRUE
        AND p.tipo_operacion = v_lead.tipo_operacion
        AND p.tipo_propiedad = v_lead.tipo_propiedad
        AND p.moneda = v_lead.moneda_presupuesto
        AND p.precio <= (v_lead.presupuesto_max * 1.10) -- Margen del 10% negociable
    ORDER BY score_coincidencia DESC, p.precio ASC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.perfiles_agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades_unificadas ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles_agentes
-- Lectura pública para permitir cargar la ficha del asesor en la Landing (?agente=...)
CREATE POLICY "Lectura pública de perfiles activos" 
    ON public.perfiles_agentes 
    FOR SELECT 
    USING (activo = true);

CREATE POLICY "Agentes pueden actualizar su propio perfil" 
    ON public.perfiles_agentes 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Políticas para leads
-- Inserción pública: la Landing Page puede insertar un lead anónimo sin requerir sesión
CREATE POLICY "Inserción pública anónima de leads desde la Landing" 
    ON public.leads 
    FOR INSERT 
    WITH CHECK (true);

-- Lectura/Actualización restringida: Solo el agente asignado o administradores
CREATE POLICY "Agentes ven y gestionan sus propios leads" 
    ON public.leads 
    FOR ALL 
    USING (
        auth.uid() = agente_id 
        OR EXISTS (
            SELECT 1 FROM public.perfiles_agentes 
            WHERE id = auth.uid() AND rol = 'administrador'
        )
    );

-- Políticas para propiedades_unificadas
-- Los agentes autenticados pueden ver todo el inventario
CREATE POLICY "Agentes pueden consultar inventario" 
    ON public.propiedades_unificadas 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Inserción y actualización reservada para service_role (Scripts de sincronización ETL)
CREATE POLICY "Service role sincroniza inventario" 
    ON public.propiedades_unificadas 
    FOR ALL 
    USING (auth.role() = 'service_role');
