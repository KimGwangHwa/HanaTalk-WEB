const functions = require('firebase-functions');
const admin = require('firebase-admin');
var teamRef

admin.initializeApp(functions.config().firebase);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.commentPush = functions.database.ref('/LikeRelations/{id}/liked')
.onWrite(event => {
  console.log("#############", event);

  const item = event.data;
  const uid = item.child("uid").val();
  // const receiverUid = item.child("receiver").val();
  const textMessage = "Cloud Functions Test";//item.child("text").val();

  teamRef = functions.firestore.document('UserInfo/' + uid);
  teamRef.once('value').then(function(snapshot) {
    console.log("#############", snapshot.val());
    const fcmToken = snapshot.val().fcmToken;

    // 通知のJSON
    const payload = {
      notification: {
        title: fcmToken,
        body: "さん：" + textMessage,
        badge: "1",
        sound:"default",
      }
    };
    // tokenが欲しい
    pushToDevice(fcmToken, payload);
  });
});

// TODO: uidを使ってuserのdatabaseを検索
var getTargetFcmToken = function(uid, callback){
  console.log("getTargetFcmToken:");

  const rootRef = teamRef.parent.parent;
  const userRef = rootRef.child("users").child(uid);

  userRef.once('value').then(function(snapshot) {
    const isOn = snapshot.val().commentPush;
    console.log("isOn:", isOn);

    if (isOn == false) {
      // 通知設定がOFFの場合
      console.log("return callback null");
      callback(null);
      return
    }
    const fcmToken = snapshot.val().fcmToken

    console.log("return callback fcmToken", fcmToken);
    callback(fcmToken);
  });
}

// 特定のfcmTokenに対してプッシュ通知を打つ
function pushToDevice(token, payload){
  console.log("pushToDevice:", token);

  // priorityをhighにしとくと通知打つのが早くなる
  const options = {
    priority: "high",
  };

  admin.messaging().sendToDevice(token, payload, options)
  .then(pushResponse => {
    console.log("Successfully sent message:", pushResponse);
  })
  .catch(error => {
    console.log("Error sending message:", error);
  });
}
