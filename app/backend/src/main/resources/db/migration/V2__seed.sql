-- Datos de demostración (los mismos del prototipo del frontend). Semana del lunes 14 al sábado 19 de sept de 2026.

INSERT INTO doctor (id, name, label, specialty, sort_order) VALUES
  ('carlos',  'Dr. Carlos',   'Dr. Carlos – Odontología',     'Odontología',     1),
  ('liliana', 'Dra. Liliana', 'Dra. Liliana – Odontopediatría', 'Odontopediatría', 2);

INSERT INTO treatment (id, name, base_price, default_duration_min) VALUES
  (1,  'Limpieza',                  250000, 60),
  (2,  'Extracción',                850000, 90),
  (3,  'Odontopediatría',           NULL,   45),
  (4,  'Control odontológico',      NULL,   60),
  (5,  'Endodoncia',                NULL,   90),
  (6,  'Revisión general',          NULL,   60),
  (7,  'Resina',                    NULL,   60),
  (8,  'Fluorización infantil',     NULL,   45),
  (9,  'Blanqueamiento',            NULL,   90),
  (10, 'Sellantes dentales',        NULL,   45);

INSERT INTO patient (id, document_id, full_name, phone, doctor_id, last_visit) VALUES
  (1,  '1.032.458.771', 'Andrea Morales Gómez',    '310 452 8814', 'carlos',  DATE '2026-09-14'),
  (2,  '1.019.874.332', 'Luis Felipe Roa Vargas',  '315 887 3301', 'carlos',  DATE '2026-09-10'),
  (3,  '1.075.312.445', 'Valentina Cruz Salcedo',  '300 112 5590', 'carlos',  DATE '2026-09-14'),
  (4,  '1.000.987.213', 'Mateo Herrera Ríos',      '317 654 9922', 'carlos',  DATE '2026-09-07'),
  (5,  '1.094.562.881', 'Carolina Pinto Londoño',  '321 998 7730', 'liliana', DATE '2026-09-01'),
  (6,  '79.654.321',    'Jorge Sánchez Duque',     '312 333 7788', 'carlos',  DATE '2026-09-05'),
  (7,  '1.030.987.654', 'Isabela Romero Castillo', '316 221 8877', 'carlos',  DATE '2026-08-28'),
  (8,  '1.022.334.556', 'Daniel Vargas Peñaranda', '313 445 6609', 'carlos',  DATE '2026-09-14'),
  (9,  '1.001.234.876', 'Sofía Mendoza Arango',    '318 776 2200', 'liliana', DATE '2026-08-15'),
  (10, '1.017.554.309', 'Ricardo Ávila Mejía',     '311 208 4471', 'carlos',  DATE '2026-08-21'),
  (11, '1.053.771.208', 'Camila Torres Ibarra',    '319 640 1285', 'liliana', DATE '2026-09-12'),
  (12, '1.088.214.630', 'Andrés Ospina Rueda',     '314 502 9096', 'carlos',  DATE '2026-08-30'),
  (13, '1.026.118.540', 'María Fernanda López',    '302 771 4410', 'carlos',  DATE '2026-09-05'),
  (14, '1.012.906.375', 'Roberto Castaño Pérez',   '305 218 6623', 'carlos',  DATE '2026-09-10'),
  (15, '1.040.332.917', 'Juliana Restrepo Ocampo', '304 553 8012', 'liliana', DATE '2026-09-04'),
  (16, '1.067.489.122', 'Esteban Gutiérrez Mora',  '306 914 2750', 'carlos',  NULL);

INSERT INTO appointment (id, patient_id, patient_name, treatment, doctor_id, scheduled_on, start_time, duration_min, status) VALUES
  -- Lunes 14
  (1,  1,  'Andrea Morales Gómez',    'Limpieza',                 'carlos',  DATE '2026-09-14', TIME '08:00', 60,  'confirmed'),
  (2,  2,  'Luis Felipe Roa Vargas',  'Control odontológico',     'carlos',  DATE '2026-09-14', TIME '09:30', 60,  'confirmed'),
  (3,  3,  'Valentina Cruz Salcedo',  'Extracción',               'carlos',  DATE '2026-09-14', TIME '10:30', 90,  'confirmed'),
  -- Martes 15
  (4,  5,  'Carolina Pinto Londoño',  'Odontopediatría',          'liliana', DATE '2026-09-15', TIME '09:00', 45,  'confirmed'),
  (5,  4,  'Mateo Herrera Ríos',      'Resina',                   'carlos',  DATE '2026-09-15', TIME '09:45', 105, 'confirmed'),
  -- Miércoles 16
  (6,  6,  'Jorge Sánchez Duque',     'Endodoncia',               'carlos',  DATE '2026-09-16', TIME '08:30', 120, 'confirmed'),
  (7,  7,  'Isabela Romero Castillo', 'Revisión general',         'carlos',  DATE '2026-09-16', TIME '12:00', 60,  'cancelled'),
  -- Jueves 17
  (8,  8,  'Daniel Vargas Peñaranda', 'Resina',                   'carlos',  DATE '2026-09-17', TIME '10:30', 60,  'pending'),
  -- Viernes 18 (hoy de la demo)
  (9,  1,  'Andrea Morales Gómez',    'Limpieza',                 'carlos',  DATE '2026-09-18', TIME '08:00', 60,  'confirmed'),
  (10, 2,  'Luis Felipe Roa Vargas',  'Control odontológico',     'carlos',  DATE '2026-09-18', TIME '08:30', 60,  'confirmed'),
  (11, 3,  'Valentina Cruz Salcedo',  'Extracción',               'carlos',  DATE '2026-09-18', TIME '09:30', 90,  'urgent'),
  (12, 4,  'Mateo Herrera Ríos',      'Resina estética',          'carlos',  DATE '2026-09-18', TIME '10:00', 60,  'confirmed'),
  (13, 5,  'Carolina Pinto Londoño',  'Odontopediatría',          'liliana', DATE '2026-09-18', TIME '11:00', 45,  'pending'),
  (14, 6,  'Jorge Sánchez Duque',     'Endodoncia',               'carlos',  DATE '2026-09-18', TIME '11:30', 90,  'pending'),
  (15, 7,  'Isabela Romero Castillo', 'Revisión general',         'carlos',  DATE '2026-09-18', TIME '12:00', 60,  'confirmed'),
  (16, 8,  'Daniel Vargas Peñaranda', 'Resina',                   'carlos',  DATE '2026-09-18', TIME '13:00', 60,  'confirmed'),
  -- Sábado 19 (mañana: recordatorios por confirmar)
  (17, 9,  'Sofía Mendoza Arango',    'Control odontopediátrico', 'liliana', DATE '2026-09-19', TIME '09:00', 60,  'pending'),
  (18, 10, 'Ricardo Ávila Mejía',     'Blanqueamiento',           'carlos',  DATE '2026-09-19', TIME '10:30', 90,  'pending'),
  (19, 11, 'Camila Torres Ibarra',    'Fluorización infantil',    'liliana', DATE '2026-09-19', TIME '11:00', 60,  'pending'),
  (20, 12, 'Andrés Ospina Rueda',     'Control odontológico',     'carlos',  DATE '2026-09-19', TIME '13:00', 60,  'pending');

