-- Email Automation System Database Schema

-- 1. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    subject_en TEXT NOT NULL,
    subject_es TEXT NOT NULL,
    subject_ca TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_es TEXT NOT NULL,
    body_ca TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_key (template_key),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Email Automation Rules Table
CREATE TABLE IF NOT EXISTS email_automation_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    trigger_type ENUM(
        'member_registered',
        'member_approved',
        'member_rejected',
        'membership_expiring_7d',
        'membership_expiring_3d',
        'membership_expiring_1d',
        'membership_expired',
        'membership_renewed',
        'newsletter_welcome',
        'scheduled_campaign'
    ) NOT NULL,
    template_id INT NOT NULL,
    days_offset INT DEFAULT 0 COMMENT 'Days before/after trigger (negative = before)',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_key VARCHAR(100),
    member_id INT,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    status ENUM('pending', 'processing', 'sent', 'failed') DEFAULT 'pending',
    scheduled_for TIMESTAMP NULL DEFAULT NULL,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_priority (priority),
    INDEX idx_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    email VARCHAR(255) NOT NULL,
    template_key VARCHAR(100),
    subject TEXT NOT NULL,
    trigger_type VARCHAR(100),
    status ENUM('sent', 'failed', 'bounced') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_member_id (member_id),
    INDEX idx_template_key (template_key),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert Default Email Templates

