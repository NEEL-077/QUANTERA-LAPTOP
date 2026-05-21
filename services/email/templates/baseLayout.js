/**
 * Quantéra Base Email Layout
 * A premium, clean responsive design mimicking high-end tech brands.
 * 
 * @param {string} title - The title/hero text of the email.
 * @param {string} content - The main body content.
 * @param {string} ctaLabel - Optional CTA button label.
 * @param {string} ctaLink - Optional CTA button URL.
 */
const baseLayout = (title, content, ctaLabel = '', ctaLink = '#') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }
        .header { padding: 40px 0; text-align: center; background: #0a0a0a; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .logo { height: 45px; margin-bottom: 10px; }
        .brand-name { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ffffff; margin: 0; text-transform: uppercase; }
        .hero { padding: 50px 40px; text-align: center; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); color: #ffffff; }
        .hero h1 { margin: 0; font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: -0.5px; }
        .hero p { margin-top: 15px; font-size: 18px; opacity: 0.8; font-weight: 300; }
        .content { padding: 50px 40px; line-height: 1.6; font-size: 16px; color: #444; }
        .footer { padding: 40px; text-align: center; background: #fdfdfd; border-top: 1px solid #eee; color: #888; font-size: 13px; letter-spacing: 0.3px; }
        .btn { display: inline-block; padding: 16px 36px; background: #000; color: #fff !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; transition: all 0.3s; margin-top: 30px; border: 1px solid #000; }
        .btn:hover { background: #333; transform: translateY(-2px); }
        .social-links { margin-top: 25px; }
        .social-links a { margin: 0 10px; color: #888; text-decoration: none; font-size: 14px; }
        .divider { height: 1px; background: #eee; margin: 30px 0; }
        @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; width: 100% !important; max-width: 100% !important; }
            .hero { padding: 40px 20px; }
            .content { padding: 40px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Replace with actual logo URL in production -->
            <div class="brand-name">QUANTERA</div>
        </div>
        
        <div class="hero">
            <h1>${title}</h1>
        </div>

        <div class="content">
            ${content}
            
            ${ctaLabel ? `
                <div style="text-align: center;">
                    <a href="${ctaLink}" class="btn">${ctaLabel}</a>
                </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>© 2026 Quantéra Laptop Store. All rights reserved.</p>
            <p>146 Tech Boulevard, Silicon Valley, CA</p>
            <div class="social-links">
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
                <a href="#">LinkedIn</a>
            </div>
            <p style="margin-top: 25px;">You're receiving this because you signed up on our platform.</p>
            <p><a href="#" style="color: #888;">Unsubscribe</a> | <a href="#" style="color: #888;">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>
`;

module.exports = baseLayout;
