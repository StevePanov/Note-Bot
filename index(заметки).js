const moment = require('moment');
const botClient = require('bot-client')
//$env:WS_ENDPOINT="https://ws-bots.teslatele.com/"; nodemon index.js

//mongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017'
// только что созданные вами авторизационные данные
const creds = {
}
const { comment, thread, stream, contact } = botClient.connect(creds);

var chooseStreamName = [];
var chooseStreamId = [];
var streamName = [];

// async function connectMongo() {
//   var mongo = await mongoClient.connect(url); // подключение к монго
//   //var myAwesomeDB = await mongo.db('clients'); // присваем переменной базу clients
//   // myAwesomeDB.insert(note);
//   return;
// }

var dateTimestamp = new Date().getTime(); // timestamp в мс
var date = new Date();

const State = {
  waitingNewTitle: false,
  waitingNewDay: false, 
  waitingNewBody: false, 
  waitingNewStream: false,
  waitingNewNameStream: false,
  waitingNameDelete: false,
  waitingChooseStream: false,
  waitingNewChooseStream: false,
  waitingChooseStreamAdmin: false,
  waitingUserId: false,
  waitingDeleteId: false,
  waitingChooseStreamDeleteUser: false,

  waitingChooseStreamUser: false,

  waitingChooseSetUser: false,

  notes: [],
  context: {},
};


function timeOut(date) {
  return (date.getDate() + '.' + '0' + (date.getMonth() + 1) + '.' + date.getFullYear());
}

async function createComment(teamId, to, answer) {
  let att = [{ type: 'text', data: { text: answer } }];
  await comment.create(teamId, {to, att});
}

