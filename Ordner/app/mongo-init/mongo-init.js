db = db.getSiblingDB('chatterboxDB');

db.createCollection('images');

db.images.insert([
    {
        filename: "example.jpg",
        path: "/path/to/image.jpg",
        contentType: "image/jpeg",
        senderId: "1",
        senderUsername: "user1",
        receiverId: "2",
        createdAt: new Date()
    }
]);

db.createUser({
    user: 'appuserTESTTESTTESTkdadmakdmakdmakdmakamdkamnkymxkymxlamnm',
    pwd: 'passwadakdkammakmdakTESTTESTTESTjdnakdmakldmaord123',
    roles: [
        {
            role: 'readWrite',
            db: 'chatterboxDB'
        }
    ]
});
