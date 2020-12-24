// Connexion parameters (fill those in) -------------
const tsIp = "<teamspeak server address>";
const tsSqUsername = '<teamspeak server query username>';
const tsSqPassword = '<teamsspeak server query password>';
const twApiKey = 'twitter API key>';
const twApiSKey = '<twitter API key secret>';
const twAT = '<twitter user Access Token>';
const twATs = '<twitter user Acccess Token secret>';
// --------------------------------------------------

const TeamspeakQuery = require('teamspeak-query');
const query = new TeamspeakQuery.Raw({host:tsIp});

var intervalle = 1; // minutes entre les checks sur ts
var spamBuffer = 30; // minutes de cool-down entre 2 tweets
var tsKeepAlive = 5; // heures pendant lesquelles on laisse le bot rouler
var peepsOnline = 0; // personnes en ligne sur Teamspeak
var status = ''; // contenu du statut twitter qui est publié

const Twitter = require('twitter-lite');
const client = new Twitter({
  subdomain: "api",
  version: "1.1",
  consumer_key: twApiKey,
  consumer_secret: twApiSKey,
  access_token_key: twAT,
  access_token_secret: twATs
});

var tweetSentYet = false;
var tweetSentDate = new Date();


// ------------------- MAIN -------------------------
createQuery();

var mainLoop = setInterval(() => {
  console.log('\n\n[--- UFO KEK PAGING SYSTEM ---]');
  getPeepsOnline();
  console.log(peepsOnline + ' person(s) online.');

  if (peepsOnline >= 2){
    console.log('Sending tweet : \n'+status);
    if (tweetSentYet){
      let now = new Date();
      let timeElapsed = now - tweetSentDate;
      timeElapsed /= 1000;
      if (timeElapsed > spamBuffer*60){
        sendTweet();
      } else {
        console.log('I wanna, but I\'m not sending the tweet because I\'m a good bot and it hasn\'t been 30 min since my last one! :)');
      }
    } else {
      sendTweet();
    }
  } else {
    console.log('Not sending tweet...');
  }
}, intervalle * 60000);


// ------------------ FUNCTIONS ---------------------

// Open teamspeak connexion
function createQuery(){
  query.keepalive.enable();
  query.keepalive.setDuration(tsKeepAlive*60*60);
  query.send('login', tsSqUsername, tsSqPassword)
  .then(() => query.send('use', 1))
  .catch(err => console.error('An error occured:', err));
}

// Get teamspeak clients online
function getPeepsOnline(){
  query.send('clientlist')
  .then((r) => parseClientList(r))
  .catch(err => console.error('An error occured:', err));
}

// Counts clients other than himself and generate twitter status
function parseClientList(r) {
  let clientTypeCount = 0
  for (const client_type in r["client_type"]){
     if (r["client_type"][client_type] === '0') {
        clientTypeCount++;
     }
  }
  peepsOnline = clientTypeCount - 1;
  status = 'Don\'t miss out! There\'s currently '+ peepsOnline +' of your friends online on the Teamspeak server! \n- ufo kek paging services ('+ makeid(10) +')';
}

// Send a tweet with current status
function sendTweet() {
  client.post('statuses/update', {
    status: status
  })
  .then(results => {
    console.log('Tweet sent! -- Won\'t tweet again for the next 30 min.');
    tweetSentYet = true;
    tweetSentDate = new Date();
  })
  .catch(error => {
    console.log('Error!!!',error);
    query.disconnect();
    clearInterval(mainLoop);
  });
}

// Generate random strings of character to prevent identical tweets
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}