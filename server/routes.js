var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var mongoose = require('mongoose');

const models = require('./models');
const User = models.User;
const Document= models.Document;

var validateReq = function(userData) {
  return (userData.password === userData.passwordRepeat);
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.post('/login', (req, res)=> {
  User.findOne({username: req.body.username})
  .then(result=> {
    if (result.password === req.body.password){
      res.json({"userId":result._id});
    }else{
      res.json({"status": "abcincorrect credentials"});
    }
  }).catch(err=> {
    res.json({"status": "incorrect credentials"});
  })
});


/*
  EXPECTS
  {
  username:
  password:
  passwordRepeat:
}
*/
app.post('/register', (req, res)=> {
  if (!validateReq(req)) {
    res.json({ error: 'invalid registration'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    newUser.save(function(error){
      if (error){
        res.json({"error": error})
      }else{
        res.json({"status": 200});
      }
    })
  }
})

app.get('/', function(req, res){
  res.send('test');
})

/** OTHER ROUTES **/

app.post('/editDoc', (req, res)=>{
  Document.findById(req.body.docId)
  .then(result => {
    if (result.password === req.body.password){
      res.json({"status":"200"});
    }else{
      res.json({"error":"incorrect password"});
    }
  }).catch(err => {
    res.json({"error": err});
  })
  /* expects
   {
    docId:
    password:
  }*/
})

app.post('/create', (req, res)=> {
  /* expects
   {
    userId:
    title:
    password:
  }*/
  console.log('create route', req.body);

  let newDoc = new Document({
    owner: req.body.userId,
    title: req.body.title,
    password: req.body.password,
    createdTime: new Date(),
  });
  newDoc.save(function(err, doc) {
    console.log(doc);
    if (err){
      res.json({"error": err});
    }else{
      Document.findOne({
        owner: req.body.userId,
        title: req.body.title
      }).then(result=> {
        res.json({"docId": result._id});
      })
    }
  })
})


app.post('/save', function(req, res){
  //docId, content, title
  Document.findById(req.body.docId)
  .then(result=> {
    console.log('first find by id',result);
    Document.findByIdAndUpdate(req.body.docId, {
      content: result.content.concat(req.body.content),
      title: req.body.title
    }).then(newResult => {
      console.log('first find by id',newResult);

      res.json({"status":"200"});
    })
  }).catch(err=> {
    res.json({"error":err});
  });
})

//takes docId
app.get('/getDocInfo', function(req, res){
  console.log('get doc info');

  let docId = req.query.docId;

  Document.findById(docId)
  .populate('owner', `username`)
  .then(result=> {
    res.json({"document": result});
  }).catch(err=> {
    res.json({"error": err});
  })
})

app.get('/getAllDocs', function(req, res){
  let userId = req.query.userId;
  let userDocs = [];
  let collabDocs = [];

  Document.find({})
  .then(results => {
    results.forEach(eachDoc => {
      if (eachDoc.collaboratorList.includes(userId)){
        collabDocs.push({
          title: eachDoc.title,
          docId: eachDoc._id
        });
      }else if (eachDoc.owner == userId){
        userDocs.push({
          title: eachDoc.title,
          docId: eachDoc._id
        });
      }
    })
    res.json({
      userDocs: userDocs,
      collabDocs: collabDocs
    })
  }).catch(err=> {
    console.log(err);
    res.json({"error": err});
  })
});