-- Welcome Email
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('member_welcome', 'New Member Welcome', 
 'Welcome to Elektr-Âme! 🎵',
 '¡Bienvenido a Elektr-Âme! 🎵',
 'Benvingut a Elektr-Âme! 🎵',
 'Hi {{first_name}},\n\nWelcome to Elektr-Âme! We''re thrilled to have you as part of our electronic music community.\n\nYour registration has been received and is currently under review. You''ll receive a confirmation email once your membership is approved.\n\nYou can access your Member Portal at: https://www.elektr-ame.com/member-portal\n\nIf you have any questions, feel free to reach out to us at contact@elektr-ame.com.\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\n¡Bienvenido a Elektr-Âme! Estamos encantados de tenerte como parte de nuestra comunidad de música electrónica.\n\nTu registro ha sido recibido y está en proceso de revisión. Recibirás un correo de confirmación una vez que tu membresía sea aprobada.\n\nPuedes acceder a tu Portal de Miembros en: https://www.elektr-ame.com/member-portal\n\nSi tienes alguna pregunta, no dudes en contactarnos en contact@elektr-ame.com.\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\nBenvingut a Elektr-Âme! Estem encantats de tenir-te com a part de la nostra comunitat de música electrònica.\n\nEl teu registre ha estat rebut i està en procés de revisió. Rebràs un correu de confirmació un cop la teva membresía sigui aprovada.\n\nPots accedir al teu Portal de Membres a: https://www.elektr-ame.com/member-portal\n\nSi tens alguna pregunta, no dubtis en contactar-nos a contact@elektr-ame.com.\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Approval Email
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('member_approved', 'Membership Approved', 
 'Your Elektr-Âme membership has been approved! ✅',
 '¡Tu membresía de Elektr-Âme ha sido aprobada! ✅',
 'La teva membresía d''Elektr-Âme ha estat aprovada! ✅',
 'Hi {{first_name}},\n\nGreat news! Your Elektr-Âme membership has been approved.\n\n**Membership Details:**\n- Type: {{membership_type}}\n- Status: Active\n- Valid until: {{end_date}}\n\nYou can now access your digital membership card and all member benefits through your portal:\nhttps://www.elektr-ame.com/member-portal\n\nThank you for joining our community!\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\n¡Buenas noticias! Tu membresía de Elektr-Âme ha sido aprobada.\n\n**Detalles de membresía:**\n- Tipo: {{membership_type}}\n- Estado: Activa\n- Válida hasta: {{end_date}}\n\nAhora puedes acceder a tu tarjeta de miembro digital y todos los beneficios a través de tu portal:\nhttps://www.elektr-ame.com/member-portal\n\n¡Gracias por unirte a nuestra comunidad!\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\nBones notícies! La teva membresía d''Elektr-Âme ha estat aprovada.\n\n**Detalls de membresía:**\n- Tipus: {{membership_type}}\n- Estat: Activa\n- Vàlida fins: {{end_date}}\n\nAra pots accedir a la teva targeta de membre digital i tots els beneficis a través del teu portal:\nhttps://www.elektr-ame.com/member-portal\n\nGràcies per unir-te a la nostra comunitat!\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Expiration Warning (7 days)
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('membership_expiring_7d', 'Membership Expiring Soon (7 days)', 
 'Your Elektr-Âme membership expires in 7 days ⏰',
 'Tu membresía de Elektr-Âme expira en 7 días ⏰',
 'La teva membresía d''Elektr-Âme expira en 7 dies ⏰',
 'Hi {{first_name}},\n\nThis is a friendly reminder that your {{membership_type}} membership will expire on {{end_date}} (in 7 days).\n\nDon''t lose access to your member benefits! Renew now through your Member Portal:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\nQuestions? Contact us at contact@elektr-ame.com\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\nEste es un recordatorio amistoso de que tu membresía {{membership_type}} expirará el {{end_date}} (en 7 días).\n\n¡No pierdas el acceso a tus beneficios! Renueva ahora a través de tu Portal de Miembros:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\n¿Preguntas? Contáctanos en contact@elektr-ame.com\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\nAquest és un recordatori amistós que la teva membresía {{membership_type}} expirarà el {{end_date}} (en 7 dies).\n\nNo perdis l''accés als teus beneficis! Renova ara a través del teu Portal de Membres:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\nPreguntes? Contacta''ns a contact@elektr-ame.com\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Expiration Warning (3 days)
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('membership_expiring_3d', 'Membership Expiring Soon (3 days)', 
 '⚠️ Your Elektr-Âme membership expires in 3 days',
 '⚠️ Tu membresía de Elektr-Âme expira en 3 días',
 '⚠️ La teva membresía d''Elektr-Âme expira en 3 dies',
 'Hi {{first_name}},\n\n⚠️ **URGENT:** Your {{membership_type}} membership expires in just 3 days ({{end_date}}).\n\nRenew now to maintain uninterrupted access:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\nNeed help? Reply to this email or contact us at contact@elektr-ame.com\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\n⚠️ **URGENTE:** Tu membresía {{membership_type}} expira en solo 3 días ({{end_date}}).\n\nRenueva ahora para mantener el acceso sin interrupciones:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\n¿Necesitas ayuda? Responde a este correo o contáctanos en contact@elektr-ame.com\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\n⚠️ **URGENT:** La teva membresía {{membership_type}} expira en només 3 dies ({{end_date}}).\n\nRenova ara per mantenir l''accés sense interrupcions:\nhttps://www.elektr-ame.com/member-portal\n\n{{tax_deduction_info}}\n\nNecessites ajuda? Respon a aquest correu o contacta''ns a contact@elektr-ame.com\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Renewal Confirmation
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('membership_renewed', 'Membership Renewal Confirmation', 
 'Thank you for renewing your Elektr-Âme membership! 🎉',
 '¡Gracias por renovar tu membresía de Elektr-Âme! 🎉',
 'Gràcies per renovar la teva membresía d''Elektr-Âme! 🎉',
 'Hi {{first_name}},\n\nThank you for renewing your Elektr-Âme membership!\n\n**Membership Details:**\n- Type: {{membership_type}}\n- Amount: €{{amount}}\n- Valid until: {{end_date}}\n\n{{tax_receipt_info}}\n\nAccess your updated digital membership card:\nhttps://www.elektr-ame.com/member-portal\n\nWe appreciate your continued support of our electronic music community!\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\n¡Gracias por renovar tu membresía de Elektr-Âme!\n\n**Detalles de membresía:**\n- Tipo: {{membership_type}}\n- Monto: €{{amount}}\n- Válida hasta: {{end_date}}\n\n{{tax_receipt_info}}\n\nAccede a tu tarjeta de miembro digital actualizada:\nhttps://www.elektr-ame.com/member-portal\n\n¡Agradecemos tu apoyo continuo a nuestra comunidad de música electrónica!\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\nGràcies per renovar la teva membresía d''Elektr-Âme!\n\n**Detalls de membresía:**\n- Tipus: {{membership_type}}\n- Import: €{{amount}}\n- Vàlida fins: {{end_date}}\n\n{{tax_receipt_info}}\n\nAccedeix a la teva targeta de membre digital actualitzada:\nhttps://www.elektr-ame.com/member-portal\n\nAgraïm el teu suport continuat a la nostra comunitat de música electrònica!\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Tax Receipt for Sponsors
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca) VALUES
('sponsor_tax_receipt', 'Tax Deduction Receipt', 
 'Your Tax Deduction Receipt - Elektr-Âme',
 'Tu Certificado de Deducción Fiscal - Elektr-Âme',
 'El teu Certificat de Deducció Fiscal - Elektr-Âme',
 'Hi {{first_name}},\n\nThank you for your generous sponsorship of €{{amount}} to Elektr-Âme!\n\n**Tax Deduction Information:**\n- Donation Amount: €{{amount}}\n- Tax Deduction (80% on first €250, 40% above): €{{tax_deduction}}\n- Net Cost: €{{net_cost}}\n- Effective Discount: {{discount_percent}}%\n\n{{recurring_bonus_info}}\n\nThis email serves as your official donation receipt for tax purposes. Please keep it for your tax declaration.\n\n**Donor Information:**\n- Name: {{full_name}}\n- Email: {{email}}\n- Date: {{date}}\n- Receipt ID: {{receipt_id}}\n\nThank you for supporting electronic music culture in Catalonia!\n\nBest regards,\nThe Elektr-Âme Team',
 'Hola {{first_name}},\n\n¡Gracias por tu generoso patrocinio de €{{amount}} a Elektr-Âme!\n\n**Información de Deducción Fiscal:**\n- Monto de Donación: €{{amount}}\n- Deducción Fiscal (80% primeros €250, 40% resto): €{{tax_deduction}}\n- Coste Neto: €{{net_cost}}\n- Descuento Efectivo: {{discount_percent}}%\n\n{{recurring_bonus_info}}\n\nEste correo sirve como tu recibo oficial de donación para efectos fiscales. Por favor, guárdalo para tu declaración de impuestos.\n\n**Información del Donante:**\n- Nombre: {{full_name}}\n- Email: {{email}}\n- Fecha: {{date}}\n- ID de Recibo: {{receipt_id}}\n\n¡Gracias por apoyar la cultura de música electrónica en Cataluña!\n\nSaludos,\nEl equipo de Elektr-Âme',
 'Hola {{first_name}},\n\nGràcies pel teu generós patrocini de €{{amount}} a Elektr-Âme!\n\n**Informació de Deducció Fiscal:**\n- Import de Donació: €{{amount}}\n- Deducció Fiscal (80% primers €250, 40% resta): €{{tax_deduction}}\n- Cost Net: €{{net_cost}}\n- Descompte Efectiu: {{discount_percent}}%\n\n{{recurring_bonus_info}}\n\nAquest correu serveix com el teu rebut oficial de donació per a efectes fiscals. Si us plau, guarda''l per a la teva declaració d''impostos.\n\n**Informació del Donant:**\n- Nom: {{full_name}}\n- Email: {{email}}\n- Data: {{date}}\n- ID de Rebut: {{receipt_id}}\n\nGràcies per donar suport a la cultura de música electrònica a Catalunya!\n\nSalutacions,\nL''equip d''Elektr-Âme'
);

-- Insert Default Automation Rules
INSERT INTO email_automation_rules (rule_name, trigger_type, template_id, days_offset, active) VALUES
('Welcome Email', 'member_registered', 1, 0, TRUE),
('Approval Notification', 'member_approved', 2, 0, TRUE),
('7-Day Expiration Warning', 'membership_expiring_7d', 3, -7, TRUE),
('3-Day Expiration Warning', 'membership_expiring_3d', 4, -3, TRUE),
('Renewal Confirmation', 'membership_renewed', 5, 0, TRUE);

