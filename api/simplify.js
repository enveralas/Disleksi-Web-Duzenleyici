export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Sadece POST"
    });

  }

  try {

    const { text } = req.body;

    if (!text) {

      return res.status(400).json({
        error: "Text gerekli"
      });

    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({

          model: "gpt-4o-mini",

          messages: [
            {
              role: "system",

              content:
                "Sen disleksi bireyler için metin sadeleştiren yardımcı bir asistansın. Metni kısa, basit ve anlaşılır hale getir. Sadece sadeleştirilmiş metni döndür."
            },

            {
              role: "user",
              content: text
            }
          ],

          temperature: 0.3

        })

      }
    );

    const data = await response.json();

    if (!response.ok) {

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI API hatası"
      });

    }

    const output =
      data?.choices?.[0]?.message?.content;

    return res.status(200).json({
      result: output
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

}