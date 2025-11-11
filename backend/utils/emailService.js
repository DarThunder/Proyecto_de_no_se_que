import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (to, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_HOST_USER,
    to: to,
    subject: "Restablecimiento de Contraseña para RopaDB",
    html: `
        <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace a continuación para continuar:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Este enlace expirará en 15 minutos. Si no solicitaste este cambio, por favor ignora este correo.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo de restablecimiento enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar el correo de restablecimiento:", error);
    throw new Error(
      "No se pudo enviar el correo de recuperación. Detalles: " + error.message
    );
  }
};
