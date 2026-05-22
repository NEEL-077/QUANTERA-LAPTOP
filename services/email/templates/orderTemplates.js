const baseLayout = require('./baseLayout');
// Note: Gmail blocks Base64 data URIs in <img> — icons use pure CSS/HTML instead

/**
 * Shared helper: renders a single product item row as a table (Gmail-safe)
 */
const renderItemRow = (item, baseUrl) => {
  let imageUrl = '';
  if (item.image) {
    imageUrl = item.image.startsWith('http')
      ? item.image
      : `${baseUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`;
  }
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        ${imageUrl ? `
        <td width="80" valign="top" style="padding-right:14px;">
          <img src="${imageUrl}" alt="${item.name}" width="70" height="70" style="width:70px;height:70px;object-fit:cover;border-radius:6px;background-color:#ffffff;display:block;">
        </td>
        ` : ''}
        <td valign="top">
          <p style="margin:0 0 3px 0;font-size:13px;font-weight:700;color:#888888;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">${item.brand || 'Quantéra'}</p>
          <p style="margin:0 0 6px 0;font-size:14px;color:#dddddd;font-family:'Segoe UI',Arial,sans-serif;line-height:1.4;">${item.name}</p>
          <p style="margin:0 0 6px 0;font-size:12px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Qty: <strong style="color:#cccccc;">${item.quantity}</strong></p>
        </td>
        <td width="100" valign="top" align="right">
          <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">&#8377;${item.subtotal.toLocaleString()}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr><td style="height:1px;background-color:#2a2a2a;font-size:1px;line-height:1px;">&nbsp;</td></tr>
    </table>`;
};

/**
 * Shared helper: renders price breakup section (Gmail-safe)
 */
const renderPriceBreakup = (order) => {
  const { totalAmount, discount, shipping } = order;
  const subtotal = order.subtotal || totalAmount;
  return `
    <!-- Price Breakup Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
      <tr><td bgcolor="#1e1e1e" style="border-radius:8px;padding:20px;">
        <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;border-bottom:1px solid #333333;padding-bottom:12px;">Price Breakup</p>
        <!-- Subtotal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td><p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Subtotal</p></td>
            <td align="right"><p style="margin:0;font-size:13px;color:#dddddd;font-family:'Segoe UI',Arial,sans-serif;">&#8377;${subtotal.toLocaleString()}</p></td>
          </tr>
        </table>
        <!-- Discount -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td><p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Discount</p></td>
            <td align="right"><p style="margin:0;font-size:13px;color:#00b894;font-family:'Segoe UI',Arial,sans-serif;">- &#8377;${discount ? discount.toLocaleString() : '0'}</p></td>
          </tr>
        </table>
        <!-- Shipping -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
          <tr>
            <td><p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Shipping Fee</p></td>
            <td align="right"><p style="margin:0;font-size:13px;color:#dddddd;font-family:'Segoe UI',Arial,sans-serif;">${shipping > 0 ? '&#8377;' + shipping.toLocaleString() : 'FREE'}</p></td>
          </tr>
        </table>
        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
          <tr><td style="height:1px;background-color:#333333;font-size:1px;line-height:1px;">&nbsp;</td></tr>
        </table>
        <!-- Total -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
          <tr>
            <td><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Total Amount</p></td>
            <td align="right"><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">&#8377;${totalAmount.toLocaleString()}</p></td>
          </tr>
        </table>
        <!-- Net Paid highlight -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="#2a2a2a" style="border-radius:6px;padding:14px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Net Paid</p></td>
                  <td align="right"><p style="margin:0;font-size:16px;font-weight:800;color:#00b894;font-family:'Segoe UI',Arial,sans-serif;">&#8377;${totalAmount.toLocaleString()}</p></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>`;
};

/**
 * Order Confirmation Email — Full Myntra-style dark theme
 */
