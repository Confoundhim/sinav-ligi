export const emailTemplates = {
  welcome: (displayName: string) => ({
    subject: "Sınav Ligi'ne Hoş Geldiniz!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #6366f1; margin-bottom: 16px;">Sınav Ligi'ne Hoş Geldiniz!</h1>
        <p>Merhaba <strong>${displayName}</strong>,</p>
        <p>Sınav Ligi platformuna başarıyla kayıt oldunuz. Şimdi öğrenme yolculuğunuza başlayabilirsiniz!</p>
        <ul style="line-height: 2;">
          <li>Haftalık sınavlara katılın ve burs kazanın</li>
          <li>Düello yaparak kendinizi test edin</li>
          <li>Rozet kazanın ve liderlik tablosunda yükselin</li>
        </ul>
        <p>Başarılar dileriz!</p>
        <p style="color: #6b7280;">Sınav Ligi Ekibi</p>
      </div>
    `,
  }),

  passwordReset: (resetToken: string, resetUrl: string) => ({
    subject: 'Şifre Sıfırlama Talebi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #6366f1; margin-bottom: 16px;">Şifre Sıfırlama</h1>
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}/reset-password?token=${resetToken}"
             style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Bu bağlantı 15 dakika geçerlidir.</p>
        <p style="color: #6b7280; font-size: 14px;">Bu talebi siz yapmadıysanız, e-postayı görmezden gelebilirsiniz.</p>
      </div>
    `,
  }),

  scholarship: (displayName: string, amount: number, rank: number) => ({
    subject: 'Burs Kazandınız!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #6366f1; margin-bottom: 16px;">Tebrikler!</h1>
        <p>Merhaba <strong>${displayName}</strong>,</p>
        <p>
          Haftalık sınavda <strong>${rank}. sıraya</strong> girdiniz ve
          <strong>${amount.toLocaleString('tr-TR')} TL</strong> burs kazandınız!
        </p>
        <p>Burs ödülünüz cüzdanınıza eklendi.</p>
        <p>Başarılarınızın devamını dileriz!</p>
        <p style="color: #6b7280;">Sınav Ligi Ekibi</p>
      </div>
    `,
  }),
};
