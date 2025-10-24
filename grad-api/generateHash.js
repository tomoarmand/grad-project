import bcrypt from 'bcrypt';

async function generateHash() {
    const password = '123456';
    const hash = await bcrypt.hash(password, 12);
    console.log('Password:', password);
    console.log('Hash to copy:', hash);
}

generateHash();