comment.onDirect(async message => {
  const teamId = message.teamId;
  const to = message.data.content.from;
  const { data: { text } } = message.data.content.att[0];

//---------------------------------------------------------------------
//ans - коммент
  async function allStreams(stream, teamId, ans1) {
    const streams = await stream.read(teamId, {}); // считываем все потоки
    for (var i = 0; i < streams.data.length; i++) {
      //if (streams.data[i].admins[0] == message.data.content.to[0]) { показ только тех стримов пользователя где он админ
        streamName.push(streams.data[i].name)
     // }
    }
    const answer = ans1 + streamName.join('\n'); //вывод имен потоков списком 
    await createComment (teamId, to, answer);

    return;
  }

async function chooseStream(stream, teamId, ans2) {

    const streams = await stream.read(teamId, {});
    for ( var i = 0; i < streams.data.length; i++) {
      if (streams.data[i].name == text) {
        chooseStreamName.push(streams.data[i].name);//выбранное имя стрима 
        chooseStreamId.push(streams.data[i]._id);//выбранный id стрима
      } 
    }
    console.log('chooseStreamId   ', chooseStreamId);
    console.log('chooseStreamName   ', chooseStreamName);
    await createComment(teamId, to, 'Вы выбрали поток с именем: ' + text);
    await createComment(teamId, to, ans2);

    return;
}
// ------------------------------------------------------------------------------
  if (text.match(/delete user/)) {
    const ans1 = 'Выберите поток для удаления пользователя: \n';
    await allStreams(stream, teamId, ans1);
    State.waitingChooseStreamDeleteUser = true;
    streamName = [];
    return;
  }

  if (State.waitingChooseStreamDeleteUser) {
    State.waitingChooseStreamDeleteUser = false;
    const ans2 = 'Выберите имя пользователя для удаления: \n' ;
    const streams = await stream.read(teamId, {});
    let chooseUserId = [];
    // for (let i = 0; i < streams.data.length; i++) {
    //   if (chooseStreamName[0] == streams.data[i].name) {
    //     for (var k = 0; k < streams.data[i].roles.length; k++) {
    //       chooseUserId.push(streams.data[i].roles[k]);
    //       chooseStreamId.push(streams.data[i]._id);
    //     }
    //   }
    // }
    
    await chooseStream(stream, teamId, ans2);
    State.waitingDeleteId = true;
    return;
  }

  if (State.waitingDeleteId) {
    State.waitingDeleteId = false;
    
    //for (var i = 0; i < streams.data.length; i++) {
    //   if (chooseStreamName[0] == streams.data[i].name) {
    //     for (var k = 0; k < streams.data[i].roles.length; k++) {
    //       chooseUserId.push(streams.data[i].roles[k]);
    //       chooseStreamId.push(streams.data[i]._id);
    //     }
    //   }
    // }
    
    for (var i = 0; i < chooseUsersName.length; i++) {
      if (chooseUsersName[i] == text) {//находим пользователя с введенным НИКОМ для удаления
        var streamId = chooseStreamId[0];
        await stream.deleteUser(teamId, {streamId, userId: text});
        await createComment(teamId, to, 'Пользователь удален с id: ' + text);
      }
    }
    return;
  }

   // поиск по ID

    // for (var i = 0; i < chooseUserId.length; i++) {
    //   if (chooseUserId[i] == text) {//находим пользователя с введенным id для удаления
    //     var streamId = chooseStreamId[0];
    //     await stream.deleteUser(teamId, {streamId, userId: text});
    //     await createComment(teamId, to, 'Пользователь удален с id: ' + text);
    //   }
    // }
     
    

  
//----------------------------------------------------------------------------------
  if (text.match(/date/)) { //тест вывода даты
    // const answer = timeOut(date);
    // const att = [{ type: 'text', data: { text: 'Дата: ' + answer } }];
    // await comment.create(teamId, { to, att });
    console.log(moment.unix(dateTimestamp));
    await createComment(teamId, to, dateTimestamp);
    return;
  }

 
//----------------------------------------------------------------------------------
  if (text.match(/find users/)) {
    console.log('call mongo')
    const mongo = await mongoClient.connect(url) // подключение к монго
    const myAwesomeDB = await mongo.db('clients') // присваем переменной базу clients
    const answer = await myAwesomeDB.collection('users').find({}).toArray() // в коллекцию users делаем запрос, чтобы вывести все записи 
    const att = [{ type: 'text', data: { text: JSON.stringify(answer) } }]
    await comment.create(teamId, {to, att})
    console.log('answer > ', answer)
    mongo.close() // закрываеми соединение
  }

//-----------------------------------------------------------------------------
  // if (text.match(/list notes/)) {
  //   const answer = State.notes.map(note => note.title).join('\n');
  //   const att = [{ type: 'text', data: { text: answer } }];
  //   await comment.create(teamId, { to, att });
  //   return;
  // }
// --------------------------------------------------------------------------
  if (text.match(/new note/)) {
    // flag_1 = State.waitingNewChooseStream;
    // flag_2 = State.waitingNewTitle;
    const ans1 = 'Выберите поток для добавления заметки: \n';
    await allStreams(stream, teamId, ans1);
    State.waitingNewChooseStream = true;
    streamName = [];
    return;
    // State.waitingNewChooseStream = true; 
  }

  if (State.waitingNewChooseStream) {
    State.waitingNewChooseStream = false;
    const ans2 = 'Введите имя заметки:';
    await chooseStream(stream, teamId, ans2);
    // await createComment(teamId, to, );
    State.waitingNewTitle = true;
    return;
  }

  if (State.waitingNewTitle) {
    State.waitingNewTitle = false;
    
    State.context.title = text;
    let title = State.context.title;

    const streams = await stream.read(teamId, {});
    for ( var i = 0; i < streamName.length; i++) {
      if (chooseStreamName[0] == streams.data[i].name) {
        chooseStreamId.push(streams.data[i]._id);
      }
    }
    var streamId = chooseStreamId[0];
    var streamInfo = await stream.read(teamId, {id: streamId});
    await thread.create(teamId, {streamId, title, statusId: `${streamInfo.data[0].threadStatuses[0]}`});
    // console.log('status >', streamInfo.data[0].threadStatuses[0]);
    await createComment(teamId, to, 'Заголовок добавлен, введите описание:');
    // ---------------------------------------------------
    const mongo = await MongoClient.connect(url);
    const myAwesomeDB = await mongo.db('botNotes');
    const addToCollection = await myAwesomeDB.collection('documents').insert({title: title});
    
    //const answerFromMongo = await myAwesomeDB.collection('documents').find({}).toArray();
    //console.log(answerFromMongo);
    //await createComment(teamId, to, JSON.stringify(answerFromMongo));
  
    State.waitingNewBody = true; 
    return;
  }

  if (State.waitingNewBody == true) {
    State.waitingNewBody = false;
    State.context.body = text;
    let body = State.context.body;
    State.context = {};
    State.notes.push(State.context);
    await thread.setDescription(teamId, {streamId, content: JSON.stringify(body)});
    await createComment(teamId, to, 'Заметка создана');
    
    return;
  }


//------------------------------------------------------------
  if (text.match(/list thread/)) {
    var listThread = [];
    const threads = await thread.read(teamId, {});
    for (var i = 0; i < threads.data.length; i++) {
      listThread.push(threads.data[i].title);
    }
    await createComment(teamId, to, 'Список заметок:\n' + listThread.join('\n'));
     
    return;
  }


//-----------------------------------------------------------------
  if (text.match(/create stream/)) {
    await createComment(teamId, to, 'Введите название потока:');
    State.waitingNewStream = true;
    return;
  } 
  if (State.waitingNewStream == true) {
    State.waitingNewStream = false;
    const streams = await stream.read(teamId, {});
    var k = 0;
    for (var i = 0; i < streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        k++
      }
    }
    if (k == 0) {
    const res = await stream.create(teamId, {name : text})
    streamId = res.data.id
    stream.setUser(teamId, {id: streamId, userId: to})
    stream.setAdmin(teamId, {id: streamId, userId: to})
    await createComment(teamId, to, 'Поток создан с именем: ' + text);
    console.log('Поток создан с именем: ' + text);
    }
    else {
      await createComment(teamId, to, 'Поток с именем ' + text + ', уже существует');
      console.log('Поток с именем ' + text + ', уже существует');
    }
    return;
  }


//---------------------------------------------------------------------
  if (text.match(/set admin/)) {
    const streams = await stream.read(teamId, {});
    for (var i = 0; i < streams.data.length; i++) {
      streamName.push(streams.data[i].name)
    }
    await createComment(teamId, to, 'Выберите поток для назначения админа: \n' + streamName.join('\n'));
    
    State.waitingChooseStreamAdmin = true;

    return;
  }
  if (State.waitingChooseStreamAdmin == true) {
    State.waitingChooseStreamAdmin = false;
    const streams = await stream.read(teamId, {});
    for ( var i = 0; i < streamName.length; i++) {
      if (streamName[i] == text) {
        chooseStreamName.push(streamName[i]);
      } 
    }
    await createComment(teamId, to, 'Вы выбрали поток с именем: ' + text);
    await createComment(teamId, to, 'Введите id пользователя:');
    State.waitingUserId = true;

    return;
  }

  if (State.waitingUserId == true) {
    State.waitingUserId = false;
    let chooseUserId = [];
    const streams = await stream.read(teamId, {});
    for (var i = 0; i < streams.data.length; i++) {
      if (chooseStreamName[0] == streams.data[i].name) {
        for (var k = 0; k < streams.data[i].roles.length; k++) {
        chooseUserId.push(streams.data[i].roles[k]);
        chooseStreamId.push(streams.data[i]._id);
        }
        
      }
    }
    for (var i = 0; i < chooseUserId.length; i++) {
      if (chooseUserId[i] == text) {
       
        var streamId = chooseStreamId[0];
        await stream.setAdmin(teamId, {streamId, userId: text});
        const att = [{ type: 'text', data: { text: 'Админ назначен с id: ' + text } }];
        await comment.create(teamId, { to, att });
      }
    }
        
    return;
  }
//------------------------------------------------------------------------------

  // if (text.match(/new thread/)) {
  //     const statusId = await stream.read(teamId, {id: streamId})
  //     const status = statusId.data[0].threadStatuses[0]
  //     const res = await thread.create(teamId, {
  //       statusId: status,
  //       streamId: streamId,
  //       title: 'new thread'
  //     })
  // }

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
    const answer = 'Выберите поток для изменения имени: \n';
    await allStreams(stream, teamId, answer);    
    State.waitingChooseStream = true;
    streamName = [];
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
    await createComment(teamId, to, 'Вы выбрали поток с именем: ' + text);
    await createComment(teamId, to, 'Введите новое имя потока:');
    State.waitingNewNameStream = true;

    return;
  }
    if (State.waitingNewNameStream == true) {
      State.waitingNewNameStream = false;
      const streams = await stream.read(teamId, {});
      
      for (var i = 0; i < streams.data.length; i++) {
        if (streams.data[i].name == chooseStreamName[0]) {
          await stream.setName(teamId, {id: streams.data[i]._id, name: text } );
          await createComment(teamId, to, 'Имя потока изменено');
        }
      
    }
    return;
  } 
 
