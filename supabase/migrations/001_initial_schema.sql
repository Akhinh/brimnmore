-- ============================================================
-- Brill 'n' More (BnM) — Correct Schema
-- Matches the app code exactly
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PROFILES ────────────────────────────────────────────────
-- user_id links to auth.users, id is its own UUID
CREATE TABLE profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCT TYPES ───────────────────────────────────────────
CREATE TABLE product_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#E8191A',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MANUFACTURERS ───────────────────────────────────────────
CREATE TABLE manufacturers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  contact    TEXT,
  email      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku                 TEXT UNIQUE NOT NULL DEFAULT '',
  name                TEXT NOT NULL,
  product_type_id     UUID REFERENCES product_types(id) ON DELETE SET NULL,
  manufacturer_id     UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
  description         TEXT,
  quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit                TEXT NOT NULL DEFAULT 'carton',
  buying_price        NUMERIC(12,2) NOT NULL CHECK (buying_price >= 0),
  selling_price       NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
  image_url           TEXT,
  expiry_date         DATE,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate SKU
CREATE OR REPLACE FUNCTION generate_sku() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'BNM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sku
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION generate_sku();

-- ─── SALES ───────────────────────────────────────────────────
-- A sale session created by a worker (one sale = one transaction)
CREATE TABLE sales (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id    UUID NOT NULL REFERENCES profiles(id),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SALE ITEMS ──────────────────────────────────────────────
-- Individual products within a sale
CREATE TABLE sale_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
  unit_price    NUMERIC(12,2) NOT NULL,
  subtotal      NUMERIC(12,2) GENERATED ALWAYS AS (quantity_sold * unit_price) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reduce stock and fire low-stock notification on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale() RETURNS TRIGGER AS $$
DECLARE
  new_qty INTEGER;
  threshold INTEGER;
  prod_name TEXT;
  prod_unit TEXT;
BEGIN
  UPDATE products
  SET quantity = quantity - NEW.quantity_sold, updated_at = NOW()
  WHERE id = NEW.product_id
  RETURNING quantity, low_stock_threshold, name, unit
  INTO new_qty, threshold, prod_name, prod_unit;

  -- Fire low stock notification if threshold crossed
  IF new_qty <= threshold AND new_qty >= 0 THEN
    INSERT INTO notifications (type, title, message, data)
    VALUES (
      'low_stock',
      'Low Stock Alert',
      prod_name || ' is running low (' || new_qty || ' ' || prod_unit || 's remaining)',
      jsonb_build_object('product_id', NEW.product_id, 'quantity', new_qty)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- ─── RESTOCK HISTORY ─────────────────────────────────────────
CREATE TABLE restock_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL CHECK (quantity_added > 0),
  note           TEXT,
  restocked_by   UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Increase stock on restock
CREATE OR REPLACE FUNCTION update_stock_on_restock() RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET quantity = quantity + NEW.quantity_added, updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_restock
  AFTER INSERT ON restock_history
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_restock();

-- ─── ORDER LINKS ─────────────────────────────────────────────
-- Admin generates a link/QR for customers to place orders
CREATE TABLE order_links (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  label      TEXT NOT NULL DEFAULT 'Customer Orders',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CUSTOMER ORDERS ─────────────────────────────────────────
CREATE TABLE customer_orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_link_id  UUID REFERENCES order_links(id),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,
  customer_note  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','fulfilled','cancelled')),
  total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CUSTOMER ORDER ITEMS ────────────────────────────────────
CREATE TABLE customer_order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  subtotal   NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       TEXT NOT NULL CHECK (type IN ('low_stock','new_order','restock_request')),
  title      TEXT NOT NULL,
  message    TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fire notification when a new customer order comes in
CREATE OR REPLACE FUNCTION notify_on_customer_order() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (type, title, message, data)
  VALUES (
    'new_order',
    'New Customer Order',
    'Order from ' || NEW.customer_name || ' received.',
    jsonb_build_object('order_id', NEW.id, 'customer_name', NEW.customer_name, 'total_amount', NEW.total_amount)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_customer_order
  AFTER INSERT ON customer_orders
  FOR EACH ROW EXECUTE FUNCTION notify_on_customer_order();

-- ─── WORKER INVITATIONS ──────────────────────────────────────
CREATE TABLE worker_invitations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  role       TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin','worker')),
  is_used    BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUTO updated_at TRIGGERS ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON profiles       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at      BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cust_orders_updated_at   BEFORE UPDATE ON customer_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_invitations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role from profiles
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (user_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "profiles_admin_all"    ON profiles FOR ALL    USING (get_my_role() = 'admin');

-- PRODUCTS
CREATE POLICY "products_select_auth"  ON products FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "products_admin_all"    ON products FOR ALL    USING (get_my_role() = 'admin');

-- PRODUCT TYPES
CREATE POLICY "types_select_auth"     ON product_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "types_admin_all"       ON product_types FOR ALL    USING (get_my_role() = 'admin');

-- MANUFACTURERS
CREATE POLICY "mfg_select_auth"       ON manufacturers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "mfg_admin_all"         ON manufacturers FOR ALL    USING (get_my_role() = 'admin');

-- SALES
CREATE POLICY "sales_insert_worker"   ON sales FOR INSERT WITH CHECK (worker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "sales_select_own"      ON sales FOR SELECT USING (worker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR get_my_role() = 'admin');

-- SALE ITEMS
CREATE POLICY "sale_items_insert"     ON sale_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_id AND worker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "sale_items_select"     ON sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_id AND worker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR get_my_role() = 'admin'
);

-- RESTOCK HISTORY
CREATE POLICY "restock_admin_all"     ON restock_history FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "restock_select_auth"   ON restock_history FOR SELECT USING (auth.uid() IS NOT NULL);

-- ORDER LINKS
CREATE POLICY "links_admin_all"       ON order_links FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "links_select_public"   ON order_links FOR SELECT USING (is_active = true);

-- CUSTOMER ORDERS — public can insert (no login), admin manages all
CREATE POLICY "corders_public_insert" ON customer_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "corders_admin_all"     ON customer_orders FOR ALL    USING (get_my_role() = 'admin');

-- CUSTOMER ORDER ITEMS — public can insert, admin reads all
CREATE POLICY "coi_public_insert"     ON customer_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "coi_admin_select"      ON customer_order_items FOR SELECT USING (get_my_role() = 'admin');

-- WORKER INVITATIONS
CREATE POLICY "invites_admin_all"     ON worker_invitations FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "invites_public_select" ON worker_invitations FOR SELECT USING (is_used = false AND expires_at > NOW());

-- NOTIFICATIONS
CREATE POLICY "notifs_admin_all"      ON notifications FOR ALL USING (get_my_role() = 'admin');

-- ─── ANALYTICS VIEWS ─────────────────────────────────────────

-- Daily revenue (used by dashboard chart)
CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(si.created_at)                                    AS date,
  SUM(si.subtotal)                                       AS revenue,
  SUM(si.quantity_sold * p.buying_price)                 AS cost,
  SUM(si.subtotal) - SUM(si.quantity_sold * p.buying_price) AS profit,
  COUNT(DISTINCT si.sale_id)                             AS total_sales
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY DATE(si.created_at)
ORDER BY date DESC;

-- Product performance (used by analytics page)
CREATE OR REPLACE VIEW product_performance AS
SELECT
  p.id,
  p.name,
  p.sku,
  pt.name                              AS product_type,
  m.name                               AS manufacturer,
  COALESCE(SUM(si.quantity_sold), 0)   AS total_sold,
  COALESCE(SUM(si.subtotal), 0)        AS total_revenue,
  p.quantity                           AS remaining,
  p.selling_price,
  p.buying_price
FROM products p
LEFT JOIN product_types pt ON pt.id = p.product_type_id
LEFT JOIN manufacturers m  ON m.id  = p.manufacturer_id
LEFT JOIN sale_items si    ON si.product_id = p.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.sku, pt.name, m.name, p.quantity, p.selling_price, p.buying_price
ORDER BY total_sold DESC;

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_products_type         ON products(product_type_id);
CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_sale_items_product    ON sale_items(product_id);
CREATE INDEX idx_sale_items_sale       ON sale_items(sale_id);
CREATE INDEX idx_sales_worker          ON sales(worker_id);
CREATE INDEX idx_sales_created         ON sales(created_at);
CREATE INDEX idx_corders_status        ON customer_orders(status);
CREATE INDEX idx_order_links_token     ON order_links(token);
CREATE INDEX idx_notifications_read    ON notifications(is_read);

-- ─── SEED DATA ───────────────────────────────────────────────
INSERT INTO product_types (name, description, color) VALUES
  ('Biscuits',     'All biscuit products',              '#E8191A'),
  ('Sweets',       'Candies and sweet confectioneries', '#F97316'),
  ('Chewing Gum',  'All gum and bubblegum products',   '#8B5CF6'),
  ('Chocolates',   'Chocolate bars and products',       '#92400E'),
  ('Snacks',       'Chips, crackers and other snacks',  '#059669');

INSERT INTO manufacturers (name, contact, email, address) VALUES
  ('Beloxxi Industries', '+234 800 000 0001', 'info@beloxxi.com',   'Lagos, Nigeria'),
  ('UAC Foods',          '+234 800 000 0002', 'info@uacfoods.com',  'Ibadan, Nigeria'),
  ('Cadbury Nigeria',    '+234 800 000 0003', 'info@cadbury.com.ng','Lagos, Nigeria'),
  ('Lofty Foods',        '+234 800 000 0004', 'info@loftyfoods.com','Kano, Nigeria'),
  ('Nutricima',          '+234 800 000 0005', 'info@nutricima.com', 'Lagos, Nigeria');
