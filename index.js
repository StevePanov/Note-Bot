
const botClient = require('bot-client')
//$env:WS_ENDPOINT="https://ws-bots.teslatele.com/"; nodemon index.js

//mongoDB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017'
// только что созданные вами авторизационные данные
const creds = {
  email: "steve@test.ru",
  password: "1234"
}
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

  notes: [],
  context: {},
};
var flag_1 = State.waitingChooseStreamDeleteUser;
var flag_2 = State.waitingDeleteId;

function timeOut(date) {
  return (date.getDate() + '.' + '0' + (date.getMonth() + 1) + '.' + date.getFullYear());
}
const { comment, thread, stream } = botClient.connect(creds);

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
async function allStreams(stream, teamId, ans1, flag_1) {
    const streams = await stream.read(teamId, {}); // считываем все потоки
    for (var i = 0; i < streams.data.length; i++) {
      streamName.push(streams.data[i].name); //пушим имена потоков
    }
    const answer = ans1 + streamName.join('\n'); //вывод имен потоков списком 
    await createComment (teamId, to, answer);
    //flag_1 = true;
    
    return;
  }

async function chooseStream(stream, teamId, ans2, flag_2) {

    const streams = await stream.read(teamId, {});
    for ( var i = 0; i < streamName.length; i++) {
      if (streamName[i] == text) {  //проверка на выбор потока
        chooseStreamName.push(streamName[i]); //пушим выбранный поток в массив
      }
    }
    await createComment(teamId, to, 'Вы выбрали поток с именем: ' + text);
    await createComment(teamId, to, ans2);
    //flag_2 = true;

    return;
}
// ------------------------------------------------------------------------------
  if (text.match(/delete user/)) {
    const ans1 = 'Выберите поток для удаления пользователя: \n';
    await allStreams(stream, teamId, ans1, flag_1=true);
    
    streamName = [];
    return;
  }

  if (flag_1 == true) {
    flag_1 = false;
    const ans2 = 'Введите id пользователя:';
    await chooseStream(stream, teamId, ans2, flag_2=true);
    return;
  }

  if (flag_2 == true) {
    flag_2 = false;
    var chooseUserId = []; 
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
      if (chooseUserId[i] == text) {//находим пользователя с введенным id для удаления
        var streamId = chooseStreamId[0];
        await stream.deleteUser(teamId, {streamId, userId: text});
        await createComment(teamId, to, 'Пользователь удален с id: ' + text);
      }
    }
        
    return;
  }
  
//----------------------------------------------------------------------------------
  if (text.match(/date/)) { //тест вывода даты
    const answer = timeOut(date);
    const att = [{ type: 'text', data: { text: 'Дата: ' + answer } }];
    await comment.create(teamId, { to, att });
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
    flag_1 = State.waitingNewChooseStream;
    flag_2 = State.waitingNewTitle;
    const ans1 = 'Выберите поток для добавления заметки: \n';
    await allStreams(stream, teamId, ans1, flag_1=true);
    
    streamName = [];
    return;
    // State.waitingNewChooseStream = true; 
  }
  // if (State.waitingNewChooseStream == true) {
  //   State.waitingNewChooseStream = false;

  //   const streams = await stream.read(teamId, {});
  //   for ( var i = 0; i < streamName.length; i++) { 
  //     if (streamName[i] == text) {
  //       chooseStreamName.push(streamName[i]);
  //     }
  //   }
    
  //   let att = [{ type: 'text', data: { text: 'Вы выбрали поток с именем: ' + text } }];
  //   await comment.create(teamId, {to, att});
  //   att = [{ type: 'text', data: { text: 'Введите имя заметки:' } }];
  //   await comment.create(teamId, {to, att});
  //   State.waitingNewTitle = true;

  //   return;
  // }

  if (State.waitingNewTitle == true) {
    State.waitingNewTitle = false;
    
    State.context.title = text;
    let title = State.context.title + ' / ' + timeOut(date);

    const streams = await stream.read(teamId, {});
    for ( var i = 0; i < streamName.length; i++) {
      if (chooseStreamName[0] == streams.data[i].name) {
        chooseStreamId.push(streams.data[i]._id);
      }
    }
    var streamId = chooseStreamId[0];
    var streamInfo = await stream.read(teamId, {id: streamId});
    await thread.create(teamId, {streamId, title, statusId: `${streamInfo.data[0].threadStatuses[0]}`});
    console.log('status >', streamInfo.data[0].threadStatuses[0]);
    const att = [{ type: 'text', data: { text: 'Заголовок добавлен, введите описание:' } }];
    await comment.create(teamId, { to, att });
    // ---------------------------------------------------
    const mongo = await MongoClient.connect(url);
    const myAwesomeDB = await mongo.db('botNotes');
    const addToCollection = await myAwesomeDB.collection('documents').insert({title: title});
    
    const answerFromMongo = await myAwesomeDB.collection('documents').find({}).toArray();
    console.log(answerFromMongo);
    await createComment(teamId, to, JSON.stringify(answerFromMongo));
  
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
    const ans =  'Заметка создана';
    await createComment(teamId, to, ans);
    
    
    // let a = {description: body};
    // await connectMongo(a);
    //console.log(a);
    return;
  }


//------------------------------------------------------------
  if (text.match(/list thread/)) {
    var listThread = [];
    const threads = await thread.read(teamId, {});
    for (var i = 0; i < threads.data.length; i++) {
      listThread.push(threads.data[i].title);
    }
    const att = [{ type: 'text', data: { text: 'Список заметок:\n' + listThread.join('\n')} }];
    await comment.create(teamId, {to, att});
    var users = [{name: "Bob", age: 34} , {name: "Alice", age: 21}, {name: "Tom", age: 45}];
    mongoClient.connect(url);
      db.collection("users").insertMany(users);
        console.log(users);
        db.close();
        
    return;
  }


//-----------------------------------------------------------------
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
    const att = [{type: 'text', data: {text: 'Поток создан с именем: ' + text}}]
    await comment.create(teamId, {to, att})
    }
    else {
      const att = [{type: 'text', data: {text: 'Поток с именем ' + text + ', уже существует'}}]
      await comment.create(teamId, {to, att})
    }
    return;
  }


//---------------------------------------------------------------------
  if (text.match(/set admin/)) {
    const streams = await stream.read(teamId, {});
    for (var i = 0; i < streams.data.length; i++) {
      streamName.push(streams.data[i].name)
    }
    const answer = 'Выберите поток для назначения админа: \n' + streamName.join('\n');
    const att = [{ type: 'text', data: { text: answer } }];
    await comment.create(teamId, { to, att });
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
    let att = [{ type: 'text', data: { text: 'Вы выбрали поток с именем: ' + text } }];
    await comment.create(teamId, {to, att});
    att = [{ type: 'text', data: { text: 'Введите id пользователя:' } }];
    await comment.create(teamId, {to, att});
    State.waitingUserId = true;

    return;
  }

  if (State.waitingUserId == true) {
    State.waitingUserId = false;
    var chooseUserId = [];
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
