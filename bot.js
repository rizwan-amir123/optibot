import { HfInference } from '@huggingface/inference'
import dotenv from 'dotenv'
import {Client, GatewayIntentBits} from "discord.js"

const hf = new HfInference(process.env.HF_TOKEN)
dotenv.config()

function getQuote() {
  return fetch("https://zenquotes.io/api/random")
    .then(res => {
      return res.json()
      })
    .then(data => {
      return data[0]["q"] + " -" + data[0]["a"]
    })
}

function getDog(){
  return fetch("https://dog.ceo/api/breeds/image/random")
  .then(response => response.json())
  .then(json => {
    console.log("json:", json);
   return json.message;
  });
}

async function getCat(){
  return await fetch("https://api.thecatapi.com/v1/images/search")
  .then(response => response.json())
  .then(arr => {
    console.log("arr:", arr);
   return arr[0].url;
  });
}

async function guessTone(text){
  return await hf.textClassification({
    model: 'distilbert-base-uncased-finetuned-sst-2-english',
    inputs: text
  })
}

async function summarize(text){
  return await hf.summarization({
    model: 'facebook/bart-large-cnn',
    inputs: text,
    parameters: {
      max_length: 100
    }
  })
}

async function translate(text){
  return await hf.translation({
    model: 'facebook/mbart-large-50-many-to-many-mmt',
    inputs: text,
    parameters: {
      "src_lang": "en_XX",
      "tgt_lang": "fr_XX"
    }
  })
}

async function textToImg(text){
  return await hf.textToImage({
    inputs: text,
    model: 'stabilityai/stable-diffusion-2',
    parameters: {
      negative_prompt: 'blurry',
    }
  })
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessageTyping
  ]
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const prefix = "!";

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "latency") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`This message had a latency of ${timeTaken}ms.`);
  }
  else if (command === "sum") {
    const numArgs = args.map(x => parseFloat(x));
    const sum = numArgs.reduce((counter, x) => counter += x);
    message.reply(`The sum of all the arguments you provided is ${sum}!`);
  }
  else if (command === "woof") {
      message.channel.send("Here's a doggo for you!"); //the reply to the user command
      const img = await getDog(); //fetches the URL from the API
      console.log("img:", img)
      message.channel.send(img); //sends the image URL to Discord
  }
  else if (command === "meow") {
      message.channel.send("Here's a cat for you!"); //the reply to the user command
      const img = await getCat(); //fetches the URL from the API
      console.log("img:", img)
      message.channel.send(img); //sends the image URL to Discord
  }
  else if (command === "eye") {
      message.channel.send("You are now subscribed to Eye-Break Reminders.");
      interval = setInterval (function () {
        message.channel.send("Please take an eye break now!")
        .catch(console.error); 
      }, 2000); //every hour
  }
  else if (command === "eyestop") {
    message.channel.send("I have stopped eye reminders.");
    clearInterval(interval);
  }
  else if (command === "inspire") {
    getQuote().then(quote => message.channel.send(quote))
  }
});

client.on('messageCreate', async msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
  if (msg.content === '!talk') {
    msg.reply('Pong!');
  }
  
  if (msg.content.substring(0,5) === '!tone') {
    const text = msg.content.substring(5, msg.content.length)
    const ans = await guessTone(text)
    console.log(ans)
    const rounded_zeroth = (ans[0].score).toFixed(2)*100
    const rounded_first = (ans[1].score).toFixed(2)*100
    setTimeout(() => {}, 2000)
    msg.reply(ans[0].label + ": " + String(rounded_zeroth) + "%\n" + ans[1].label + ": " 
    + String(rounded_first) + "%")
  }

  if (msg.content.substring(0,10) === '!summarize') {
    const text = msg.content.substring(10, msg.content.length)
    const ans = await summarize(text)
    setTimeout(() => {}, 2000)
    msg.reply(ans.summary_text)
  }

  if (msg.content.substring(0,8) === '!tran2FR') {
    const text = msg.content.substring(8, msg.content.length)
    //msg.channel.send("Processing...")
    const ans = await translate(text)
    setTimeout(() => {}, 2000)
    msg.channel.send(ans.translation_text)
  }

  if (msg.content.substring(0,9) === '!text2img') {
    const text = msg.content.substring(9, msg.content.length)
    const ans = await textToImg(text)
    //var file =  new File([ans], "Download.jpeg", { type: "image/jpeg" })
    //console.log(file)
    setTimeout(() => {}, 10000)
    var imageUrl = URL.createObjectURL(ans);

    msg.channel.send(ans);
    console.log(ans)
    //setTimeout(() => {}, 2000)
    //msg.reply(ans.translation_text)
  }

});


/*
client.on('messageCreate', msg => {
  console.log(msg.content)
  
});
*/

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token


