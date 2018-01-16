const botClient = require('bot-client')

//mongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017'
// только что созданные вами авторизационные данные
const creds = {
  email: "",
  password: ""
}
var chooseStreamName = [];
var streamName = [];

var options = {
  era: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  // weekday: 'long',
  // timezone: 'UTC',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
};

const State = {
  waitingNewTitle: false,
  waitingNewDay: false,
  waitingNewBody: false,
  waitingNewStream: false,
  waitingNewNameStream: false,
  waitingNameDelete: false,
  waitingChooseStream: false,
  notes: [],
  context: {},
};
// 5a4376e28b3b170015b413a0
const { comment, thread, stream } = botClient.connect(creds);

function getNotesOfDay(day) {
  switch (day) {
    case 'понедельник': {
      return [{ type: 'text', data: { text: 'нет заметок на понедельник' } }];
    }
    case 'вторник': {
      return [{ type: 'text', data: { text: 'нет заметок на вторник' } }];
    }
    case 'среда': {
      return [{ type: 'text', data: { text: 'нет заметок на среду' } }];
    }
    case 'четверг': {
      return [{ type: 'text', data: { text: 'нет заметок на четверг' } }];
    }
    case 'пятница': {
      return [{ type: 'text', data: { text: 'нет заметок на пятницу' } }];
    }
    case 'суббота': {
      return [{ type: 'text', data: { text: 'нет заметок на субботу' } }];
    }
    case 'воскресенье': {
      return [{ type: 'text', data: { text: 'нет заметок на воскресенье' } }];
    }
    default: {
      return null;
    }
  }
}



comment.onDirect(async message => {
  const teamId = message.teamId;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

  if (text.match(/date/)) {
    var date = new Date();
    console.log(date);
    console.log(date.toLocaleString("ru", options));
    return;
  }

  if (text.match(/find users/)) {
    console.log('call mongo')
    const mongo = await MongoClient.connect(url) // подключение к монго
    const myAwesomeDB = await mongo.db('clients') // присваем переменной базу clients
    const answer = await myAwesomeDB.collection('users').find({}).toArray() // в коллекцию users делаем запрос, чтобы вывести все записи 
    const att = [{ type: 'text', data: { text: JSON.stringify(answer) } }]
    await comment.create(teamId, {to, att})
    console.log('answer > ', answer)
    mongo.close() // закрываеми соединение
  }

  if (text.match(/new note/)) {
    const answer = 'Введите день недели';
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att });
    State.waitingNewDay = true;
    return;
  }

  if (text.match(/list notes/)) {
    const answer = State.notes.map(note => note.title).join('\n');
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att });
    return;
  }

  if (State.waitingNewDay == true) {
    State.waitingNewDay = false;
    State.waitingNewTitle = true;
    State.context.day = text;
    const answer = 'Введите заголовок';
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att });
    return;
  }

  if (State.waitingNewTitle == true) {
    State.waitingNewTitle = false;
    State.waitingNewBody = true;
    State.context.title = text;
    let title = State.context.title;
    // console.log('State.context.title > ', State.context.title);
    const answer = 'Заголовок добавлен, введите текст';
    const att = [{ type: 'text', data: { text: answer } }];
    const streamId = '5a5bb04b8b3b170015b4165b';
    const streamInfo = await stream.read(teamId, {id: streamId});
    // console.log('streamInfo > ', streamInfo.data[0].threadStatuses[0])
    await thread.create(teamId, {streamId, title, statusId: `${streamInfo.data[0].threadStatuses[0]}`});
    await comment.create(teamId, { to, att });
    return;
  }

  if (State.waitingNewBody == true) {
    State.waitingNewBody = false;
    State.context.body = text;
    const streamId = '5a5bb04b8b3b170015b4165b';
    const streamInfo = await stream.read(teamId, {id: streamId});
    let body = State.context.body;
    State.context = {};
    State.notes.push(State.context);
    const answer = 'Заметка создана';
    const att = [{ type: 'text', data: { text: answer } }];
    await thread.setDescription(teamId, {streamId, content: JSON.stringify(body)});
    await comment.create(teamId, { to, att });
    return;
  }

  if (
    [ 'понедельник',
      'вторник',
      'среда',
      'четверг',
      'пятница',
      'суббота',
      'воскресенье',
    ].indexOf(text) !== -1
  ) {
    const att = getNotesOfDay(text);
    await comment.create(teamId, { to, att });
    return;
  } 
  //else {
  //   const answer = 'Введите день недели: \n понедельник \n вторник \n среда \n четверг \n пятница \n суббота \n воскресенье';
  //   const att = [{ type: 'text', data: { text: answer } }];
  // }
  // if (text.match(/get stream/)) {
  //   const res = await stream.read(teamId, {id: '5a4376e28b3b170015b413a0'})
  //   const att = [{type: 'text', data: {text: JSON.stringify(res)}}]
  //   await comment.create(teamId, {to, att})
  // }
  if (text.match(/create stream/)) {
    const att = [{ type: 'text', data: { text: 'Введите название потока:' } }];
    await comment.create(teamId, {to, att})
    State.waitingNewStream = true;
    return;
  } 
  if (State.waitingNewStream == true) {
    State.waitingNewStream = false;
    const streams = await stream.read(teamId, {});
    var k = 0;
    for (var i=0; i<streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        k++
      }
    }
    if (k == 0) {
    const res = await stream.create(teamId, {name : text})
    streamId = res.data.id
    stream.setUser(teamId, {id: streamId, userId: to})
    stream.setAdmin(teamId, {id: streamId, userId: to})
    const att = [{type: 'text', data: {text: 'Поток создан с именем: ' + text}}]
    await comment.create(teamId, {to, att})
    }
    else {
      const att = [{type: 'text', data: {text: 'Поток с именем ' + text + ', уже существует'}}]
      await comment.create(teamId, {to, att})
    }
    return;
  }
  // if (text.match(/create stream/)) {
  //     const name = 'новый стрим'
  //     const res = await stream.create(teamId, {name : name})
  //     streamId = res.data.id
  //     stream.setUser(teamId, {id: streamId, userId: to})
  //     stream.setAdmin(teamId, {id: streamId, userId: to})
  //     const att = [{type: 'text', data: {text: JSON.stringify(res)}}]
  //     await comment.create(teamId, {to, att})
  // } 
  if (text.match(/new thread/)) {
      const statusId = await stream.read(teamId, {id: streamId})
      const status = statusId.data[0].threadStatuses[0]
      const res = await thread.create(teamId, {
        statusId: status,
        streamId: streamId,
        title: 'new thread'
      })
  }

  if (text.match(/read bots/)) { // считывает все streams
      const res = await stream.read(teamId, {})
      console.log (res)
      const att = [ {type:'text', data:{text: JSON.stringify(res) } } ];
      await comment.create(teamId, {to, att})
  }

