import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'email name googleRefreshToken');
        console.log("=== USERS IN DATABASE ===");
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
