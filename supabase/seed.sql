begin;

insert into organizations (id, name)
values ('10000000-0000-4000-8000-000000000001', 'BU BU SHENG')
on conflict (id) do update set name = excluded.name;

insert into stores (id, organization_id, name)
values
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Cafetería Centro'),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Cafetería Norte'),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Cafetería Retiro')
on conflict (id) do update set name = excluded.name;

insert into suppliers (id, organization_id, name)
values
  ('12000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Coca-Cola Europacific Partners'),
  ('12000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Proveedor de bollería'),
  ('12000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Distribuciones Madrid')
on conflict (id) do update set name = excluded.name;

insert into products (id, organization_id, canonical_name, unit)
values
  ('13000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Coca-Cola Zero 33 cl', 'unidad'),
  ('13000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Agua mineral 50 cl', 'unidad'),
  ('13000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Croissant mantequilla', 'unidad'),
  ('13000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Napolitana de chocolate', 'unidad'),
  ('13000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Leche entera', 'litro')
on conflict (id) do update set canonical_name = excluded.canonical_name;

insert into delivery_notes (id, organization_id, store_id, supplier_id, document_number, document_date, extraction_confidence, status)
values
  ('14000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'CC-2026-0808', current_date - 2, 0.9600, 'review'),
  ('14000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000002', 'PB-2026-0807', current_date - 3, 0.9900, 'validated'),
  ('14000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000003', 'DM-2026-0806', current_date - 4, 0.8200, 'pending'),
  ('14000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', 'CC-2026-0805', current_date - 5, 0.9800, 'validated')
on conflict (id) do update set document_date = excluded.document_date, status = excluded.status;

insert into delivery_note_items (id, delivery_note_id, product_id, raw_description, quantity, unit_price, tax_rate, previous_unit_price, comparison_status)
values
  ('15000000-0000-4000-8000-000000000001', '14000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 'Coca-Cola Zero 33 cl', 48, 1.2000, 10, 1.0500, 'higher'),
  ('15000000-0000-4000-8000-000000000002', '14000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000002', 'Agua mineral 50 cl', 48, 0.5500, 10, 0.5500, 'same'),
  ('15000000-0000-4000-8000-000000000003', '14000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000003', 'Croissant mantequilla', 120, 1.0500, 10, 1.0000, 'higher'),
  ('15000000-0000-4000-8000-000000000004', '14000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000004', 'Napolitana de chocolate', 80, 1.1500, 10, 1.1500, 'same'),
  ('15000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000003', '13000000-0000-4000-8000-000000000005', 'Leche entera', 60, 1.3500, 4, null, 'review'),
  ('15000000-0000-4000-8000-000000000006', '14000000-0000-4000-8000-000000000004', '13000000-0000-4000-8000-000000000001', 'Coca-Cola Zero 33 cl', 48, 1.0500, 10, 1.0500, 'same')
on conflict (id) do update set unit_price = excluded.unit_price, comparison_status = excluded.comparison_status;

insert into promotions (id, organization_id, name, description)
values
  ('16000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Café + bollería', 'Un café y una pieza de bollería sin coste.'),
  ('16000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '10% de descuento', 'Descuento para la próxima visita.'),
  ('16000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Café gratis', 'Un café de cortesía.')
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into customers (id, organization_id, store_id, full_name, email, birthday)
values
  ('17000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'María González', 'maria.gonzalez@email.com', current_date),
  ('17000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000002', 'Javier Martín', 'javier.martin@email.com', current_date + 2),
  ('17000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000003', 'Lucía Sánchez', 'lucia.sanchez@email.com', current_date + 8)
on conflict (id) do update set birthday = excluded.birthday;

insert into customer_consents (id, customer_id, channel, granted, granted_at)
values
  ('18000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'email', true, now()),
  ('18000000-0000-4000-8000-000000000002', '17000000-0000-4000-8000-000000000002', 'email', true, now()),
  ('18000000-0000-4000-8000-000000000003', '17000000-0000-4000-8000-000000000003', 'email', true, now())
on conflict (id) do update set granted = excluded.granted, granted_at = excluded.granted_at;

insert into customer_promotions (id, customer_id, promotion_id, scheduled_for, status)
values
  ('19000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001', current_date, 'pending'),
  ('19000000-0000-4000-8000-000000000002', '17000000-0000-4000-8000-000000000002', '16000000-0000-4000-8000-000000000002', current_date + 2, 'prepared'),
  ('19000000-0000-4000-8000-000000000003', '17000000-0000-4000-8000-000000000003', '16000000-0000-4000-8000-000000000003', current_date + 8, 'pending')
on conflict (id) do update set scheduled_for = excluded.scheduled_for, status = excluded.status;

commit;