const orderConfirmation = (order) => {
  const { orderId, totalAmount, customer, items, shippingAddress, payment } = order;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const itemsHtml = items.map(item => renderItemRow(item, baseUrl)).join('');

  const deliveryDateObj = order.tracking && order.tracking.estimatedDelivery
    ? new Date(order.tracking.estimatedDelivery)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deliveryDateStr = deliveryDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const isCOD = payment.method && (payment.method.toLowerCase().includes('cod') || payment.method.toLowerCase().includes('cash'));

  const content = `
    <!-- Greeting -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding:24px 40px 16px 40px;background-color:#141414;">
        <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Hello, <span style="text-transform:uppercase;">${customer.name}</span>!</p>
      </td></tr>
    </table>

    <!-- Green Confirmed Banner -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#00b894" style="border-radius:10px;">
          <tr><td style="padding:24px;">
            <!-- Check + Title -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <tr>
                <td width="36" valign="top" style="padding-top:2px;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td bgcolor="#000000" align="center" valign="middle" style="width:28px;height:28px;border-radius:50%;font-size:16px;font-weight:900;color:#00b894;font-family:Arial,sans-serif;line-height:28px;text-align:center;" width="28">&#10003;</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding-left:10px;">
                  <p style="margin:0 0 6px 0;font-size:17px;font-weight:800;color:#000000;font-family:'Segoe UI',Arial,sans-serif;">Sit Back And Relax. Your Order is Confirmed!</p>
                  <p style="margin:0 0 6px 0;font-size:13px;color:#111111;font-family:'Segoe UI',Arial,sans-serif;">We've begun prepping it right away. You'll be notified when it ships.</p>
                  <p style="margin:0;font-size:12px;color:#222222;font-family:'Segoe UI',Arial,sans-serif;">For a safer experience, you can pay online before delivery.</p>
                </td>
              </tr>
            </table>
            <!-- CTA Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="${isCOD ? '48%' : '100%'}" style="${isCOD ? 'padding-right:8px;' : ''}">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="#000000" align="center" style="border-radius:5px;">
                      <a href="${baseUrl}/order-tracking?id=${orderId}" style="display:block;padding:11px 10px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-align:center;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;">View Order Details</a>
                    </td></tr>
                  </table>
                </td>
                ${isCOD ? `
                <td width="48%" style="padding-left:8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="#111111" align="center" style="border-radius:5px;border:1px solid #333333;">
                      <a href="${baseUrl}/checkout" style="display:block;padding:11px 10px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-align:center;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;">Pay Online</a>
                    </td></tr>
                  </table>
                </td>` : ''}
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Delivery Estimate -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="10" valign="middle">
              <table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#00b894" style="width:8px;height:8px;border-radius:50%;font-size:1px;">&nbsp;</td></tr></table>
            </td>
            <td style="padding-left:10px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#cccccc;font-family:'Segoe UI',Arial,sans-serif;">Estimated Delivery: <span style="color:#00b894;">${deliveryDateStr}</span></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Feedback Section -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#00b894;font-family:'Segoe UI',Arial,sans-serif;">Please Share Your Experience</p>
            <p style="margin:0 0 16px 0;font-size:12px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">How likely are you to recommend Quantéra to friends and family?</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:8px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ff4757" align="center" style="border-radius:50%;width:34px;height:34px;"><p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;line-height:34px;width:34px;text-align:center;font-family:Arial,sans-serif;">1</p></td></tr></table></td>
                <td style="padding-right:8px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ff7f50" align="center" style="border-radius:50%;width:34px;height:34px;"><p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;line-height:34px;width:34px;text-align:center;font-family:Arial,sans-serif;">2</p></td></tr></table></td>
                <td style="padding-right:8px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#ffa502" align="center" style="border-radius:50%;width:34px;height:34px;"><p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;line-height:34px;width:34px;text-align:center;font-family:Arial,sans-serif;">3</p></td></tr></table></td>
                <td style="padding-right:8px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#7bed9f" align="center" style="border-radius:50%;width:34px;height:34px;"><p style="margin:0;font-size:13px;font-weight:700;color:#000000;line-height:34px;width:34px;text-align:center;font-family:Arial,sans-serif;">4</p></td></tr></table></td>
                <td><table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#2ed573" align="center" style="border-radius:50%;width:34px;height:34px;"><p style="margin:0;font-size:13px;font-weight:700;color:#000000;line-height:34px;width:34px;text-align:center;font-family:Arial,sans-serif;">5</p></td></tr></table></td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
              <tr>
                <td><p style="margin:0;font-size:11px;color:#666666;font-family:'Segoe UI',Arial,sans-serif;">Very Poor</p></td>
                <td align="right"><p style="margin:0;font-size:11px;color:#666666;font-family:'Segoe UI',Arial,sans-serif;">Very Good</p></td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Quick Details & Products -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Quick Details</p>
            <p style="margin:0 0 4px 0;font-size:11px;color:#666666;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Order ID</p>
            <p style="margin:0 0 20px 0;font-size:13px;color:#aaaaaa;font-family:'Segoe UI',Arial,sans-serif;">${orderId}</p>
            <!-- divider -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr><td style="height:1px;background-color:#2a2a2a;font-size:1px;line-height:1px;">&nbsp;</td></tr>
            </table>
            ${itemsHtml}
            <p style="margin:0;font-size:11px;color:#555555;font-family:'Segoe UI',Arial,sans-serif;">Sold by: Quantéra Retail Private Limited</p>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Price Breakup -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        ${renderPriceBreakup(order)}
      </td></tr>
    </table>

    <!-- Payment Method -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:16px 20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#2a2a2a" style="border-radius:4px;padding:6px 12px;">
                  <p style="margin:0;font-size:13px;color:#cccccc;font-family:Arial,sans-serif;font-weight:700;">&#8377;</p>
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Payment: <strong style="color:#ff4757;">${payment.method}</strong></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Delivery Address -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Delivering at</p>
            <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#ffffff;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">${customer.name}</p>
            <p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">
              ${shippingAddress.street}<br>
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
              ${shippingAddress.country}
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- What's Next / Need Help -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 24px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="48%" valign="top" bgcolor="#1e1e1e" style="border-radius:8px;padding:18px;">
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">What's next?</p>
              <p style="margin:0;font-size:12px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;line-height:1.5;">We will confirm once your order is prepped and ready to ship.</p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" valign="top" bgcolor="#1e1e1e" style="border-radius:8px;padding:18px;">
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Need help?</p>
              <p style="margin:0;font-size:12px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;line-height:1.5;">For queries or assistance, <a href="${baseUrl}/contact" style="color:#ff4757;text-decoration:none;">contact us</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>`;

  return baseLayout('', content, '', '');
};

