-- Add Payment Confirmation Email Template
-- This template is sent after a successful payment

INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca, active) VALUES
('payment_confirmation', 'Payment Confirmation', 
 'Payment Confirmed - Elektr-Âme Membership',
 'Pago Confirmado - Membresía Elektr-Âme',
 'Pagament Confirmat - Membresía Elektr-Âme',
 'Hi {{first_name}},

Thank you for your payment!

**Payment Details:**
- Amount: €{{amount}}
- Membership Type: {{membership_type}}
- Payment Date: {{date}}
- Status: Confirmed

Your membership has been activated and you now have full access to all member benefits.

Access your member portal: https://www.elektr-ame.com/member-portal

If you have any questions, please contact us at contact@elektr-ame.com.

Best regards,
The Elektr-Âme Team',
 'Hola {{first_name}},

¡Gracias por tu pago!

**Detalles del Pago:**
- Monto: €{{amount}}
- Tipo de Membresía: {{membership_type}}
- Fecha de Pago: {{date}}
- Estado: Confirmado

Tu membresía ha sido activada y ahora tienes acceso completo a todos los beneficios de miembro.

Accede a tu portal de miembro: https://www.elektr-ame.com/member-portal

Si tienes alguna pregunta, por favor contáctanos en contact@elektr-ame.com.

Saludos,
El equipo de Elektr-Âme',
 'Hola {{first_name}},

Gràcies pel teu pagament!

**Detalls del Pagament:**
- Import: €{{amount}}
- Tipus de Membresía: {{membership_type}}
- Data de Pagament: {{date}}
- Estat: Confirmat

La teva membresía ha estat activada i ara tens accés complet a tots els beneficis de membre.

Accedeix al teu portal de membre: https://www.elektr-ame.com/member-portal

Si tens alguna pregunta, si us plau contacta''ns a contact@elektr-ame.com.

Salutacions,
L''equip d''Elektr-Âme',
 TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    subject_en = VALUES(subject_en),
    subject_es = VALUES(subject_es),
    subject_ca = VALUES(subject_ca),
    body_en = VALUES(body_en),
    body_es = VALUES(body_es),
    body_ca = VALUES(body_ca),
    active = VALUES(active);

