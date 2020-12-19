const axios = require("axios").default;
const cheerio = require("cheerio");

const fetchHtml = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    console.error(
      `ERROR: An error occurred while trying to fetch the URL: ${url}`
    );
  }
};


async function fetchNews() {
  const html = await fetchHtml("https://www.infosecurity-magazine.com/news/");
  const $ = cheerio.load(html);
  let news_list = [];
  
  $("#webpages-list > div").each((i, el) => {
    let time = $(el).find("a > span > time").attr("datetime");
    let datetime = new Date(time);
    
    news_list.push({
      headline: $(el).find("a > h3").text(),
      description: $(el).find("p").text(),
      cover: $(el).find("a > img").attr("src"),
      link: $(el).find("a").attr("href"),
      datetime: datetime,
    });
  });
  return news_list.sort((x, y) => {
    return x.datetime - y.datetime;
  });
}


async function publishNews(news) {
  const BOT_ID = process.env.BOT_ID;
  const CHANNEL_ID = process.env.CHANNEL_ID;
  let publish_api_link = `https://api.telegram.org/bot${BOT_ID}/sendMessage?chat_id=${CHANNEL_ID}&text=${news.link}&disable_web_page_preview=False`;
  await fetchHtml(publish_api_link);
  console.log(`published news: ${news.link}`);
}



  /* Excutions starts here */


let latest_news = {
  headline: "",
  description: "",
  cover: "",
  link: "",
  datetime: new Date("2020-12-18T06:55:16.888Z"),
};
let last_news_date = new Date("2020-12-18T06:55:16.888Z");

async function latestNews(news_list) {
  for (let news of news_list) {
    if ( (news.datetime > last_news_date)){
      last_news_date = news.datetime;
      return news;
    } 
  }
  return null;
}

async function looper() {
  let news_list = await fetchNews();
  latest_news = await latestNews(news_list);
  if (latest_news) {
    await publishNews(latest_news);
  }
}

setInterval(looper, 1000*60*5); // Every 5 minutes