/**
 * Order Status Update Email — Dark theme, includes full order details
 */
const statusUpdate = (order, status, note = '') => {
  const { orderId, customer, items, shippingAddress, payment } = order;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Status tracker helper
  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const currentIdx = steps.indexOf(status);

  const stepCells = steps.map((step, i) => {
    const isDone = i <= currentIdx;
    const isCurrent = i === currentIdx;
    const bg = isDone ? '#00b894' : '#2a2a2a';
    const textColor = isDone ? '#000000' : '#666666';
    const labelColor = isCurrent ? '#ffffff' : (isDone ? '#cccccc' : '#555555');
    const labelWeight = isCurrent ? '700' : '400';
    const symbol = i < currentIdx ? '&#10003;' : (i + 1).toString(); // plain text checkmark is fine in small circles
    return `
        <td align="center" valign="top" width="25%">
          <table cellpadding="0" cellspacing="0" border="0" align="center">
            <tr><td bgcolor="${bg}" align="center" style="border-radius:50%;width:32px;height:32px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:${textColor};line-height:32px;width:32px;text-align:center;font-family:Arial,sans-serif;">${symbol}</p>
            </td></tr>
            <tr><td align="center" style="padding-top:7px;">
              <p style="margin:0;font-size:11px;font-weight:${labelWeight};color:${labelColor};font-family:'Segoe UI',Arial,sans-serif;">${step}</p>
            </td></tr>
          </table>
        </td>`;
  }).join('');

  // Connector line — progress as simple colored table cells
  const lineSegments = steps.slice(0, -1).map((_, i) => {
    const filled = i < currentIdx;
    return `<td width="33%" bgcolor="${filled ? '#00b894' : '#2a2a2a'}" style="height:2px;font-size:1px;line-height:1px;">&nbsp;</td>`;
  }).join('');

  // Premium CSS-styled status badge (Gmail-safe — no images needed)
  const statusColors = {
    'Placed': { bg: '#2a2a2a', text: '#cccccc', symbol: '&#9679;' },
    'Processing': { bg: '#1a3a5c', text: '#4fc3f7', symbol: '&#9677;' },
    'Shipped': { bg: '#1a3a2a', text: '#00b894', symbol: '&#9652;' },
    'Delivered': { bg: '#1a3a2a', text: '#2ed573', symbol: '&#10003;' }
  };
  const sc = statusColors[status] || statusColors['Placed'];

  const itemsHtml = (items || []).map(item => renderItemRow(item, baseUrl)).join('');

  const content = `
    <!-- Greeting -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:24px 32px 16px 32px;background-color:#141414;">
        <p style="margin:0 0 6px 0;font-size:14px;color:#cccccc;font-family:'Segoe UI',Arial,sans-serif;">Hi <strong>${customer.name}</strong>,</p>
        <p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Quick update on your order <strong style="color:#aaaaaa;">${orderId}</strong>.</p>
      </td></tr>
    </table>

    <!-- Status Tracker -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <!-- Progress line row -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
              <tr>
                <td width="16%">&nbsp;</td>
                ${lineSegments}
                <td width="16%">&nbsp;</td>
              </tr>
            </table>
            <!-- Step circles row -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>${stepCells}</tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Status Badge (CSS-only, Gmail-safe) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding:4px 24px 20px 24px;background-color:#141414;">
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;">
          <tr>
            <td bgcolor="${sc.bg}" align="center" style="border-radius:50px;padding:14px 28px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:${sc.text};font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">${sc.symbol}&nbsp;&nbsp;${status.toUpperCase()}</p>
            </td>
          </tr>
        </table>
        ${note ? `<p style="margin:0;font-size:13px;color:#888888;font-style:italic;font-family:'Segoe UI',Arial,sans-serif;">&ldquo;${note}&rdquo;</p>` : ''}
      </td></tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background-color:#222222;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
      </td></tr>
    </table>

    <!-- Items Ordered -->
    ${items && items.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Items Ordered</p>
            ${itemsHtml}
            <p style="margin:0;font-size:11px;color:#555555;font-family:'Segoe UI',Arial,sans-serif;">Sold by: Quantéra Retail Private Limited</p>
          </td></tr>
        </table>
      </td></tr>
    </table>` : ''}

    <!-- Price Breakup -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        ${renderPriceBreakup(order)}
      </td></tr>
    </table>

    <!-- Delivery Address -->
    ${shippingAddress ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 16px 24px;background-color:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">Delivering at</p>
            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#ffffff;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">${customer.name}</p>
            <p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">
              ${shippingAddress.street}<br>
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
              ${shippingAddress.country}
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>` : ''}

    <!-- Help Section -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:0 24px 24px 24px;background-color:#141414;">
        <p style="margin:0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;text-align:center;">
          Track your order anytime. For help, <a href="${baseUrl}/contact" style="color:#00b894;text-decoration:none;">contact us</a>.
        </p>
      </td></tr>
    </table>`;

  return baseLayout('Order Status Update', content, 'View Tracking Details', `${baseUrl}/order-tracking?id=${orderId}`);
};