//----------------------------------------------------------------------------
    if (text.match(/delete stream/)) {
      
      const streams = await stream.read(teamId, {});
      for (var i = 0; i < streams.data.length; i++) {
        if (streams.data[i].admins[0] == message.data.content.to[0]) {
          streamName.push(streams.data[i].name)
        }
      }
      var strName = streamName.join('\n');
      const att = [{ type: 'text', data: { text: 'Какой поток Вы хотите удалить?\n' + strName } }];
      await comment.create(teamId, { to, att });
      State.waitingNameDelete = true;

      return;
    }

    if (State.waitingNameDelete == true) {
      State.waitingNameDelete = false;
      const streams = await stream.read(teamId, {});
      
      for ( var i = 0; i < streams.data.length; i++) {
        if (streamName[i] == text) {
          await stream.delete(teamId, {id: streams.data[i]._id } );
          const att = [{ type: 'text', data: { text: 'Поток удален' } }];
          await comment.create(teamId, { to, att });
        }
      }
      streamName = [];
      return;
    }


//--------------------------------------------------------------------------------
  if (text.match(/set name/)) {

    let streamName = [];
    const streams = await stream.read(teamId, {});
    for (var i = 0; i < streams.data.length; i++) {
      if (streams.data[i].admins[0] == message.data.content.to[0]) {
        streamName.push(streams.data[i].name)
      }
    }

    const answer = 'Выберите поток для изменения имени: \n' + streamName.join('\n');
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att});
    State.waitingChooseStream = true;

    return;
  }
  
  if (State.waitingChooseStream == true) {
    State.waitingChooseStream = false;

    let streamName = [];
    const streams = await stream.read(teamId, {});
    for (var i = 0; i < streams.data.length; i++) {
      if (streams.data[i].admins[0] == message.data.content.to[0]) {
        streamName.push(streams.data[i].name)
      }
    }
    
    for ( var i = 0; i < streamName.length; i++) {
      if (streamName[i] == text) {
        chooseStreamName.push(streamName[i]);
      }
    }
    let att = [{ type: 'text', data: { text: 'Вы выбрали поток с именем: ' + text } }];
    await comment.create(teamId, {to, att});
    att = [{ type: 'text', data: { text: 'Введите новое имя потока:' } }];
    await comment.create(teamId, {to, att});
    State.waitingNewNameStream = true;

    return;
  }
    if (State.waitingNewNameStream == true) {
      State.waitingNewNameStream = false;
      const streams = await stream.read(teamId, {});
      
      for (var i = 0; i < streams.data.length; i++) {
        if (streams.data[i].name == chooseStreamName[0]) {
          await stream.setName(teamId, {id: streams.data[i]._id, name: text } );
          const att = [{ type: 'text', data: { text: 'Имя потока изменено' } }];
          await comment.create(teamId, { to, att });
        }
      
    }
    return;
  } 

});
