-- Add Member Invitation Email Template
-- This template is used when a member invites someone to join Elektr-Âme

INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca, active) VALUES
('member_invitation', 'Member Invitation', 
 'You''ve been invited to join Elektr-Âme! 🎵',
 '¡Has sido invitado a unirte a Elektr-Âme! 🎵',
 'Has estat convidat a unir-te a Elektr-Âme! 🎵',
 'Hello {{invitee_first_name}},

{{inviter_name}} has invited you to join Elektr-Âme, an electronic music community and association based in Barcelona.

**About Elektr-Âme:**
We''re a community focused on developing electronic music projects, hosting events, and building a network of artists and enthusiasts.

**What you''ll get:**
- Access to exclusive events and workshops
- Networking opportunities with artists and producers
- Digital membership card
- Support for the electronic music community

**Join us now:**
Click here to register: {{invitation_link}}

This link includes a special invitation code from {{inviter_name}}.

If you have any questions, feel free to reach out to us at contact@elektr-ame.com.

We hope to see you soon!

Best regards,
The Elektr-Âme Team

---
This invitation was sent by {{inviter_name}}.
If you didn''t expect this invitation, you can safely ignore this email.',
 'Hola {{invitee_first_name}},

{{inviter_name}} te ha invitado a unirte a Elektr-Âme, una comunidad y asociación de música electrónica con sede en Barcelona.

**Acerca de Elektr-Âme:**
Somos una comunidad enfocada en desarrollar proyectos de música electrónica, organizar eventos y construir una red de artistas y entusiastas.

**Lo que obtendrás:**
- Acceso a eventos y talleres exclusivos
- Oportunidades de networking con artistas y productores
- Tarjeta de miembro digital
- Apoyo para la comunidad de música electrónica

**Únete ahora:**
Haz clic aquí para registrarte: {{invitation_link}}

Este enlace incluye un código de invitación especial de {{inviter_name}}.

Si tienes alguna pregunta, no dudes en contactarnos en contact@elektr-ame.com.

¡Esperamos verte pronto!

Saludos,
El equipo de Elektr-Âme

---
Esta invitación fue enviada por {{inviter_name}}.
Si no esperabas esta invitación, puedes ignorar este correo de forma segura.',
 'Hola {{invitee_first_name}},

{{inviter_name}} t''ha convidat a unir-te a Elektr-Âme, una comunitat i associació de música electrònica amb seu a Barcelona.

**Sobre Elektr-Âme:**
Som una comunitat enfocada a desenvolupar projectes de música electrònica, organitzar esdeveniments i construir una xarxa d''artistes i entusiastes.

**El que obtindràs:**
- Accés a esdeveniments i tallers exclusius
- Oportunitats de networking amb artistes i productors
- Targeta de membre digital
- Suport per a la comunitat de música electrònica

**Uneix-te ara:**
Fes clic aquí per registrar-te: {{invitation_link}}

Aquest enllaç inclou un codi d''invitació especial de {{inviter_name}}.

Si tens alguna pregunta, no dubtis a contactar-nos a contact@elektr-ame.com.

Esperem veure''t aviat!

Salutacions,
L''equip d''Elektr-Âme

---
Aquesta invitació va ser enviada per {{inviter_name}}.
Si no esperaves aquesta invitació, pots ignorar aquest correu de forma segura.',
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

