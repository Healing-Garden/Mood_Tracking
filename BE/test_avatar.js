// const mongoose = require('mongoose');
// const User = require('./src/models/users');
// const { getProfile } = require('./src/services/userService');

// async function test() {
//     await mongoose.connect('mongodb+srv://moodtracking:moodtracking123@cluster0.rwknjck.mongodb.net/Healing_Garden?retryWrites=true&w=majority');

//     const googleUser = await User.findOne({ authProvider: { $in: ['google', 'both'] } });

//     if (googleUser) {
//         console.log('Testing User:', googleUser.email);
//         const profile = await getProfile(googleUser._id);
//         console.log('getProfile returns avatarUrl:', profile.avatarUrl);
//     } else {
//         console.log('no user');
//     }

//     process.exit(0);
// }
// test();
