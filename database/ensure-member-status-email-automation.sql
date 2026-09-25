-- Run once in phpMyAdmin (or MySQL client) on production if members never receive
-- approval / rejection emails after admin changes status.
-- Safe to re-run: only inserts when rows are missing.

-- 1) Rejection email template (not in the original email-automation-tables seed)
INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca, active)
SELECT
  'member_rejected',
  'Membership application not approved',
  'Update on your Elektr-Âme membership application',
  'Actualización sobre tu solicitud de membresía de Elektr-Âme',
  'Actualització sobre la teva sol·licitud de pertinença a Elektr-Âme',
  'Hi {{first_name}},

Thank you for your interest in Elektr-Âme. After review, we are unable to approve your membership application at this time.

If you believe this is a mistake, you may contact us at contact@elektr-ame.com.

Best regards,
The Elektr-Âme Team',
  'Hola {{first_name}},

Gracias por tu interés en Elektr-Âme. Tras la revisión, no podemos aprobar tu solicitud de membresía en este momento.

Si crees que es un error, escríbenos a contact@elektr-ame.com.

Saludos,
El equipo de Elektr-Âme',
  'Hola {{first_name}},

Gràcies pel teu interès en Elektr-Âme. Després de la revisió, no podem aprovar la teva sol·licitud de pertinença en aquest moment.

Si creus que és un error, escriu-nos a contact@elektr-ame.com.

Salutacions,
L''equip d''Elektr-Âme',
  1
FROM (SELECT 1) AS _seed
WHERE NOT EXISTS (SELECT 1 FROM email_templates t WHERE t.template_key = 'member_rejected' LIMIT 1);

-- 2) Automation rules linking triggers to templates (if missing)
-- AND NOT EXISTS must be in WHERE (cannot be written after LIMIT 1)
INSERT INTO email_automation_rules (rule_name, trigger_type, template_id, days_offset, active)
SELECT 'Approval notification', 'member_approved', et.id, 0, 1
FROM email_templates et
WHERE et.template_key = 'member_approved'
  AND NOT EXISTS (SELECT 1 FROM email_automation_rules e WHERE e.trigger_type = 'member_approved' LIMIT 1)
LIMIT 1;

INSERT INTO email_automation_rules (rule_name, trigger_type, template_id, days_offset, active)
SELECT 'Rejection notification', 'member_rejected', et.id, 0, 1
FROM email_templates et
WHERE et.template_key = 'member_rejected'
  AND NOT EXISTS (SELECT 1 FROM email_automation_rules e WHERE e.trigger_type = 'member_rejected' LIMIT 1)
LIMIT 1;
