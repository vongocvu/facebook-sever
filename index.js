const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose")
const cors = require('cors');
require("dotenv").config();

const GroupPublic = require("./src/models/GroupPublic")
const User = require('./src/models/User')


const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server, {
      cors: {
            origin: "*",
            method: ["GET","POST"]
      }
});

mongoose.set('strictQuery', true);


app.use(function (req, res, next) {

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      next();

});

io.on('connection', (socket) => {

      socket.on('user_connected', async (user) => {
           await User.findByIdAndUpdate(user._id, {
               online: true
           })

           io.emit('user_connecting', user)
      })

      socket.on('user_disconnected', async (user) => {
            await User.findByIdAndUpdate(user._id, {
                  online: false
            })
   
            io.emit('user_disconnecting', user)
      })

      socket.on('get_users_online' , async (user) => {
            const Users = await User.find({ $and: [{online: true}, { friends: { $in: user._id }}]})
            io.emit('UsersOnline', Users)
      })

      socket.on('get_rooms', async (user) => {
           try {
           const Groups = await await GroupPublic.find({ members: { $in: user } })
                  io.emit('get_rooms', Groups)
           } catch (err) {
              io.emit('get_romms', [])
           }
      })

      socket.on('message', (data) => {
            io.emit('message', {
                  sender: {
                        _id: data.sender._id,
                        avatar: data.sender.avatar,
                        username: data.sender.username
                  },
                  group: data.group,
                  content: data.content,
                  event: data.event ? true : false,
                  image: data.image,
                  _id: data._id
            });
      });

      socket.on('imageMessage', data => {
            io.emit("imageMessage", data)
      })

      socket.on('createGroup', (data) => {
            io.emit('createGroup', data)
      })

      socket.on('newComment', (comment) => {
          io.emit('comment', comment)
      })

      socket.on('UpdateNewComment', (comment) => {
            io.emit('UpdateComment', comment)
        })
});



app.use(cookieParser())
app.use(express.json());
  
  
  mongoose.connect(process.env.CONNET_MONGODB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
      }
  )
.then(() => {
            console.log('Đã kết nối thành công với MongoDB');
})
.catch((error) => {
      console.error('Lỗi kết nối đến MongoDB:', error);
});

// Đăng ký sự kiện khi kết nối bị đóng lại
mongoose.connection.on('disconnected', () => {
      console.log('Đã mất kết nối đến MongoDB');
});

const authRoute = require("./src/routers/auth")
const messageRoute = require("./src/routers/message")
const groupPublicRoute = require("./src/routers/groupPublic")
const groupPrivateRoute = require("./src/routers/groupPrivate")
const postRoute = require("./src/routers/post")
const postDetailRoute = require("./src/routers/postDetail")
const commentRoute = require("./src/routers/comment")
const groupRoute = require("./src/routers/group")
const storieRoute = require("./src/routers/storie")


app.use("/api/v1/auth", authRoute)
app.use("/api/v1/message", messageRoute)
app.use("/api/v1/groupPublic", groupPublicRoute)
app.use("/api/v1/groupPrivate", groupPrivateRoute)
app.use("/api/v1/post", postRoute)
app.use("/api/v1/postDetail", postDetailRoute)
app.use("/api/v1/comment", commentRoute)
app.use("/api/v1/group", groupRoute)
app.use("/api/v1/storie", storieRoute)

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log("RESTful API server started on: " + port);
});
