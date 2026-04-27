-- ============================================================
-- Seed Data for BnM App
-- ============================================================

-- Product Types
INSERT INTO product_types (name, description, color) VALUES
  ('Biscuits', 'All kinds of biscuit products', '#E8191A'),
  ('Sweets', 'Candies and sweet confectioneries', '#F97316'),
  ('Chewing Gum', 'All gum and bubblegum products', '#8B5CF6'),
  ('Chocolates', 'Chocolate bars and products', '#92400E'),
  ('Snacks', 'Chips, crackers and other snacks', '#059669');

-- Manufacturers
INSERT INTO manufacturers (name, contact, email, address) VALUES
  ('Beloxxi Industries', '+234 800 000 0001', 'info@beloxxi.com', 'Lagos, Nigeria'),
  ('UAC Foods', '+234 800 000 0002', 'info@uacfoods.com', 'Ibadan, Nigeria'),
  ('Cadbury Nigeria', '+234 800 000 0003', 'info@cadbury.com.ng', 'Lagos, Nigeria'),
  ('Lofty Foods', '+234 800 000 0004', 'info@loftyfoods.com', 'Kano, Nigeria'),
  ('Nutricima', '+234 800 000 0005', 'info@nutricima.com', 'Lagos, Nigeria');
