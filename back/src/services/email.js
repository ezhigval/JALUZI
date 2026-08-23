const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function isEmailConfigured() {
  return Boolean(config.email.host);
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    const port = config.email.port;
    const secure =
      typeof config.email.secure === 'boolean'
        ? config.email.secure
        : port === 465;

    const transport = {
      disableFileAccess: true,
      disableUrlAccess: true,
      host: config.email.host,
      port,
      secure
    };

    if (config.email.user || config.email.pass) {
      transport.auth = {
        user: config.email.user || 'mailpit',
        pass: config.email.pass || 'mailpit'
      };
    }

    transporter = nodemailer.createTransport(transport);
  }

  return transporter;
}

async function sendOrderEmail(order) {
  const blindsType = order.blindsType || order.blinds_type || '—';
  const fromAddress = config.email.user || 'orders@piter-jaluzi.local';

  if (!isEmailConfigured()) {
    return { success: false, skipped: true, error: 'Email transport is not configured' };
  }

  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"Питер-Жалюзи" <${fromAddress}>`,
      to: fromAddress,
      subject: `🔔 Заявка: ${order.name}`,
      html: `<b>Новая заявка</b><br>👤 ${order.name}<br>📱 ${order.phone}<br>🪟 ${blindsType}<br>💬 ${order.message || '—'}`,
    });
    return { success: true };
  } catch (e) {
    console.error('Email error:', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = { sendOrderEmail, isEmailConfigured, getTransporter };
