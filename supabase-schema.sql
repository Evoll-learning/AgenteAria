-- ============================================
-- ARIA - DATABASE SCHEMA COMPLETO
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Activar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('small', 'medium', 'large', 'enterprise')),
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "allow_voice": true,
    "allow_chat": true,
    "business_hours": "9-18",
    "timezone": "Europe/Madrid"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS/EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'hr_manager')),
  department TEXT,
  position TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "language": "es",
    "notifications": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'chat', 'phone')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  category TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'aria', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'voice', 'document')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('policy', 'manual', 'procedure', 'contract', 'faq', 'other')),
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  vector_embedding VECTOR(1536), -- Para búsqueda semántica
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'urgent', 'system')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios ven solo datos de su empresa
CREATE POLICY "Users view own company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users view own profile" ON users
  FOR SELECT USING (id = auth.uid() OR company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users view own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users view own messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Empresa demo
INSERT INTO companies (name, slug, email, phone, industry, size)
VALUES (
  'TechCorp España',
  'techcorp',
  'info@techcorp.es',
  '+34 900 123 456',
  'Technology',
  'medium'
) ON CONFLICT (slug) DO NOTHING;

-- Usuario admin demo (la contraseña se configura en Supabase Auth)
INSERT INTO users (
  company_id,
  email,
  full_name,
  role,
  department,
  position
)
SELECT
  id,
  'admin@techcorp.es',
  'María García',
  'admin',
  'Recursos Humanos',
  'HR Manager'
FROM companies WHERE slug = 'techcorp'
ON CONFLICT (email) DO NOTHING;

-- Usuario empleado demo
INSERT INTO users (
  company_id,
  email,
  full_name,
  role,
  department,
  position
)
SELECT
  id,
  'juan.perez@techcorp.es',
  'Juan Pérez',
  'employee',
  'Desarrollo',
  'Software Engineer'
FROM companies WHERE slug = 'techcorp'
ON CONFLICT (email) DO NOTHING;

-- FAQs demo
INSERT INTO documents (company_id, title, category, file_url, created_by)
SELECT
  c.id,
  'Política de Vacaciones 2024',
  'policy',
  'https://example.com/vacaciones.pdf',
  u.id
FROM companies c
CROSS JOIN users u
WHERE c.slug = 'techcorp' AND u.email = 'admin@techcorp.es'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener estadísticas de empresa
CREATE OR REPLACE FUNCTION get_company_stats(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_conversations', COUNT(DISTINCT c.id),
    'active_users', COUNT(DISTINCT c.user_id),
    'avg_satisfaction', ROUND(AVG(c.satisfaction_rating), 2),
    'total_messages', COUNT(m.id)
  )
  INTO result
  FROM conversations c
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE c.company_id = company_uuid
    AND c.created_at >= NOW() - INTERVAL '30 days';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ SCHEMA COMPLETO
-- ============================================
