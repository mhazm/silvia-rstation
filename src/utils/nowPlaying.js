const cheerio = require('cheerio');

async function getNowPlaying() {
  try {
    const res = await fetch('http://212.84.160.3:9542/played.html?sid=1', {
      timeout: 5000,
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let song = null;

    $('td').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.includes('-') && text.length > 5) {
        song = text;
        return false;
      }
    });

    return song;
  } catch {
    return null;
  }
}

module.exports = { getNowPlaying };