//====================================
if (text.match(/set user/)) {
  const answer = 'Выберите поток для добавления пользователя: \n';
  await allStreams(stream, teamId, answer);
  State.waitingChooseStreamUser = true;
  streamName = [];
  return;
}
if (State.waitingChooseStreamUser == true) {
  State.waitingChooseStreamUser = false;
  let contactName = [];
  const contacts = await contact.read(teamId, {});
  for (let i = 0; i < contacts.data.length; i++) {
    contactName.push(contacts.data[i].basicData.name);
  }
  const answer = 'Выберите имя пользователя для добавления в поток: \n' + contactName.join('\n');
  await chooseStream(stream, teamId, answer);
  State.waitingChooseSetUser = true;

  return;
}
if (State.waitingChooseSetUser) {
  State.waitingChooseSetUser = false;
  const contacts = await contact.read(teamId, {});
  for (let i = 0; i < contacts.data.length; i++) {
    if (contacts.data[i].basicData.name == text) {
      await stream.setUser(teamId, {id: chooseStreamId[0], userId: contacts.data[i]._id});
    } 
    // else {
    //   await createComment(teamId, to, 'К сожалению, пользователя ' + text + ', не найдено'); 
    // }
  }
  await createComment(teamId, to, 'Вы добавили пользователя ' + text + ', в поток ' + chooseStreamName[0]); 
  
  return;
}


});