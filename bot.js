const qrcode = require('qrcode-terminal');
const {Client, LocalAuth} = require('whatsapp-web.js');


const colors = require('colors');  //terminal enhancement, can be removed.

// Custom modules for chat functionality and OpenAI GPT interaction
const chat_funcionalities = require('./chat_funcionality');
const GPT = require('./open_ai_gpt')

// Create a new WhatsApp client with local authentication method
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Display the QR code for user authentication
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log(colors.bold.green('[+] Client is ready!'));
});

// Listen for incoming messages from users
client.on('message', async message => {

    const chat = await message.getChat();
    let roleActionReq = message.body.includes("!act");
    const chatID = chat.id._serialized;
    await chat.sendStateTyping();

    // Create or retrieve the chat history file
    let filePath = 'chats_history/'+chat_funcionalities.removePattern(chatID) + '.json';
    
    await chat_funcionalities.createChatHistoryOrRetrieve(filePath);
    
    

    if(roleActionReq){
        // Extract the content after "!act" and log it as a system action
        let contentRegex = extractTextAfterAct(message.body);
        chat_funcionalities.writeChatHistory(filePath,{ role: 'system', content: contentRegex});
        GPT.messages.push({ role: 'system', content: contentRegex });
        await message.reply("trying to act like mentioned");
    }
    else{
        // Log user messages in chat history
        chat_funcionalities.writeChatHistory(filePath,{ role: 'user', content: message.body });
        GPT.messages.push({ role: 'user', content: message.body });
    }

    // Generate a response
    let answer = await GPT.askGPT();

    if(!roleActionReq){
        await chat.sendMessage(answer);
    }
    
    // Update the chat history
    GPT.chatHistory = await chat_funcionalities.createChatHistoryOrRetrieve(filePath);

    


});

// Initialize the WhatsApp client
client.initialize();