INSERT INTO pending_reschedule (id, patient_id, name, treatment, phone, requested_on) VALUES
  (1, 13, 'María Fernanda López',    'Endodoncia',            '302 771 4410', DATE '2026-09-16'),
  (2, 14, 'Roberto Castaño Pérez',   'Control odontológico',  '305 218 6623', DATE '2026-09-17'),
  (3, 15, 'Juliana Restrepo Ocampo', 'Fluorización infantil', '304 553 8012', DATE '2026-09-15'),
  (4, 16, 'Esteban Gutiérrez Mora',  'Limpieza',              '306 914 2750', DATE '2026-09-18');

INSERT INTO reminder (id, appointment_id, status) VALUES
  (1, 17, 'pending'), (2, 18, 'pending'), (3, 19, 'pending'), (4, 20, 'pending');

INSERT INTO treatment_plan (id, patient_id, concept, total_cost) VALUES
  (1,  3,  'Extracción molar',           850000),
  (2,  2,  'Endodoncia premolar',        500000),
  (3,  1,  'Limpieza',                   250000),
  (4,  5,  'Odontopediatría',             75000),
  (5,  6,  'Endodoncia',                 200000),
  (6,  8,  'Resina',                     450000),
  (7,  4,  'Resina estética',           1200000),
  (8,  10, 'Blanqueamiento',             600000),
  (9,  11, 'Fluorización y profilaxis',  320000),
  (10, 9,  'Odontopediatría preventiva', 180000),
  (11, 7,  'Revisión general',            80000);

INSERT INTO payment (id, plan_id, paid_on, concept, amount, method, signature) VALUES
  (1,  1,  DATE '2026-08-10', 'Cuota inicial – Extracción molar', 200000, 'Efectivo',      'V. Cruz'),
  (2,  1,  DATE '2026-08-25', '2.ª cuota',                        150000, 'Transferencia', 'V. Cruz'),
  (3,  1,  DATE '2026-09-05', '3.ª cuota',                        150000, 'Datáfono',      'V. Cruz'),
  (4,  2,  DATE '2026-08-01', 'Cuota inicial – Endodoncia',       200000, 'Efectivo',      'L. Roa'),
  (5,  2,  DATE '2026-08-15', '2.ª cuota',                        180000, 'Transferencia', 'L. Roa'),
  (6,  3,  DATE '2026-09-14', 'Pago total – Limpieza',            250000, 'Datáfono',      'A. Morales'),
  (7,  7,  DATE '2026-09-01', 'Cuota inicial – Resina estética',  700000, 'Transferencia', 'M. Herrera'),
  (8,  7,  DATE '2026-09-18', 'Pago final – Resina estética',     500000, 'Efectivo',      'M. Herrera'),
  (9,  8,  DATE '2026-09-18', 'Anticipo – Blanqueamiento',        300000, 'Transferencia', 'R. Ávila'),
  (10, 9,  DATE '2026-09-18', 'Pago total – Fluorización',        320000, 'Datáfono',      'C. Torres'),
  (11, 10, DATE '2026-09-18', 'Pago total – Odontopediatría',     180000, 'Efectivo',      'S. Mendoza'),
  (12, 11, DATE '2026-09-18', 'Pago total – Revisión general',     80000, 'Efectivo',      'I. Romero');

-- Las filas anteriores tienen id explícito: se avanza cada contador para que los nuevos registros no choquen.
ALTER TABLE treatment          ALTER COLUMN id RESTART WITH 11;
ALTER TABLE patient            ALTER COLUMN id RESTART WITH 17;
ALTER TABLE appointment        ALTER COLUMN id RESTART WITH 21;
ALTER TABLE pending_reschedule ALTER COLUMN id RESTART WITH 5;
ALTER TABLE reminder           ALTER COLUMN id RESTART WITH 5;
ALTER TABLE treatment_plan     ALTER COLUMN id RESTART WITH 12;
ALTER TABLE payment            ALTER COLUMN id RESTART WITH 13;
