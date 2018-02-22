const botClient = require('bot-client')

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyC6tvKozJWGZ7b_jVhQT6iv8ai127jDkyg'
});

//$env:WS_ENDPOINT="https://ws-bots.teslatele.com/"; nodemon index.js

const creds = {
  
}
const { comment } = botClient.connect(creds);

const State = {
  waitingStartAdress: false,
  waitingFinishAdress: false,
  waitingLength: false,
  waitingWidth: false,
  waitingHeight: false
};

let startAdress, finishAdress, myLength, myWidth, myHeight, volume;

async function createComment(teamId, to, answer) {
  let att = [{ type: 'text', data: { text: answer } }];
  await comment.create(teamId, {to, att});
}

comment.onDirect(async message => {
  const teamId = message.teamId;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  console.log('MESG ', message.data.content.att[0])

  if (text.match(/new/)) {
    let answer = 'Введите начальный адрес:';
    await createComment(teamId, to, answer);
    State.waitingStartAdress = true;
    return;
  }
  if (State.waitingStartAdress) {
    State.waitingStartAdress = false;
    startAdress = text;
    console.log('startAdress: ', startAdress);
    let answer = 'Введите конечный адрес:';
    await createComment(teamId, to, answer);
    State.waitingFinishAdress = true;
    return;
  }

  if (State.waitingFinishAdress) {
    State.waitingFinishAdress = false;
    finishAdress = text;
    console.log('finishAdress', finishAdress);

    googleMapsClient.distanceMatrix({
      origins: startAdress,
      destinations: finishAdress
    },async function(err, response) {
      if (!err) {
        console.log('dist: ', response.json.rows[0].elements[0].distance.text);
        await createComment(teamId, to, response.json.rows[0].elements[0].distance.text)
      } 
    })
    State.waitingLength = true;
    return;
  }

  if (State.waitingLength) {
    State.waitingLength = false;
    let answer = 'Введите длину груза: ';
    myLength = text;
    await createComment(teamId, to, answer);
    State.waitingWidth = true;
    return;
  }

  if (State.waitingWidth) {
    State.waitingWidth = false;
    let answer = 'Введите ширину груза: ';
    myWidth = text;
    await createComment(teamId, to, answer);
    State.waitingHeight = true;
    return;
  }

  if (State.waitingHeight) {
    State.waitingHeight = false;
    let answer = 'Введите высоту груза: ';
    myHeight = text;
    await createComment(teamId, to, answer);
    volume = Number(myLength) * Number(myHeight) * Number(myWidth); 
    await createComment(teamId, to, 'Объем: ' + volume);
    return;
  }

})