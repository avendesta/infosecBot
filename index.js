const axios = require("axios").default;
const cheerio = require("cheerio");

const fetchHtml = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch(e) {
    console.error(e);
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

async function fetchContent(link){
  const html = await fetchHtml(link);
  const $ = cheerio.load(html);
  return $("#layout-").text()
}

// check the bot id from BotFather is set as environment varible: in linux export BOT_ID="xxxxx"
async function checkEnv(){
  if (process.env.BOT_ID) {
    console.log("✅: BOT_ID found\n");
  }
  else{
    console.error("❌: You need to set BOT_ID to environment variables\n");
    process.exit();
  }
}

async function publishNews(news) {
  const BOT_ID = process.env.BOT_ID;
  const CHANNEL_ID = "@infosecfeed"
  let content = await fetchContent(news.link);

  content = content.substring(0,3500);
  content = content.replace(/(?:^[\s\u00a0]+)|(?:[\s\u00a0]+$)/g, ' '); // remove &nbsp
  content = content.replace(/&nbsp;/g, '');
  content = content.replace(/\n\s*\n/g, '\n\n'); // replace multiple newlines with double newlines
  content = content.replace(/[^\x00-\x7F]/g, ""); // remove non ascii characters
  // console.log(content);

  content = `${news.link}\n\n`+`*${news.headline}*\n`+`_${news.description}_\n\n`+content;
  content = encodeURIComponent(content);

  let publish_api_link = `https://api.telegram.org/bot${BOT_ID}/sendMessage?chat_id=${CHANNEL_ID}&text=${content}&parse_mode=Markdown&disable_web_page_preview=False`;
  await fetchHtml(publish_api_link);
}


  /* Excutions starts here */


let latest_news = {
  headline: "",
  description: "",
  cover: "",
  link: "",
  datetime: new Date(),
};
let last_news_date = new Date();

async function latestNews(news_list) {
  for (let news of news_list) {
    if ( (news.datetime > last_news_date)){
      last_news_date = news.datetime;
      return news;
    } 
  }
  return null;
}

// This function fetches news, gets the latest ( not posted ) news, and post it
async function looper() {
  await checkEnv();
  let news_list = await fetchNews();
  console.log("✅:fetched\n");
  latest_news = await latestNews(news_list);
  if (latest_news) {
    await publishNews(latest_news);
    console.log("✅:News Posted!\n");
  }
}

setInterval(looper, 1000*60*10); // Every 10 minute