/**
 * Admin Notification — New Order
 */
const adminNewOrder = (order) => {
  const { orderId, totalAmount, customer } = order;
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:24px 32px;background-color:#141414;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td valign="middle" style="padding-right:12px;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td bgcolor="#ff4757" align="center" valign="middle" style="width:32px;height:32px;border-radius:50%;font-size:16px;font-weight:900;color:#ffffff;font-family:Arial,sans-serif;line-height:32px;text-align:center;" width="32">!</td>
              </tr></table>
            </td>
            <td valign="middle"><p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">New Order Received</p></td>
          </tr>
        </table>
        <p style="margin:0 0 16px 0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">A new order has been successfully placed on Quantéra.</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e1e1e" style="border-radius:8px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:#aaaaaa;font-family:'Segoe UI',Arial,sans-serif;"><strong style="color:#ffffff;">Order ID:</strong> ${orderId}</p>
            <p style="margin:0 0 10px 0;font-size:13px;color:#aaaaaa;font-family:'Segoe UI',Arial,sans-serif;"><strong style="color:#ffffff;">Customer:</strong> ${customer.name} (${customer.email})</p>
            <p style="margin:0;font-size:13px;color:#aaaaaa;font-family:'Segoe UI',Arial,sans-serif;"><strong style="color:#ffffff;">Amount:</strong> <span style="color:#00b894;font-weight:700;">&#8377;${totalAmount.toLocaleString()}</span></p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:13px;color:#888888;font-family:'Segoe UI',Arial,sans-serif;">Log in to the admin panel to process this order promptly.</p>
      </td></tr>
    </table>`;
  return baseLayout('New Admin Alert', content, 'Go to Dashboard', '/admin?tab=orders');
};

module.exports = { orderConfirmation, statusUpdate, adminNewOrder };
