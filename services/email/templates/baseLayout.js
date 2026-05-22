/**
 * Quantéra Base Email Layout — Gmail-Safe Version
 * Uses table-based HTML for 100% compatibility across all email clients.
 *
 * @param {string} title  - Optional hero title (leave empty string to skip)
 * @param {string} content - The main body HTML
 * @param {string} ctaLabel - Optional button text
 * @param {string} ctaLink  - Optional button URL
 */
const baseLayout = (title, content, ctaLabel = '', ctaLink = '#') => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Quantéra</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; background-color: #0d0d0d; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0d0d0d">
  <tr>
    <td align="center" style="padding:24px 10px;">

      <!-- Email Container -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#141414;border-radius:12px;overflow:hidden;">

        <!-- ===== HEADER ===== -->
        <tr>
          <td align="center" style="padding:28px 40px 20px 40px;background-color:#141414;border-bottom:1px solid #222;">
            <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:3px;color:#ffffff;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">QUANTERA</p>
          </td>
        </tr>

        ${title ? `
        <!-- ===== HERO TITLE ===== -->
        <tr>
          <td align="center" style="padding:30px 40px 10px 40px;background-color:#141414;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">${title}</p>
          </td>
        </tr>
        ` : ''}

        <!-- ===== CONTENT ===== -->
        <tr>
          <td style="padding:0;background-color:#141414;">
            ${content}
          </td>
        </tr>

        ${ctaLabel ? `
        <!-- ===== CTA BUTTON ===== -->
        <tr>
          <td align="center" style="padding:0 40px 30px 40px;background-color:#141414;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#00b894" style="border-radius:6px;">
                  <a href="${ctaLink}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#000000;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- ===== FOOTER ===== -->
        <tr>
          <td align="center" style="padding:24px 40px;background-color:#0f0f0f;border-top:1px solid #222;">
            <p style="margin:0 0 8px 0;font-size:12px;color:#666666;font-family:'Segoe UI',Arial,sans-serif;">© 2026 Quantéra Laptop Store. All rights reserved.</p>
            <p style="margin:0 0 12px 0;font-size:12px;color:#555555;font-family:'Segoe UI',Arial,sans-serif;">
              <a href="#" style="color:#555555;text-decoration:none;margin:0 8px;">Instagram</a> |
              <a href="#" style="color:#555555;text-decoration:none;margin:0 8px;">Twitter</a> |
              <a href="#" style="color:#555555;text-decoration:none;margin:0 8px;">LinkedIn</a>
            </p>
            <p style="margin:0;font-size:11px;color:#444444;font-family:'Segoe UI',Arial,sans-serif;">
              You're receiving this because you signed up on our platform. &nbsp;
              <a href="#" style="color:#555555;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
      <!-- / Email Container -->

    </td>
  </tr>
</table>
<!-- / Outer wrapper -->

</body>
</html>`;

module.exports = baseLayout;
