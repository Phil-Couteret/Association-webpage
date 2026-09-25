-- Add DJ/Producer Artist Invitation Email Template
-- This template is sent to new members who selected DJ and/or Producer during registration
-- Asking if they want to be added to the artist list

INSERT INTO email_templates (template_key, name, subject_en, subject_es, subject_ca, body_en, body_es, body_ca, active) VALUES
('dj_producer_artist_invitation', 'DJ/Producer Artist Invitation', 
 'Welcome to Elektr-Âme! 🎵 Join Our Artist Community',
 '¡Bienvenido a Elektr-Âme! 🎵 Únete a Nuestra Comunidad de Artistas',
 'Benvingut a Elektr-Âme! 🎵 Uneix-te a la Nostra Comunitat d''Artistes',
 'Hi {{first_name}},

Welcome to Elektr-Âme! We''re thrilled to have you as part of our electronic music community.

We noticed that you''ve indicated you are a {{roles}} during registration. We''d love to feature you in our artist directory!

**Would you like to be featured in our artist list?**

If you''re interested in being featured, please contact us at contact@elektr-ame.com with the following information:

- Your artist name/stage name
- A brief bio or description
- Links to your social media profiles (Instagram, SoundCloud, Spotify, etc.)
- Links to your music/portfolio
- Any other information you''d like to share

We''ll help you set up your artist profile and get you featured on our website.

**Your registration status:**
Your registration has been received and is currently under review. You''ll receive a confirmation email once your membership is approved.

You can access your Member Portal at: https://www.elektr-ame.com/member-portal

If you have any questions, feel free to reach out to us at contact@elektr-ame.com.

Best regards,
The Elektr-Âme Team',
 'Hola {{first_name}},

¡Bienvenido a Elektr-Âme! Estamos encantados de tenerte como parte de nuestra comunidad de música electrónica.

Notamos que has indicado que eres {{roles}} durante el registro. ¡Nos encantaría tenerte en nuestro directorio de artistas!

**¿Te gustaría aparecer en nuestra lista de artistas?**

Si estás interesado en aparecer, por favor contáctanos en contact@elektr-ame.com con la siguiente información:

- Tu nombre artístico/nombre de escena
- Una breve biografía o descripción
- Enlaces a tus perfiles de redes sociales (Instagram, SoundCloud, Spotify, etc.)
- Enlaces a tu música/portafolio
- Cualquier otra información que te gustaría compartir

Te ayudaremos a configurar tu perfil de artista y a aparecer en nuestro sitio web.

**Estado de tu registro:**
Tu registro ha sido recibido y está en proceso de revisión. Recibirás un correo de confirmación una vez que tu membresía sea aprobada.

Puedes acceder a tu Portal de Miembros en: https://www.elektr-ame.com/member-portal

Si tienes alguna pregunta, no dudes en contactarnos en contact@elektr-ame.com.

Saludos,
El equipo de Elektr-Âme',
 'Hola {{first_name}},

Benvingut a Elektr-Âme! Estem encantats de tenir-te com a part de la nostra comunitat de música electrònica.

Hem notat que has indicat que ets {{roles}} durant el registre. Ens encantaria tenir-te al nostre directori d''artistes!

**T''agradaria aparèixer a la nostra llista d''artistes?**

Si estàs interessat en aparèixer, si us plau contacta''ns a contact@elektr-ame.com amb la següent informació:

- El teu nom artístic/nom d''escena
- Una breu biografia o descripció
- Enllaços als teus perfils de xarxes socials (Instagram, SoundCloud, Spotify, etc.)
- Enllaços a la teva música/portafoli
- Qualsevol altra informació que t''agradaria compartir

T''ajudarem a configurar el teu perfil d''artista i a aparèixer al nostre lloc web.

**Estat del teu registre:**
El teu registre ha estat rebut i està en procés de revisió. Rebràs un correu de confirmació un cop la teva membresía sigui aprovada.

Pots accedir al teu Portal de Membres a: https://www.elektr-ame.com/member-portal

Si tens alguna pregunta, no dubtis en contactar-nos a contact@elektr-ame.com.

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

